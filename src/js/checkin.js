// ============================================================
// 月签到系统
// - 每月 1 号 0 点重置
// - 每天可签到一次
// - 奖励随"本月累计签到次数"递增
// - 补签：过去未签的日期可用金币补签（每天 200 金币）
// - 满月奖励：签满整月获得额外奖励
// - 依赖：shopManager（金币）、levelManager（经验）
// ============================================================

const CHECKIN_STORAGE_KEY = 'tetrisCheckin';

// 每档奖励配置（按本月累计签到次数索引）
// index = 累计次数 - 1
const CHECKIN_REWARDS = [
    // 1-5
    { coins: 50,  exp: 20 },
    { coins: 60,  exp: 25 },
    { coins: 70,  exp: 30 },
    { coins: 80,  exp: 35 },
    { coins: 90,  exp: 40 },
    // 6-10
    { coins: 100, exp: 45 },
    { coins: 110, exp: 50 },
    { coins: 120, exp: 60 },
    { coins: 130, exp: 70 },
    { coins: 140, exp: 80 },
    // 11-20
    { coins: 150, exp: 90 },
    { coins: 160, exp: 100 },
    { coins: 170, exp: 110 },
    { coins: 180, exp: 120 },
    { coins: 190, exp: 130 },
    { coins: 200, exp: 140 },
    { coins: 210, exp: 150 },
    { coins: 220, exp: 160 },
    { coins: 230, exp: 170 },
    { coins: 240, exp: 180 },
    // 21-25
    { coins: 260, exp: 200 },
    { coins: 280, exp: 220 },
    { coins: 300, exp: 240 },
    { coins: 320, exp: 260 },
    { coins: 340, exp: 280 },
    // 26-29
    { coins: 360, exp: 300 },
    { coins: 380, exp: 320 },
    { coins: 400, exp: 340 },
    { coins: 420, exp: 360 },
    // 30
    { coins: 500, exp: 500, special: { type: 'consumable', id: 'double_exp', count: 2 } },
    // 31
    { coins: 600, exp: 600, special: { type: 'consumable', id: 'double_exp', count: 2 }, special2: { type: 'consumable', id: 'revive', count: 1 } }
];

// 补签价格（每天金币）
const CHECKIN_MAKEUP_PRICE = 200;

// ============================================================
// 日期工具（避免和其他模块的 pad2 / getTodayStr 重名）
// ============================================================
function ciPad2(n) { return String(n).padStart(2, '0'); }

function ciGetTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${ciPad2(d.getMonth()+1)}-${ciPad2(d.getDate())}`;
}

function ciGetMonthStr(d = new Date()) {
    return `${d.getFullYear()}-${ciPad2(d.getMonth()+1)}`;
}

function getMonthDays(year, month) {
    // month: 0-11
    return new Date(year, month + 1, 0).getDate();
}

function ciGetDateStr(y, m, d) {
    // m: 0-11
    return `${y}-${ciPad2(m+1)}-${ciPad2(d)}`;
}

// ============================================================
// 月签到管理器
// ============================================================
class CheckinManager {
    constructor() {
        // { month: '2025-09', signedDates: ['2025-09-01', ...] }
        this.state = null;
    }

    _createNewMonth(monthStr) {
        return { month: monthStr, signedDates: [] };
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY) || 'null');
            const currentMonth = ciGetMonthStr();
            if (saved && saved.month === currentMonth && Array.isArray(saved.signedDates)) {
                this.state = saved;
            } else {
                this.state = this._createNewMonth(currentMonth);
                this.save();
            }
        } catch (e) {
            this.state = this._createNewMonth(ciGetMonthStr());
            this.save();
        }
        this._checkMonthReset();
    }

    save() {
        try {
            localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(this.state));
            return true;
        } catch (e) {
            console.warn('[checkin] save failed:', e);
            return false;
        }
    }

    _checkMonthReset() {
        const currentMonth = ciGetMonthStr();
        if (!this.state || this.state.month !== currentMonth) {
            this.state = this._createNewMonth(currentMonth);
            this.save();
        }
    }

    isCheckedInToday() {
        return this.state.signedDates.includes(ciGetTodayStr());
    }

    getTotalCount() {
        return this.state.signedDates.length;
    }

    getMonthDaysCount() {
        const d = new Date();
        return getMonthDays(d.getFullYear(), d.getMonth());
    }

    getNextReward() {
        const idx = this.getTotalCount();
        if (idx >= CHECKIN_REWARDS.length) {
            return CHECKIN_REWARDS[CHECKIN_REWARDS.length - 1];
        }
        return CHECKIN_REWARDS[idx];
    }

    getSignedSet() {
        return new Set(this.state.signedDates);
    }

    checkin() {
        if (this.isCheckedInToday()) return { ok: false, reason: 'ALREADY_CHECKED_IN' };

        const reward = this.getNextReward();
        const rewardIdx = this.getTotalCount();

        this._applyReward(reward);

        this.state.signedDates.push(ciGetTodayStr());
        this.state.signedDates.sort();
        this.save();

        this._notifyRefresh();

        return { ok: true, count: rewardIdx + 1, reward };
    }

    makeup(dateStr) {
        const today = ciGetTodayStr();
        if (dateStr >= today) return { ok: false, reason: 'FUTURE_DATE' };
        if (this.state.signedDates.includes(dateStr)) return { ok: false, reason: 'ALREADY_SIGNED' };
        if (!dateStr.startsWith(this.state.month)) return { ok: false, reason: 'NOT_THIS_MONTH' };
        if (typeof shopManager === 'undefined') return { ok: false, reason: 'NO_SHOP' };
        if (shopManager.coins < CHECKIN_MAKEUP_PRICE) return { ok: false, reason: 'NOT_ENOUGH_COINS' };

        shopManager.coins -= CHECKIN_MAKEUP_PRICE;
        shopManager.save();

        this.state.signedDates.push(dateStr);
        this.state.signedDates.sort();
        this.save();

        this._notifyRefresh();

        return { ok: true, date: dateStr };
    }

    _applyReward(reward) {
        if (typeof shopManager !== 'undefined' && reward.coins > 0) {
            shopManager.addCoins(reward.coins);
        }
        if (typeof levelManager !== 'undefined' && reward.exp > 0) {
            levelManager.addExp(reward.exp);
            if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        }
        if (typeof shopManager !== 'undefined') {
            if (reward.special && reward.special.type === 'consumable') {
                const sid = reward.special.id;
                const scount = reward.special.count || 1;
                shopManager.consumables[sid] = (shopManager.consumables[sid] || 0) + scount;
            }
            if (reward.special2 && reward.special2.type === 'consumable') {
                const sid = reward.special2.id;
                const scount = reward.special2.count || 1;
                shopManager.consumables[sid] = (shopManager.consumables[sid] || 0) + scount;
            }
            shopManager.save();
        }
    }

    _notifyRefresh() {
        if (typeof updateShopBadge === 'function') updateShopBadge();
    }

    isFullMonth() {
        return this.getTotalCount() >= this.getMonthDaysCount();
    }
}

const checkinManager = new CheckinManager();

// ============================================================
// UI
// ============================================================
let checkinBtnTop = null;
let checkinPanel = null;
let checkinCalendarEl = null;
let checkinTotalEl = null;
let checkinMonthLabelEl = null;
let checkinStatusEl = null;
let checkinClaimBtn = null;

function initCheckin() {
    checkinManager.load();

    // 延迟获取 DOM（此时 main.js 已加载完 DOM）
    checkinBtnTop = document.getElementById('checkinBtnTop');
    checkinPanel = document.getElementById('checkinPanel');
    checkinCalendarEl = document.getElementById('checkinCalendar');
    checkinTotalEl = document.getElementById('checkinTotal');
    checkinMonthLabelEl = document.getElementById('checkinMonthLabel');
    checkinStatusEl = document.getElementById('checkinStatus');
    checkinClaimBtn = document.getElementById('checkinClaimBtn');

    if (checkinBtnTop) {
        checkinBtnTop.addEventListener('click', openCheckin);
    }
    const closeBtn = document.querySelector('.close-checkin');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hidePanel(checkinPanel);
            audioSystem.playSound('click');
        });
    }
    if (checkinClaimBtn) {
        checkinClaimBtn.addEventListener('click', handleCheckin);
    }
    updateCheckinBadge();

    // 每分钟检查跨天/跨月
    setInterval(() => {
        checkinManager._checkMonthReset();
        updateCheckinBadge();
    }, 60000);
}

function openCheckin() {
    if (!checkinPanel) return;
    renderCheckin();
    showPanel(checkinPanel);
    audioSystem.playSound('click');
}

function updateCheckinBadge() {
    if (!checkinBtnTop) return;
    const canCheckin = !checkinManager.isCheckedInToday();
    checkinBtnTop.classList.toggle('has-notification', canCheckin);
}

function handleCheckin() {
    const r = checkinManager.checkin();
    if (!r.ok) {
        if (r.reason === 'ALREADY_CHECKED_IN') {
            showSaveNotification('❌ ' + (languageManager.getText('checkinAlreadyDone') || '今日已签到'), true);
        }
        return;
    }
    const reward = r.reward;
    let msg = `🎉 ${languageManager.getText('checkinSuccess') || '签到成功'} · 💰+${reward.coins} ⭐+${reward.exp}`;
    if (reward.special || reward.special2) {
        msg += ` · 🎁`;
    }
    showSaveNotification(msg);
    audioSystem.playSound('targetIncrease');
    renderCheckin();
    updateCheckinBadge();
}

function renderCheckin() {
    if (!checkinCalendarEl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = getMonthDays(year, month);
    const today = ciGetTodayStr();
    const todayDate = now.getDate();
    const signedSet = checkinManager.getSignedSet();
    const totalCount = checkinManager.getTotalCount();
    const isCheckedIn = checkinManager.isCheckedInToday();

        // 标题（统一格式：2026-09）
    if (checkinMonthLabelEl) {
        const m = String(month + 1).padStart(2, '0');
        checkinMonthLabelEl.textContent = `${year}-${m}`;
    }

    // 累计签到次数
    if (checkinTotalEl) {
        checkinTotalEl.textContent = totalCount;
    }

    // 状态
    if (checkinStatusEl) {
        if (isCheckedIn) {
            checkinStatusEl.textContent = languageManager.getText('checkinDoneToday') || '今日已签到，明天再来～';
            checkinStatusEl.className = 'checkin-status done';
        } else {
            checkinStatusEl.textContent = languageManager.getText('checkinReady') || '今日可签到！';
            checkinStatusEl.className = 'checkin-status ready';
        }
    }

    // 签到按钮状态
    if (checkinClaimBtn) {
        if (isCheckedIn) {
            checkinClaimBtn.disabled = true;
            checkinClaimBtn.textContent = languageManager.getText('checkinDone') || '已签到';
        } else {
            checkinClaimBtn.disabled = false;
            const reward = checkinManager.getNextReward();
            checkinClaimBtn.innerHTML = `${languageManager.getText('checkinClaim') || '签到'} · 💰+${reward.coins} ⭐+${reward.exp}`;
        }
    }

    // 渲染日历
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=周日
    const weekStart = 0;
    const offset = (firstDayOfWeek - weekStart + 7) % 7;

    let html = '';
    // 周标题行
    const weekdays = languageManager.getText('checkinWeekdays');
    const weekdaysArr = (weekdays && weekdays !== 'checkinWeekdays')
        ? weekdays.split(',')
        : ['日','一','二','三','四','五','六'];
    html += `<div class="checkin-calendar-header">`;
    for (let i = 0; i < 7; i++) {
        const dayIdx = (weekStart + i) % 7;
        html += `<div class="checkin-calendar-weekday">${weekdaysArr[dayIdx] || ''}</div>`;
    }
    html += `</div>`;

    // 日期格
    html += `<div class="checkin-calendar-grid">`;
    for (let i = 0; i < offset; i++) {
        html += `<div class="checkin-cell empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = ciGetDateStr(year, month, d);
        const isSigned = signedSet.has(dateStr);
        const isToday = d === todayDate;
        const isFuture = dateStr > today;
        const isPast = dateStr < today;
        let cls = 'checkin-cell';
        if (isSigned) cls += ' signed';
        if (isToday) cls += ' today';
        if (isFuture) cls += ' future';
        if (isPast && !isSigned) cls += ' missed';

        const canMakeup = isPast && !isSigned;

        html += `<div class="${cls}" data-date="${dateStr}" data-day="${d}">
${isSigned ? '<span class="checkin-cell-check">✓</span>' : ''}
<span class="checkin-cell-day">${d}</span>
${canMakeup ? `<span class="checkin-cell-makeup" data-makeup="${dateStr}">+</span>` : ''}
</div>`;
    }
    html += `</div>`;

    checkinCalendarEl.innerHTML = html;

    // 绑定补签
    checkinCalendarEl.querySelectorAll('[data-makeup]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const dateStr = el.getAttribute('data-makeup');
            handleMakeup(dateStr);
        });
    });
}

function handleMakeup(dateStr) {
    const r = checkinManager.makeup(dateStr);
    if (!r.ok) {
        let msg = '';
        if (r.reason === 'NOT_ENOUGH_COINS') msg = languageManager.getText('checkinMakeupNoCoins') || '金币不足';
        else if (r.reason === 'ALREADY_SIGNED') msg = languageManager.getText('checkinAlreadyDone') || '已签到';
        else msg = languageManager.getText('checkinMakeupFailed') || '补签失败';
        showSaveNotification('❌ ' + msg, true);
        return;
    }
    showSaveNotification(`✅ ${languageManager.getText('checkinMakeupSuccess') || '补签成功'} · -${CHECKIN_MAKEUP_PRICE} 💰`);
    audioSystem.playSound('targetIncrease');
    renderCheckin();
}