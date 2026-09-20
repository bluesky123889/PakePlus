// ============================================================
// 通行证系统（纪行）
// - 双轨：免费轨 + 付费轨（5000 金币解锁）
// - 双月一期（9/1~10/31、11/1~12/31、1/1~2/28...）
// - 50 级，每级 1000 通行证经验
// - 经验来源：每局结束 floor(score/500) + lines*2 + 5
// - 附加任务：每日（每日 0 点刷新）+ 周任务（每周一刷新）+ 期任务（本期一次）
// - 未领取奖励到期作废
// - 独立存储 tetrisBattlePass / tetrisBattlePassTasks
// 依赖：shopManager、levelManager
// ============================================================

const BATTLEPASS_STORAGE_KEY = 'tetrisBattlePass';
const BATTLEPASS_TASKS_STORAGE_KEY = 'tetrisBattlePassTasks';
const BATTLEPASS_MAX_LEVEL = 50;
const BATTLEPASS_EXP_PER_LEVEL = 1000;
const BATTLEPASS_PREMIUM_PRICE = 5000;
const BATTLEPASS_LEVEL_PRICE = 1000;

const BP_DAY_MS = 24 * 60 * 60 * 1000;

function bpPad2(n) { return String(n).padStart(2, '0'); }

function bpGetTodayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${bpPad2(d.getMonth() + 1)}-${bpPad2(d.getDate())}`;
}

// ============================================================
// 周期工具：双月一期
// ============================================================
function getCurrentPeriodRange(now = new Date()) {
    const y = now.getFullYear();
    const m = now.getMonth();
    const startMonth = m % 2 === 0 ? m : m - 1;
    const endMonth = startMonth + 1;
    const start = new Date(y, startMonth, 1, 0, 0, 0, 0);
    const end = new Date(y, endMonth + 1, 1, 0, 0, 0, 0);
    return { start, end };
}

function getPeriodKey(now = new Date()) {
    const { start } = getCurrentPeriodRange(now);
    return `${start.getFullYear()}-${bpPad2(start.getMonth() + 1)}`;
}

function getWeekKey(now = new Date()) {
    const d = new Date(now);
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return `${monday.getFullYear()}-${bpPad2(monday.getMonth() + 1)}-${bpPad2(monday.getDate())}`;
}

// ============================================================
// 任务池
// ============================================================
const BATTLEPASS_DAILY_TASKS = [
    { id: 'bp_d_games_1',   metric: 'gamesPlayed',  target: 1,      exp: 50,  i18n: 'bpTaskDailyGames1' },
    { id: 'bp_d_games_3',   metric: 'gamesPlayed',  target: 3,      exp: 100, i18n: 'bpTaskDailyGames3' },
    { id: 'bp_d_lines_20',  metric: 'totalLines',   target: 20,     exp: 60,  i18n: 'bpTaskDailyLines20' },
    { id: 'bp_d_lines_50',  metric: 'totalLines',   target: 50,     exp: 120, i18n: 'bpTaskDailyLines50' },
    { id: 'bp_d_score_10k', metric: 'totalScore',   target: 10000,  exp: 60,  i18n: 'bpTaskDailyScore10k' },
    { id: 'bp_d_score_30k', metric: 'totalScore',   target: 30000,  exp: 120, i18n: 'bpTaskDailyScore30k' },
    { id: 'bp_d_tetris_1',  metric: 'tetrisCount',  target: 1,      exp: 80,  i18n: 'bpTaskDailyTetris1' },
    { id: 'bp_d_play_10m',  metric: 'playSeconds',  target: 600,    exp: 80,  i18n: 'bpTaskDailyPlay10m' }
];

const BATTLEPASS_DAILY_COUNT = 3;

function pickDailyTasks(dateKey) {
    let hash = 2166136261;
    for (let i = 0; i < dateKey.length; i++) {
        hash ^= dateKey.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    hash = hash >>> 0;

    const pool = BATTLEPASS_DAILY_TASKS.slice();
    const picked = [];
    for (let i = 0; i < BATTLEPASS_DAILY_COUNT && pool.length > 0; i++) {
        hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
        const idx = hash % pool.length;
        picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
}

const BATTLEPASS_WEEKLY_TASKS = [
    { id: 'bp_w_games_5',   metric: 'gamesPlayed',  target: 5,       exp: 100, i18n: 'bpTaskGames5' },
    { id: 'bp_w_games_10',  metric: 'gamesPlayed',  target: 10,      exp: 200, i18n: 'bpTaskGames10' },
    { id: 'bp_w_lines_100', metric: 'totalLines',   target: 100,     exp: 150, i18n: 'bpTaskLines100' },
    { id: 'bp_w_lines_200', metric: 'totalLines',   target: 200,     exp: 300, i18n: 'bpTaskLines200' },
    { id: 'bp_w_score_50k', metric: 'totalScore',   target: 50000,   exp: 150, i18n: 'bpTaskScore50k' },
    { id: 'bp_w_score_100k',metric: 'totalScore',   target: 100000,  exp: 300, i18n: 'bpTaskScore100k' },
    { id: 'bp_w_tetris_5',  metric: 'tetrisCount',  target: 5,       exp: 200, i18n: 'bpTaskTetris5' },
    { id: 'bp_w_play_30m',  metric: 'playSeconds',  target: 1800,    exp: 150, i18n: 'bpTaskPlay30m' }
];

const BATTLEPASS_PERIOD_TASKS = [
    { id: 'bp_p_games_50',    metric: 'gamesPlayed',  target: 50,       exp: 800,  i18n: 'bpTaskGames50' },
    { id: 'bp_p_lines_1000',  metric: 'totalLines',   target: 1000,     exp: 1000, i18n: 'bpTaskLines1000' },
    { id: 'bp_p_score_1m',    metric: 'totalScore',   target: 1000000,  exp: 1000, i18n: 'bpTaskScore1m' },
    { id: 'bp_p_single_100k', metric: 'highestScore', target: 100000,   exp: 800,  i18n: 'bpTaskSingleScore100k' },
    { id: 'bp_p_tetris_50',   metric: 'tetrisCount',  target: 50,       exp: 800,  i18n: 'bpTaskTetris50' },
    { id: 'bp_p_play_10h',    metric: 'playSeconds',  target: 36000,    exp: 1000, i18n: 'bpTaskPlay10h' },
    { id: 'bp_p_all_weekly',  metric: 'weeklyDone',   target: 8,        exp: 1500, i18n: 'bpTaskAllWeekly' }
];

// ============================================================
// 奖励表
// ============================================================
const BATTLEPASS_REWARDS = (() => {
    const list = [];
    for (let lv = 1; lv <= BATTLEPASS_MAX_LEVEL; lv++) {
        let free, premium;
        if (lv === BATTLEPASS_MAX_LEVEL) {
            free = { coins: 500, exp: 1000 };
        } else if (lv % 10 === 0) {
            free = { coins: 150 };
        } else if (lv % 5 === 0) {
            free = { coins: 100, exp: 200 };
        } else {
            free = { coins: 50 };
        }
        if (lv === BATTLEPASS_MAX_LEVEL) {
            premium = { coins: 2000, item: { id: 'revive', count: 1 }, item2: { id: 'double_coins', count: 1 } };
        } else if (lv % 10 === 0) {
            premium = { coins: 500, exp: 500 };
        } else if (lv % 5 === 0) {
            premium = { coins: 300, item: { id: 'double_exp', count: 1 } };
        } else {
            premium = { coins: 150 };
        }
        list.push({ level: lv, free, premium });
    }
    return list;
})();

// ============================================================
// 通行证管理器
// ============================================================
class BattlePassManager {
    constructor() {
        this.state = this._emptyState();
        this.tasksState = this._emptyTasksState();
        this._currentTab = 'rewards';
    }

    _emptyState() {
        const { start, end } = getCurrentPeriodRange();
        return {
            periodKey: getPeriodKey(),
            periodStart: start.getTime(),
            periodEnd: end.getTime(),
            exp: 0,
            premiumUnlocked: false,
            claimedFree: [],
            claimedPremium: []
        };
    }

    _emptyTasksState() {
        return {
            periodKey: getPeriodKey(),
            weekKey: getWeekKey(),
            dailyKey: bpGetTodayDateStr(),
            daily: {},
            weekly: {},
            period: {},
            stats: {
                gamesPlayed: 0,
                totalLines: 0,
                totalScore: 0,
                tetrisCount: 0,
                playSeconds: 0,
                highestScore: 0
            }
        };
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(BATTLEPASS_STORAGE_KEY) || 'null');
            if (saved && typeof saved === 'object') {
                this.state = saved;
                if (!Array.isArray(this.state.claimedFree)) this.state.claimedFree = [];
                if (!Array.isArray(this.state.claimedPremium)) this.state.claimedPremium = [];
                if (typeof this.state.exp !== 'number') this.state.exp = 0;
                if (typeof this.state.premiumUnlocked !== 'boolean') this.state.premiumUnlocked = false;
            } else {
                this.state = this._emptyState();
                this.save();
            }
        } catch (e) {
            this.state = this._emptyState();
            this.save();
        }
        this._checkPeriodReset();

        try {
            const saved = JSON.parse(localStorage.getItem(BATTLEPASS_TASKS_STORAGE_KEY) || 'null');
            if (saved && typeof saved === 'object') {
                this.tasksState = saved;
                if (!this.tasksState.daily) this.tasksState.daily = {};
                if (!this.tasksState.dailyKey) this.tasksState.dailyKey = bpGetTodayDateStr();
                if (!this.tasksState.weekly) this.tasksState.weekly = {};
                if (!this.tasksState.period) this.tasksState.period = {};
                if (!this.tasksState.stats) this.tasksState.stats = this._emptyTasksState().stats;
            } else {
                this.tasksState = this._emptyTasksState();
                this.saveTasks();
            }
        } catch (e) {
            this.tasksState = this._emptyTasksState();
            this.saveTasks();
        }
        this._checkTasksReset();
    }

    save() {
        try {
            localStorage.setItem(BATTLEPASS_STORAGE_KEY, JSON.stringify(this.state));
            return true;
        } catch (e) {
            console.warn('[battlepass] save failed:', e);
            return false;
        }
    }

    saveTasks() {
        try {
            localStorage.setItem(BATTLEPASS_TASKS_STORAGE_KEY, JSON.stringify(this.tasksState));
            return true;
        } catch (e) {
            console.warn('[battlepass] tasks save failed:', e);
            return false;
        }
    }

    _checkPeriodReset() {
        const curKey = getPeriodKey();
        if (this.state.periodKey !== curKey) {
            this.state = this._emptyState();
            this.save();
        }
    }

    _checkTasksReset() {
        const curPeriodKey = getPeriodKey();
        const curWeekKey = getWeekKey();
        const curDailyKey = bpGetTodayDateStr();

        if (this.tasksState.periodKey !== curPeriodKey) {
            this.tasksState = this._emptyTasksState();
            this.tasksState.periodKey = curPeriodKey;
            this.tasksState.weekKey = curWeekKey;
            this.tasksState.dailyKey = curDailyKey;
            this.saveTasks();
            return;
        }
        if (this.tasksState.weekKey !== curWeekKey) {
            this.tasksState.weekKey = curWeekKey;
            this.tasksState.weekly = {};
            this.saveTasks();
        }
        if (this.tasksState.dailyKey !== curDailyKey) {
            this.tasksState.dailyKey = curDailyKey;
            this.tasksState.daily = {};
            this.saveTasks();
        }
    }

    getRemainingDays() {
        this._checkPeriodReset();
        return Math.max(0, Math.ceil((this.state.periodEnd - Date.now()) / BP_DAY_MS));
    }

    getLevel() {
        const lv = Math.floor(this.state.exp / BATTLEPASS_EXP_PER_LEVEL) + 1;
        return Math.min(lv, BATTLEPASS_MAX_LEVEL);
    }

    getExpInLevel() {
        if (this.getLevel() >= BATTLEPASS_MAX_LEVEL) return BATTLEPASS_EXP_PER_LEVEL;
        return this.state.exp % BATTLEPASS_EXP_PER_LEVEL;
    }

    getExpToNext() {
        return BATTLEPASS_EXP_PER_LEVEL;
    }

    isPremiumUnlocked() {
        return !!this.state.premiumUnlocked;
    }

    addExp(amount) {
        if (amount <= 0) return;
        this._checkPeriodReset();
        if (this.getLevel() >= BATTLEPASS_MAX_LEVEL) return;
        const maxExp = BATTLEPASS_MAX_LEVEL * BATTLEPASS_EXP_PER_LEVEL;
        this.state.exp = Math.min(this.state.exp + amount, maxExp);
        this.save();
        this._notifyRefresh();
    }

    static calcExpFromGame({ score = 0, lines = 0 } = {}) {
        return Math.floor(score / 500) + lines * 2 + 5;
    }

    unlockPremium() {
        if (this.isPremiumUnlocked()) return { ok: false, reason: 'ALREADY_UNLOCKED' };
        if (typeof shopManager === 'undefined') return { ok: false, reason: 'NO_SHOP' };
        if (shopManager.coins < BATTLEPASS_PREMIUM_PRICE) return { ok: false, reason: 'NOT_ENOUGH_COINS' };
        shopManager.coins -= BATTLEPASS_PREMIUM_PRICE;
        shopManager.save();
        this.state.premiumUnlocked = true;
        this.save();
        if (typeof updateShopBadge === 'function') updateShopBadge();
        this._notifyRefresh();
        return { ok: true };
    }

    // 用金币购买 N 级（+N × 1000 exp）
    buyLevels(count) {
        if (count <= 0) return { ok: false, reason: 'INVALID_COUNT' };
        if (typeof shopManager === 'undefined') return { ok: false, reason: 'NO_SHOP' };

        const lv = this.getLevel();
        if (lv >= BATTLEPASS_MAX_LEVEL) return { ok: false, reason: 'MAX_LEVEL' };

        const maxBuyable = BATTLEPASS_MAX_LEVEL - lv;
        const actualCount = Math.min(count, maxBuyable);
        const cost = actualCount * BATTLEPASS_LEVEL_PRICE;

        if (shopManager.coins < cost) return { ok: false, reason: 'NOT_ENOUGH_COINS' };

        shopManager.coins -= cost;
        shopManager.save();

        const addExp = actualCount * BATTLEPASS_EXP_PER_LEVEL;
        const maxExp = BATTLEPASS_MAX_LEVEL * BATTLEPASS_EXP_PER_LEVEL;
        this.state.exp = Math.min(this.state.exp + addExp, maxExp);
        this.save();

        if (typeof updateShopBadge === 'function') updateShopBadge();
        this._notifyRefresh();
        return { ok: true, count: actualCount, cost };
    }

    isFreeClaimed(level) { return this.state.claimedFree.includes(level); }
    isPremiumClaimed(level) { return this.state.claimedPremium.includes(level); }
    canClaimFree(level) { return level <= this.getLevel() && !this.isFreeClaimed(level); }
    canClaimPremium(level) {
        return this.isPremiumUnlocked() && level <= this.getLevel() && !this.isPremiumClaimed(level);
    }

    claimFree(level) {
        if (!this.canClaimFree(level)) return { ok: false };
        const reward = BATTLEPASS_REWARDS[level - 1];
        if (!reward) return { ok: false };
        this._applyReward(reward.free);
        this.state.claimedFree.push(level);
        this.save();
        this._notifyRefresh();
        return { ok: true, reward: reward.free };
    }

    claimPremium(level) {
        if (!this.canClaimPremium(level)) return { ok: false };
        const reward = BATTLEPASS_REWARDS[level - 1];
        if (!reward) return { ok: false };
        this._applyReward(reward.premium);
        this.state.claimedPremium.push(level);
        this.save();
        this._notifyRefresh();
        return { ok: true, reward: reward.premium };
    }

    hasAnyClaimable() {
        const lv = this.getLevel();
        for (let i = 1; i <= lv; i++) {
            if (this.canClaimFree(i)) return true;
            if (this.canClaimPremium(i)) return true;
        }
        return false;
    }

    _applyReward(reward) {
        if (!reward) return;
        if (reward.coins && typeof shopManager !== 'undefined') shopManager.addCoins(reward.coins);
        if (reward.exp && typeof levelManager !== 'undefined') {
            levelManager.addExp(reward.exp);
            if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        }
        if (typeof shopManager !== 'undefined') {
            if (reward.item && reward.item.id) {
                const sid = reward.item.id;
                const cnt = reward.item.count || 1;
                shopManager.consumables[sid] = (shopManager.consumables[sid] || 0) + cnt;
            }
            if (reward.item2 && reward.item2.id) {
                const sid = reward.item2.id;
                const cnt = reward.item2.count || 1;
                shopManager.consumables[sid] = (shopManager.consumables[sid] || 0) + cnt;
            }
            shopManager.save();
        }
    }

    // ---------- 任务 ----------
    onGameStart() {
        // 不需要做什么
    }

    onGameEnd({ score = 0, lines = 0, maxCombo = 0, playSeconds = 0, tetrisInc = 0 } = {}) {
        this._checkTasksReset();

        const s = this.tasksState.stats;
        s.gamesPlayed += 1;
        s.totalLines += lines;
        s.totalScore += score;
        s.tetrisCount += tetrisInc;
        s.playSeconds += playSeconds;
        if (score > s.highestScore) s.highestScore = score;

        this._updatePeriodWeeklyDone();
        this._refreshTaskReady();

        this.saveTasks();
        this._notifyRefresh();
    }

    _updatePeriodWeeklyDone() {
        let done = 0;
        for (const task of BATTLEPASS_WEEKLY_TASKS) {
            if (this.isWeeklyTaskCompleted(task.id)) done++;
        }
        this.tasksState.stats.weeklyDone = done;
    }

    isWeeklyTaskCompleted(taskId) {
        const task = BATTLEPASS_WEEKLY_TASKS.find(t => t.id === taskId);
        if (!task) return false;
        const rec = this.tasksState.weekly[taskId];
        if (!rec) return false;
        return rec.progress >= task.target;
    }

    isPeriodTaskCompleted(taskId) {
        const task = BATTLEPASS_PERIOD_TASKS.find(t => t.id === taskId);
        if (!task) return false;
        const rec = this.tasksState.period[taskId];
        if (!rec) return false;
        return rec.progress >= task.target;
    }

    _refreshTaskReady() {
        const curDailyKey = bpGetTodayDateStr();

        // 每日任务
        const dailyTasks = pickDailyTasks(curDailyKey);
        for (const task of dailyTasks) {
            if (!this.tasksState.daily[task.id]) {
                this.tasksState.daily[task.id] = { progress: 0, claimed: false };
            }
            const rec = this.tasksState.daily[task.id];
            if (rec.claimed) continue;
            rec.progress = this._getMetricValue(task.metric);
        }
        for (const id of Object.keys(this.tasksState.daily)) {
            if (!dailyTasks.find(t => t.id === id)) delete this.tasksState.daily[id];
        }

        // 周任务
        for (const task of BATTLEPASS_WEEKLY_TASKS) {
            if (!this.tasksState.weekly[task.id]) {
                this.tasksState.weekly[task.id] = { progress: 0, claimed: false };
            }
            const rec = this.tasksState.weekly[task.id];
            if (rec.claimed) continue;
            rec.progress = this._getMetricValue(task.metric);
        }
        // 期任务
        for (const task of BATTLEPASS_PERIOD_TASKS) {
            if (!this.tasksState.period[task.id]) {
                this.tasksState.period[task.id] = { progress: 0, claimed: false };
            }
            const rec = this.tasksState.period[task.id];
            if (rec.claimed) continue;
            if (task.metric === 'weeklyDone') {
                this._updatePeriodWeeklyDone();
                rec.progress = this.tasksState.stats.weeklyDone || 0;
            } else {
                rec.progress = this._getMetricValue(task.metric);
            }
        }
    }

    _getMetricValue(metric) {
        const s = this.tasksState.stats;
        if (metric === 'gamesPlayed') return s.gamesPlayed;
        if (metric === 'totalLines') return s.totalLines;
        if (metric === 'totalScore') return s.totalScore;
        if (metric === 'tetrisCount') return s.tetrisCount;
        if (metric === 'playSeconds') return s.playSeconds;
        if (metric === 'highestScore') return s.highestScore;
        if (metric === 'weeklyDone') return s.weeklyDone || 0;
        return 0;
    }

    canClaimDaily(taskId) {
        const task = BATTLEPASS_DAILY_TASKS.find(t => t.id === taskId);
        if (!task) return false;
        const rec = this.tasksState.daily[taskId];
        if (!rec || rec.claimed) return false;
        return rec.progress >= task.target;
    }

    canClaimWeekly(taskId) {
        const task = BATTLEPASS_WEEKLY_TASKS.find(t => t.id === taskId);
        if (!task) return false;
        const rec = this.tasksState.weekly[taskId];
        if (!rec || rec.claimed) return false;
        return rec.progress >= task.target;
    }

    canClaimPeriod(taskId) {
        const task = BATTLEPASS_PERIOD_TASKS.find(t => t.id === taskId);
        if (!task) return false;
        const rec = this.tasksState.period[taskId];
        if (!rec || rec.claimed) return false;
        return rec.progress >= task.target;
    }

    claimDaily(taskId) {
        if (!this.canClaimDaily(taskId)) return { ok: false };
        const task = BATTLEPASS_DAILY_TASKS.find(t => t.id === taskId);
        const rec = this.tasksState.daily[taskId];
        rec.claimed = true;
        this.addExp(task.exp);
        this.saveTasks();
        this._notifyRefresh();
        return { ok: true, exp: task.exp };
    }

    claimWeekly(taskId) {
        if (!this.canClaimWeekly(taskId)) return { ok: false };
        const task = BATTLEPASS_WEEKLY_TASKS.find(t => t.id === taskId);
        const rec = this.tasksState.weekly[taskId];
        rec.claimed = true;
        this.addExp(task.exp);
        this.saveTasks();
        this._notifyRefresh();
        return { ok: true, exp: task.exp };
    }

    claimPeriod(taskId) {
        if (!this.canClaimPeriod(taskId)) return { ok: false };
        const task = BATTLEPASS_PERIOD_TASKS.find(t => t.id === taskId);
        const rec = this.tasksState.period[taskId];
        rec.claimed = true;
        this.addExp(task.exp);
        this.saveTasks();
        this._notifyRefresh();
        return { ok: true, exp: task.exp };
    }

    hasAnyTaskClaimable() {
        const curDailyKey = bpGetTodayDateStr();
        const dailyTasks = pickDailyTasks(curDailyKey);
        for (const t of dailyTasks) if (this.canClaimDaily(t.id)) return true;
        for (const t of BATTLEPASS_WEEKLY_TASKS) if (this.canClaimWeekly(t.id)) return true;
        for (const t of BATTLEPASS_PERIOD_TASKS) if (this.canClaimPeriod(t.id)) return true;
        return false;
    }

    _notifyRefresh() {
        if (typeof updateShopBadge === 'function') updateShopBadge();
        if (typeof updateBattlePassBadge === 'function') updateBattlePassBadge();
        if (typeof renderBattlePassPanel === 'function') renderBattlePassPanel();
    }

    getDailyRemainingMs() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        return Math.max(0, tomorrow - now);
    }

    getWeekRemainingMs() {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        return Math.max(0, nextMonday - now);
    }

    getPeriodRemainingMs() {
        const { end } = getCurrentPeriodRange();
        return Math.max(0, end - Date.now());
    }

    formatRemaining(ms) {
        if (ms <= 0) return '0' + languageManager.getText('bpTimeMin');
        const d = Math.floor(ms / BP_DAY_MS);
        const h = Math.floor((ms % BP_DAY_MS) / (60 * 60 * 1000));
        const m = Math.floor((ms % (60 * 60 * 1000)) / 60000);
        const t = (k, f) => {
            const v = languageManager.getText(k);
            return v === k ? f : v;
        };
        if (d > 0) return `${d}${t('bpTimeDay', 'd')} ${h}${t('bpTimeHour', 'h')}`;
        if (h > 0) return `${h}${t('bpTimeHour', 'h')} ${m}${t('bpTimeMin', 'm')}`;
        return `${m}${t('bpTimeMin', 'm')}`;
    }
}

const battlePassManager = new BattlePassManager();

// ============================================================
// UI
// ============================================================
let battlePassBtn = null;
let battlePassPanel = null;

function initBattlePass() {
    battlePassManager.load();
    battlePassBtn = document.getElementById('battlePassBtn');
    battlePassPanel = document.getElementById('battlePassPanel');

    if (battlePassBtn) battlePassBtn.addEventListener('click', openBattlePass);

    const closeBtn = document.querySelector('.close-battlepass');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hidePanel(battlePassPanel);
            audioSystem.playSound('click');
        });
    }

    // tab 切换
    const tabsEl = document.getElementById('bpTabs');
    if (tabsEl) {
        tabsEl.querySelectorAll('.bp-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                battlePassManager._currentTab = btn.getAttribute('data-bp-tab');
                renderBattlePassPanel();
                audioSystem.playSound('click');
            });
        });
    }

    // 解锁按钮
    const unlockBtn = document.getElementById('bpUnlockBtn');
    if (unlockBtn) unlockBtn.addEventListener('click', handleBattlePassUnlock);

    // 购买等级按钮
    const buyBtn = document.getElementById('bpBuyLevelBtn');
    if (buyBtn) buyBtn.addEventListener('click', openBuyLevelPanel);

    // 购买等级弹窗内部按钮
    const bpBuyMinus = document.getElementById('bpBuyMinus');
    const bpBuyPlus = document.getElementById('bpBuyPlus');
    const bpBuyCancel = document.getElementById('bpBuyCancel');
    const bpBuyConfirm = document.getElementById('bpBuyConfirm');

    if (bpBuyMinus) bpBuyMinus.addEventListener('click', () => {
        if (_bpBuyCount > 1) { _bpBuyCount--; updateBuyLevelUI(); audioSystem.playSound('click'); }
    });
    if (bpBuyPlus) bpBuyPlus.addEventListener('click', () => {
        const lv = battlePassManager.getLevel();
        const maxBuyable = BATTLEPASS_MAX_LEVEL - lv;
        if (_bpBuyCount < maxBuyable) { _bpBuyCount++; updateBuyLevelUI(); audioSystem.playSound('click'); }
    });
    if (bpBuyCancel) bpBuyCancel.addEventListener('click', () => {
        closeBuyLevelPanel();
        audioSystem.playSound('click');
    });
    if (bpBuyConfirm) bpBuyConfirm.addEventListener('click', handleBuyLevelConfirm);

    // ★ 奖励区：鼠标滚轮 = 横向滚动
    const rewardsScroll = document.querySelector('.battlepass-levels-scroll');
    if (rewardsScroll) {
        rewardsScroll.addEventListener('wheel', (e) => {
            if (e.deltaY === 0) return;
            if (rewardsScroll.scrollWidth <= rewardsScroll.clientWidth) return;
            e.preventDefault();
            rewardsScroll.scrollLeft += e.deltaY;
        }, { passive: false });
    }

    updateBattlePassBadge();

    setInterval(() => {
        battlePassManager._checkPeriodReset();
        battlePassManager._checkTasksReset();
        updateBattlePassBadge();
    }, 60000);
}

function openBattlePass() {
    if (!battlePassPanel) return;
    renderBattlePassPanel();
    showPanel(battlePassPanel);
    audioSystem.playSound('click');
}

function updateBattlePassBadge() {
    if (!battlePassBtn) return;
    const canClaim = battlePassManager.hasAnyClaimable() || battlePassManager.hasAnyTaskClaimable();
    battlePassBtn.classList.toggle('has-notification', canClaim);
}

function renderBattlePassPanel() {
    if (!battlePassPanel) return;
    battlePassManager._checkPeriodReset();
    battlePassManager._checkTasksReset();

    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    // tab 高亮
    const tabsEl = document.getElementById('bpTabs');
    if (tabsEl) {
        tabsEl.querySelectorAll('.bp-tab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-bp-tab') === battlePassManager._currentTab);
        });
    }

    // 顶部通用信息
    const lv = battlePassManager.getLevel();
    const expInLv = battlePassManager.getExpInLevel();
    const expNeed = battlePassManager.getExpToNext();
    const pct = lv >= BATTLEPASS_MAX_LEVEL ? 100 : Math.round(expInLv / expNeed * 100);
    const days = battlePassManager.getRemainingDays();
    const premiumUnlocked = battlePassManager.isPremiumUnlocked();

    const lvEl = document.getElementById('bpLevel');
    const expEl = document.getElementById('bpExp');
    const fillEl = document.getElementById('bpProgressFill');
    const daysEl = document.getElementById('bpDays');
    const coinsEl = document.getElementById('bpCoins');
    if (lvEl) lvEl.textContent = `${t('bpLevel', '等级')} ${lv} / ${BATTLEPASS_MAX_LEVEL}`;
    if (expEl) expEl.textContent = lv >= BATTLEPASS_MAX_LEVEL ? t('bpMaxLevel', '已满级') : `${expInLv} / ${expNeed}`;
    if (fillEl) fillEl.style.width = pct + '%';
    if (daysEl) daysEl.textContent = `${t('bpRemaining', '剩余')} ${days} ${t('bpDays', '天')}`;
    if (coinsEl && typeof shopManager !== 'undefined') coinsEl.textContent = shopManager.coins.toLocaleString();

    // 解锁按钮 + 底部提示：只在奖励 tab 显示
    const unlockBar = document.querySelector('.battlepass-unlock-bar');
    const unlockBtn = document.getElementById('bpUnlockBtn');
    const unlockHint = document.getElementById('bpUnlockHint');
    const bpHint = document.querySelector('.battlepass-hint');
    const isRewardsTab = battlePassManager._currentTab === 'rewards';

    if (unlockBar) unlockBar.style.display = isRewardsTab ? 'block' : 'none';
    if (bpHint) bpHint.style.display = isRewardsTab ? 'block' : 'none';

    if (unlockBtn && isRewardsTab) {
        if (premiumUnlocked) {
            unlockBtn.style.display = 'none';
            if (unlockHint) {
                unlockHint.style.display = 'block';
                unlockHint.textContent = `✅ ${t('bpPremiumUnlocked', '高级通行证已解锁')}`;
            }
        } else {
            unlockBtn.style.display = 'block';
            unlockBtn.textContent = `${t('bpUnlock', '解锁高级通行证')} · ${BATTLEPASS_PREMIUM_PRICE.toLocaleString()} 💰`;
            if (unlockHint) unlockHint.style.display = 'none';
        }
    }

    // 购买等级按钮：所有 tab 都显示；满级时禁用
    const buyBtn = document.getElementById('bpBuyLevelBtn');
    if (buyBtn) {
        buyBtn.style.display = 'inline-block';
        if (lv >= BATTLEPASS_MAX_LEVEL) {
            buyBtn.disabled = true;
            buyBtn.textContent = t('bpMaxLevel', '已满级');
        } else {
            buyBtn.disabled = false;
            buyBtn.textContent = t('bpBuyLevel', '购买等级');
        }
    }

    // 内容区（四个 tab）
    const rewardsView = document.getElementById('bpRewardsView');
    const dailyView = document.getElementById('bpDailyView');
    const weeklyView = document.getElementById('bpWeeklyView');
    const periodView = document.getElementById('bpPeriodView');
    const tab = battlePassManager._currentTab;

    if (rewardsView) rewardsView.style.display = tab === 'rewards' ? 'flex' : 'none';
    if (dailyView) dailyView.style.display = tab === 'daily' ? 'flex' : 'none';
    if (weeklyView) weeklyView.style.display = tab === 'weekly' ? 'flex' : 'none';
    if (periodView) periodView.style.display = tab === 'period' ? 'flex' : 'none';

    if (tab === 'rewards') renderBattlePassLevels();
    else if (tab === 'daily') renderBattlePassTasks('daily');
    else if (tab === 'weekly') renderBattlePassTasks('weekly');
    else if (tab === 'period') renderBattlePassTasks('period');
}

// ---------- 奖励视图 ----------
function renderBattlePassLevels() {
    const container = document.getElementById('bpLevelsContainer');
    if (!container) return;

    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    const lv = battlePassManager.getLevel();
    const premiumUnlocked = battlePassManager.isPremiumUnlocked();

    container.innerHTML = BATTLEPASS_REWARDS.map(r => {
        const unlocked = r.level <= lv;
        const freeClaimed = battlePassManager.isFreeClaimed(r.level);
        const premiumClaimed = battlePassManager.isPremiumClaimed(r.level);
        const freeCanClaim = battlePassManager.canClaimFree(r.level);
        const premiumCanClaim = battlePassManager.canClaimPremium(r.level);

        return `<div class="bp-level-item ${unlocked ? 'unlocked' : 'locked'}">
            <div class="bp-level-num">${t('bpLevelShort', 'Lv')} ${r.level}</div>
            <div class="bp-reward-slot free ${freeClaimed ? 'claimed' : ''} ${freeCanClaim ? 'claimable' : ''}"
                 data-claim="free" data-level="${r.level}">
                <div class="bp-reward-tag">${t('bpFree', '免费')}</div>
                <div class="bp-reward-text">${formatRewardText(r.free)}</div>
                ${freeClaimed ? '<div class="bp-reward-check">✓</div>' : ''}
                ${freeCanClaim ? `<div class="bp-reward-claim">${t('bpClaim', '领取')}</div>` : ''}
            </div>
            <div class="bp-reward-slot premium ${premiumClaimed ? 'claimed' : ''} ${premiumCanClaim ? 'claimable' : ''} ${!premiumUnlocked ? 'locked-premium' : ''}"
                 data-claim="premium" data-level="${r.level}">
                <div class="bp-reward-tag">${t('bpPremium', '高级')}</div>
                <div class="bp-reward-text">${formatRewardText(r.premium)}</div>
                ${premiumClaimed ? '<div class="bp-reward-check">✓</div>' : ''}
                ${premiumCanClaim ? `<div class="bp-reward-claim">${t('bpClaim', '领取')}</div>` : ''}
            </div>
        </div>`;
    }).join('');

        container.querySelectorAll('[data-claim]').forEach(el => {
        el.addEventListener('click', () => {
            const type = el.getAttribute('data-claim');
            const level = parseInt(el.getAttribute('data-level'));
            if (type === 'free') {
                const r = battlePassManager.claimFree(level);
                if (r.ok) {
                    showSaveNotification(`✅ ${t('bpClaimed', '已领取')} · ${formatRewardText(r.reward)}`);
                    audioSystem.playSound('targetIncrease');
                }
            } else {
                const r = battlePassManager.claimPremium(level);
                if (r.ok) {
                    showSaveNotification(`✅ ${t('bpClaimed', '已领取')} · ${formatRewardText(r.reward)}`);
                    audioSystem.playSound('targetIncrease');
                }
            }
            // ★ 领奖触发的重渲染不自动滚动
            battlePassManager._suppressAutoScroll = true;
            renderBattlePassPanel();
        });
    });

    // 滚动到当前等级
    // 例外：领奖触发的重渲染不滚动（保留玩家当前位置）
    const isClaimAction = battlePassManager._suppressAutoScroll === true;
    if (isClaimAction) {
        battlePassManager._suppressAutoScroll = false;
    } else {
        const curEl = container.querySelector(`[data-level="${lv}"]`);
        if (curEl) {
            const scrollParent = container.parentElement;
            if (scrollParent) {
                const offset = curEl.offsetLeft - scrollParent.clientWidth / 3;
                if (offset > 0) scrollParent.scrollLeft = offset;
            }
        }
    }
}

function formatRewardText(reward) {
    if (!reward) return '—';
    const parts = [];
    if (reward.coins) parts.push(`💰${reward.coins}`);
    if (reward.exp) parts.push(`⭐${reward.exp}`);
    if (reward.item) parts.push(`🎫×${reward.item.count || 1}`);
    if (reward.item2) parts.push(`🎰×${reward.item2.count || 1}`);
    return parts.join(' ') || '—';
}

// ---------- 任务视图 ----------
function renderBattlePassTasks(scope) {
    const dailyEl = document.getElementById('bpDailyTasks');
    const weeklyEl = document.getElementById('bpWeeklyTasks');
    const periodEl = document.getElementById('bpPeriodTasks');
    const dailyTimeEl = document.getElementById('bpDailyResetTime');
    const weeklyTimeEl = document.getElementById('bpWeeklyResetTime');
    const periodTimeEl = document.getElementById('bpPeriodResetTime');

    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    // 每日任务
    if (dailyEl && (scope === 'daily' || !scope)) {
        if (dailyTimeEl) {
            dailyTimeEl.textContent = battlePassManager.formatRemaining(battlePassManager.getDailyRemainingMs());
        }
        const curDailyKey = bpGetTodayDateStr();
        const dailyTasks = pickDailyTasks(curDailyKey);
        dailyEl.innerHTML = dailyTasks.map(task => {
            const rec = battlePassManager.tasksState.daily[task.id] || { progress: 0, claimed: false };
            const pct = Math.min(100, Math.round(rec.progress / task.target * 100));
            const ready = !rec.claimed && rec.progress >= task.target;
            return renderTaskItem(task, rec, pct, ready, 'daily');
        }).join('');

        dailyEl.querySelectorAll('[data-task-claim]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.getAttribute('data-task-claim');
                const r = battlePassManager.claimDaily(taskId);
                if (r.ok) {
                    showSaveNotification(`✅ +${r.exp} ${t('bpExpShort', 'BP经验')}`);
                    audioSystem.playSound('targetIncrease');
                }
                renderBattlePassPanel();
            });
        });
    }

    // 周任务
    if (weeklyEl && (scope === 'weekly' || !scope)) {
        if (weeklyTimeEl) {
            weeklyTimeEl.textContent = battlePassManager.formatRemaining(battlePassManager.getWeekRemainingMs());
        }
        weeklyEl.innerHTML = BATTLEPASS_WEEKLY_TASKS.map(task => {
            const rec = battlePassManager.tasksState.weekly[task.id] || { progress: 0, claimed: false };
            const pct = Math.min(100, Math.round(rec.progress / task.target * 100));
            const ready = !rec.claimed && rec.progress >= task.target;
            return renderTaskItem(task, rec, pct, ready, 'weekly');
        }).join('');

        weeklyEl.querySelectorAll('[data-task-claim]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.getAttribute('data-task-claim');
                const r = battlePassManager.claimWeekly(taskId);
                if (r.ok) {
                    showSaveNotification(`✅ +${r.exp} ${t('bpExpShort', 'BP经验')}`);
                    audioSystem.playSound('targetIncrease');
                }
                renderBattlePassPanel();
            });
        });
    }

    // 期任务
    if (periodEl && (scope === 'period' || !scope)) {
        if (periodTimeEl) {
            periodTimeEl.textContent = battlePassManager.formatRemaining(battlePassManager.getPeriodRemainingMs());
        }
        periodEl.innerHTML = BATTLEPASS_PERIOD_TASKS.map(task => {
            const rec = battlePassManager.tasksState.period[task.id] || { progress: 0, claimed: false };
            const pct = Math.min(100, Math.round(rec.progress / task.target * 100));
            const ready = !rec.claimed && rec.progress >= task.target;
            return renderTaskItem(task, rec, pct, ready, 'period');
        }).join('');

        periodEl.querySelectorAll('[data-task-claim]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.getAttribute('data-task-claim');
                const r = battlePassManager.claimPeriod(taskId);
                if (r.ok) {
                    showSaveNotification(`✅ +${r.exp} ${t('bpExpShort', 'BP经验')}`);
                    audioSystem.playSound('targetIncrease');
                }
                renderBattlePassPanel();
            });
        });
    }
}

function renderTaskItem(task, rec, pct, ready, scope) {
    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };
    const check = rec.claimed ? '✅' : (ready ? '🎁' : '⬜');
    let actionHtml = '';
    if (rec.claimed) {
        actionHtml = `<span class="bp-task-claimed">${t('bpTaskClaimed', '已领取')}</span>`;
    } else if (ready) {
        actionHtml = `<button class="bp-task-claim" data-task-claim="${task.id}" data-scope="${scope}">${t('bpTaskClaim', '领取')}</button>`;
    } else {
        actionHtml = `<button class="bp-task-claim" disabled>${t('bpTaskClaim', '领取')}</button>`;
    }
    const progressText = `${rec.progress.toLocaleString()} / ${task.target.toLocaleString()}`;
    return `<div class="bp-task-item ${rec.claimed ? 'completed' : ''} ${ready ? 'ready' : ''}">
        <div class="bp-task-check">${check}</div>
        <div class="bp-task-body">
            <div class="bp-task-row">
                <span class="bp-task-name">${t(task.i18n, task.id)}</span>
                <span class="bp-task-reward">+${task.exp} ${t('bpExpShort', 'BP经验')}</span>
            </div>
            <div class="bp-task-progress"><div class="bp-task-progress-fill" style="width:${pct}%"></div></div>
            <div class="bp-task-progress-text">${progressText}</div>
        </div>
        ${actionHtml}
    </div>`;
}

function handleBattlePassUnlock() {
    const r = battlePassManager.unlockPremium();
    if (!r.ok) {
        if (r.reason === 'NOT_ENOUGH_COINS') {
            showSaveNotification('❌ ' + (languageManager.getText('shopNotEnoughCoins') || '金币不足'), true);
        } else if (r.reason === 'ALREADY_UNLOCKED') {
            showSaveNotification('❌ ' + (languageManager.getText('bpAlreadyUnlocked') || '已解锁'), true);
        }
        audioSystem.playSound('gameover');
        return;
    }
    showSaveNotification('✅ ' + (languageManager.getText('bpUnlockSuccess') || '高级通行证已解锁'));
    audioSystem.playSound('targetIncrease');
    renderBattlePassPanel();
    updateBattlePassBadge();
}

// ============================================================
// 购买等级弹窗
// ============================================================
let _bpBuyCount = 1;

function openBuyLevelPanel() {
    const panel = document.getElementById('bpBuyLevelPanel');
    if (!panel) return;

    const lv = battlePassManager.getLevel();
    if (lv >= BATTLEPASS_MAX_LEVEL) {
        showSaveNotification('❌ ' + (languageManager.getText('bpMaxLevel') || '已满级'), true);
        return;
    }

    _bpBuyCount = 1;
    updateBuyLevelUI();
    showPanel(panel);
    audioSystem.playSound('click');
}

function closeBuyLevelPanel() {
    const panel = document.getElementById('bpBuyLevelPanel');
    if (panel) hidePanel(panel);
}

function updateBuyLevelUI() {
    const lv = battlePassManager.getLevel();
    const maxBuyable = BATTLEPASS_MAX_LEVEL - lv;

    if (_bpBuyCount < 1) _bpBuyCount = 1;
    if (_bpBuyCount > maxBuyable) _bpBuyCount = maxBuyable;

    const total = _bpBuyCount * BATTLEPASS_LEVEL_PRICE;
    const afterLevel = lv + _bpBuyCount;

    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    const curEl = document.getElementById('bpBuyCurrentLevel');
    const priceEl = document.getElementById('bpBuyPricePerLevel');
    const countEl = document.getElementById('bpBuyCount');
    const costEl = document.getElementById('bpBuyTotalCost');
    const afterEl = document.getElementById('bpBuyAfterLevel');
    const hintEl = document.getElementById('bpBuyHint');
    const minusBtn = document.getElementById('bpBuyMinus');
    const plusBtn = document.getElementById('bpBuyPlus');
    const confirmBtn = document.getElementById('bpBuyConfirm');

    if (curEl) curEl.textContent = `${lv} / ${BATTLEPASS_MAX_LEVEL}`;
    if (priceEl) priceEl.textContent = `${BATTLEPASS_LEVEL_PRICE.toLocaleString()} 💰`;
    if (countEl) countEl.textContent = _bpBuyCount;
    if (costEl) costEl.textContent = `${total.toLocaleString()} 💰`;
    if (afterEl) afterEl.textContent = `${afterLevel} / ${BATTLEPASS_MAX_LEVEL}`;

    if (minusBtn) minusBtn.disabled = _bpBuyCount <= 1;
    if (plusBtn) plusBtn.disabled = _bpBuyCount >= maxBuyable;

    if (confirmBtn) {
        const coins = (typeof shopManager !== 'undefined') ? shopManager.coins : 0;
        if (coins < total) {
            confirmBtn.disabled = true;
            if (hintEl) {
                hintEl.textContent = t('bpBuyNotEnoughCoins', '金币不足');
                hintEl.className = 'bp-buy-hint error';
            }
        } else {
            confirmBtn.disabled = false;
            if (hintEl) {
                hintEl.textContent = '';
                hintEl.className = 'bp-buy-hint';
            }
        }
    }
}

function handleBuyLevelConfirm() {
    const r = battlePassManager.buyLevels(_bpBuyCount);
    const t = (key, fallback) => {
        const v = languageManager.getText(key);
        return v === key ? fallback : v;
    };

    if (!r.ok) {
        let msg = '';
        if (r.reason === 'NOT_ENOUGH_COINS') msg = t('shopNotEnoughCoins', '金币不足');
        else if (r.reason === 'MAX_LEVEL') msg = t('bpMaxLevel', '已满级');
        else msg = t('bpBuyFailed', '购买失败');
        showSaveNotification('❌ ' + msg, true);
        audioSystem.playSound('gameover');
        return;
    }

    showSaveNotification(`✅ ${t('bpBuySuccess', '购买成功')} · +${r.count} ${t('bpLevelShort', 'Lv')} · -${r.cost.toLocaleString()} 💰`);
    audioSystem.playSound('targetIncrease');
    closeBuyLevelPanel();
    renderBattlePassPanel();
    updateBattlePassBadge();
}