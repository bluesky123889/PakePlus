// ============================================================
// 月卡系统
// - 3000 金币 / 30 天
// - 每天手动领取：200 金币 + 1000 经验 + 1 张双倍经验卡
// - 未到期也能续费，叠加 30 天
// - 最多叠加到 90 天
// - 独立存储 tetrisMonthlyCard
// 依赖：shopManager（金币/消耗品）、levelManager（经验）
// ============================================================

const MONTHLY_CARD_STORAGE_KEY = 'tetrisMonthlyCard';
const MONTHLY_CARD_PRICE = 3000;
const MONTHLY_CARD_DURATION_DAYS = 30;
const MONTHLY_CARD_MAX_DAYS = 90;
const MONTHLY_CARD_DAILY_COINS = 200;
const MONTHLY_CARD_DAILY_EXP = 1000;
const MONTHLY_CARD_DAILY_ITEM = { id: 'double_exp', count: 1 };

const MC_DAY_MS = 24 * 60 * 60 * 1000;

function mcPad2(n) { return String(n).padStart(2, '0'); }

function mcGetTodayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${mcPad2(d.getMonth() + 1)}-${mcPad2(d.getDate())}`;
}

class MonthlyCardManager {
    constructor() {
        this.state = { expireAt: 0, lastClaimDate: '' };
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(MONTHLY_CARD_STORAGE_KEY) || 'null');
            if (saved && typeof saved === 'object') {
                this.state.expireAt = typeof saved.expireAt === 'number' ? saved.expireAt : 0;
                this.state.lastClaimDate = typeof saved.lastClaimDate === 'string' ? saved.lastClaimDate : '';
            } else {
                this.state = { expireAt: 0, lastClaimDate: '' };
            }
        } catch (e) {
            this.state = { expireAt: 0, lastClaimDate: '' };
        }
        this._checkExpire();
    }

    save() {
        try {
            localStorage.setItem(MONTHLY_CARD_STORAGE_KEY, JSON.stringify(this.state));
            return true;
        } catch (e) {
            console.warn('[monthlycard] save failed:', e);
            return false;
        }
    }

    _checkExpire() {
        if (this.state.expireAt > 0 && Date.now() >= this.state.expireAt) {
            this.state.expireAt = 0;
            this.state.lastClaimDate = '';
            this.save();
        }
    }

    isActive() {
        this._checkExpire();
        return this.state.expireAt > Date.now();
    }

    isExpired() {
        return this.state.expireAt > 0 && this.state.expireAt <= Date.now();
    }

    getRemainingDays() {
        if (!this.isActive()) return 0;
        return Math.ceil((this.state.expireAt - Date.now()) / MC_DAY_MS);
    }

    isAtMaxDays() {
        if (!this.isActive()) return false;
        return this.getRemainingDays() >= MONTHLY_CARD_MAX_DAYS;
    }

    canClaimToday() {
        if (!this.isActive()) return false;
        return this.state.lastClaimDate !== mcGetTodayDateStr();
    }

    // 购买 / 续费（叠加 30 天，最多到 90 天）
    purchase() {
        if (typeof shopManager === 'undefined') return { ok: false, reason: 'NO_SHOP' };
        if (shopManager.coins < MONTHLY_CARD_PRICE) return { ok: false, reason: 'NOT_ENOUGH_COINS' };

        // 计算续费后的天数，超过上限则拒绝
        const base = this.isActive() ? this.state.expireAt : Date.now();
        const newExpireAt = base + MONTHLY_CARD_DURATION_DAYS * MC_DAY_MS;
        const newRemainingDays = Math.ceil((newExpireAt - Date.now()) / MC_DAY_MS);
        if (newRemainingDays > MONTHLY_CARD_MAX_DAYS) {
            return { ok: false, reason: 'MAX_DAYS_REACHED' };
        }

        shopManager.coins -= MONTHLY_CARD_PRICE;
        shopManager.save();

        this.state.expireAt = newExpireAt;
        this.save();

        if (typeof updateShopBadge === 'function') updateShopBadge();
        this._notifyRefresh();
        return { ok: true, remainingDays: this.getRemainingDays() };
    }

    // 每日领取
    claimDaily() {
        if (!this.isActive()) return { ok: false, reason: 'NOT_ACTIVE' };
        if (!this.canClaimToday()) return { ok: false, reason: 'ALREADY_CLAIMED' };

        if (typeof shopManager !== 'undefined') {
            shopManager.addCoins(MONTHLY_CARD_DAILY_COINS);
            if (MONTHLY_CARD_DAILY_ITEM && MONTHLY_CARD_DAILY_ITEM.id) {
                const sid = MONTHLY_CARD_DAILY_ITEM.id;
                const cnt = MONTHLY_CARD_DAILY_ITEM.count || 1;
                shopManager.consumables[sid] = (shopManager.consumables[sid] || 0) + cnt;
                shopManager.save();
            }
        }
        if (typeof levelManager !== 'undefined') {
            levelManager.addExp(MONTHLY_CARD_DAILY_EXP);
            if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        }

        this.state.lastClaimDate = mcGetTodayDateStr();
        this.save();

        this._notifyRefresh();
        return { ok: true };
    }

    _notifyRefresh() {
        if (typeof updateShopBadge === 'function') updateShopBadge();
        if (typeof updateMonthlyCardBadge === 'function') updateMonthlyCardBadge();
        if (typeof renderMonthlyCardPanel === 'function') renderMonthlyCardPanel();
    }
}

const monthlyCardManager = new MonthlyCardManager();

// ============================================================
// UI
// ============================================================
let monthlyCardBtn = null;
let monthlyCardPanel = null;

function initMonthlyCard() {
    monthlyCardManager.load();
    monthlyCardBtn = document.getElementById('monthlyCardBtn');
    monthlyCardPanel = document.getElementById('monthlyCardPanel');

    if (monthlyCardBtn) {
        monthlyCardBtn.addEventListener('click', openMonthlyCard);
    }
    const closeBtn = document.querySelector('.close-monthlycard');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hidePanel(monthlyCardPanel);
            audioSystem.playSound('click');
        });
    }

    const claimBtn = document.getElementById('monthlyCardClaimBtn');
    const purchaseBtn = document.getElementById('monthlyCardPurchaseBtn');
    if (claimBtn) claimBtn.addEventListener('click', handleMonthlyCardClaim);
    if (purchaseBtn) purchaseBtn.addEventListener('click', handleMonthlyCardPurchase);

    updateMonthlyCardBadge();

    // 每分钟检查跨天
    setInterval(() => {
        monthlyCardManager._checkExpire();
        updateMonthlyCardBadge();
    }, 60000);
}

function openMonthlyCard() {
    if (!monthlyCardPanel) return;
    renderMonthlyCardPanel();
    showPanel(monthlyCardPanel);
    audioSystem.playSound('click');
}

function updateMonthlyCardBadge() {
    if (!monthlyCardBtn) return;
    const canClaim = monthlyCardManager.canClaimToday();
    monthlyCardBtn.classList.toggle('has-notification', canClaim);
}

function renderMonthlyCardPanel() {
    if (!monthlyCardPanel) return;
    monthlyCardManager._checkExpire();

    const titleEl = document.getElementById('monthlyCardTitle');
    const statusEl = document.getElementById('monthlyCardStatus');
    const daysEl = document.getElementById('monthlyCardDays');
    const rewardEl = document.getElementById('monthlyCardReward');
    const claimBtn = document.getElementById('monthlyCardClaimBtn');
    const purchaseBtn = document.getElementById('monthlyCardPurchaseBtn');
    const priceEl = document.getElementById('monthlyCardPrice');
    const coinsEl = document.getElementById('monthlyCardCoins');

    const isActive = monthlyCardManager.isActive();
    const remaining = monthlyCardManager.getRemainingDays();

    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    if (titleEl) titleEl.textContent = t('monthlyCardTitle', '月卡');

    if (coinsEl && typeof shopManager !== 'undefined') {
        coinsEl.textContent = shopManager.coins.toLocaleString();
    }

    if (priceEl) {
        priceEl.textContent = `${MONTHLY_CARD_PRICE.toLocaleString()} 💰`;
    }

    if (rewardEl) {
        rewardEl.innerHTML = `
            <div class="monthly-card-reward-row">
                <span class="monthly-card-reward-icon">💰</span>
                <span class="monthly-card-reward-text">+${MONTHLY_CARD_DAILY_COINS} ${t('shopCoins', '金币')}</span>
            </div>
            <div class="monthly-card-reward-row">
                <span class="monthly-card-reward-icon">⭐</span>
                <span class="monthly-card-reward-text">+${MONTHLY_CARD_DAILY_EXP} ${t('exp', '经验')}</span>
            </div>
            <div class="monthly-card-reward-row">
                <span class="monthly-card-reward-icon">🎫</span>
                <span class="monthly-card-reward-text">×${MONTHLY_CARD_DAILY_ITEM.count} ${t('shopDoubleExp', '双倍经验卡')}</span>
            </div>`;
    }

    if (isActive) {
        if (statusEl) {
            statusEl.textContent = t('monthlyCardActive', '生效中');
            statusEl.className = 'monthly-card-status active';
        }
        if (daysEl) {
            const isMax = monthlyCardManager.isAtMaxDays();
            daysEl.textContent = `${t('monthlyCardRemaining', '剩余')} ${remaining} ${t('monthlyCardDays', '天')}${isMax ? ` · ${t('monthlyCardMaxDays', '已达上限')}` : ''}`;
        }
        if (claimBtn) {
            const canClaim = monthlyCardManager.canClaimToday();
            claimBtn.style.display = 'block';
            claimBtn.disabled = !canClaim;
            claimBtn.textContent = canClaim
                ? t('monthlyCardClaim', '领取今日奖励')
                : t('monthlyCardClaimed', '今日已领取');
        }
        if (purchaseBtn) {
            purchaseBtn.style.display = 'block';
            if (monthlyCardManager.isAtMaxDays()) {
                purchaseBtn.disabled = true;
                purchaseBtn.textContent = t('monthlyCardMaxDays', '已达上限');
            } else {
                purchaseBtn.disabled = false;
                purchaseBtn.textContent = t('monthlyCardRenew', '续费 30 天');
            }
        }
    } else {
        if (statusEl) {
            statusEl.textContent = monthlyCardManager.isExpired()
                ? t('monthlyCardExpired', '已过期')
                : t('monthlyCardInactive', '未开通');
            statusEl.className = 'monthly-card-status inactive';
        }
        if (daysEl) daysEl.textContent = '';
        if (claimBtn) claimBtn.style.display = 'none';
        if (purchaseBtn) {
            purchaseBtn.style.display = 'block';
            purchaseBtn.disabled = false;
            purchaseBtn.textContent = t('monthlyCardPurchase', '开通月卡');
        }
    }
}

function handleMonthlyCardPurchase() {
    const r = monthlyCardManager.purchase();
    if (!r.ok) {
        if (r.reason === 'NOT_ENOUGH_COINS') {
            showSaveNotification('❌ ' + (languageManager.getText('shopNotEnoughCoins') || '金币不足'), true);
        } else if (r.reason === 'MAX_DAYS_REACHED') {
            showSaveNotification('❌ ' + (languageManager.getText('monthlyCardMaxDaysReached') || '月卡天数已达上限（最多 90 天）'), true);
        } else {
            showSaveNotification('❌ ' + (languageManager.getText('monthlyCardPurchaseFailed') || '购买失败'), true);
        }
        audioSystem.playSound('gameover');
        return;
    }
    showSaveNotification(`✅ ${languageManager.getText('monthlyCardPurchaseSuccess') || '月卡开通成功'} · ${r.remainingDays} ${languageManager.getText('monthlyCardDays') || '天'}`);
    audioSystem.playSound('targetIncrease');
    renderMonthlyCardPanel();
    updateMonthlyCardBadge();
}

function handleMonthlyCardClaim() {
    const r = monthlyCardManager.claimDaily();
    if (!r.ok) {
        if (r.reason === 'ALREADY_CLAIMED') {
            showSaveNotification('❌ ' + (languageManager.getText('monthlyCardAlreadyClaimed') || '今日已领取'), true);
        } else {
            showSaveNotification('❌ ' + (languageManager.getText('monthlyCardNotActive') || '月卡未生效'), true);
        }
        return;
    }
    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };
    showSaveNotification(`🎉 ${t('monthlyCardClaimSuccess', '领取成功')} · 💰+${MONTHLY_CARD_DAILY_COINS} ⭐+${MONTHLY_CARD_DAILY_EXP} 🎫×${MONTHLY_CARD_DAILY_ITEM.count}`);
    audioSystem.playSound('targetIncrease');
    renderMonthlyCardPanel();
    updateMonthlyCardBadge();
}