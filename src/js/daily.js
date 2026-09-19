// ============================================================
// 任务系统（每日 / 每周 / 每月）
// - 每天 0 点刷新，每周一 0 点刷新，每月 1 号 0 点刷新（本地日期）
// - 日任务：2 单局 + 2 累计，40 池抽 4
// - 周任务：3 累计，11 池抽 3
// - 月任务：2 累计，9 池抽 2
// - 奖励手动领取
// - 仅本系统使用，不写入全局 statsData
// ============================================================

const DAILY_TASKS_KEY   = 'tetrisDailyTasks';
const WEEKLY_TASKS_KEY  = 'tetrisWeeklyTasks';
const MONTHLY_TASKS_KEY = 'tetrisMonthlyTasks';

const DAILY_ALL_BONUS   = 200;
const WEEKLY_ALL_BONUS  = 500;
const MONTHLY_ALL_BONUS = 1000;

const DAILY_TASK_POOL = [
    { id:'single_lines_10',        i18n:'dailyTaskSingleLines10',        target:10,     exp:40,  scope:'single', tier:1, metric:'lines' },
    { id:'single_lines_20',        i18n:'dailyTaskSingleLines20',        target:20,     exp:50,  scope:'single', tier:2, metric:'lines' },
    { id:'single_lines_40',        i18n:'dailyTaskSingleLines40',        target:40,     exp:120, scope:'single', tier:3, metric:'lines' },
    { id:'single_lines_60',        i18n:'dailyTaskSingleLines60',        target:60,     exp:200, scope:'single', tier:3, metric:'lines' },
    { id:'single_score_10k',       i18n:'dailyTaskSingleScore10k',       target:10000,  exp:50,  scope:'single', tier:1, metric:'score' },
    { id:'single_score_30k',       i18n:'dailyTaskSingleScore30k',       target:30000,  exp:100, scope:'single', tier:2, metric:'score' },
    { id:'single_score_60k',       i18n:'dailyTaskSingleScore60k',       target:60000,  exp:150, scope:'single', tier:3, metric:'score' },
    { id:'single_score_100k',      i18n:'dailyTaskSingleScore100k',      target:100000, exp:250, scope:'single', tier:3, metric:'score' },
    { id:'single_combo_3',         i18n:'dailyTaskCombo3',               target:3,      exp:50,  scope:'single', tier:1, metric:'maxCombo' },
    { id:'single_combo_5',         i18n:'dailyTaskCombo5',               target:5,      exp:80,  scope:'single', tier:2, metric:'maxCombo' },
    { id:'single_combo_8',         i18n:'dailyTaskCombo8',               target:8,      exp:120, scope:'single', tier:3, metric:'maxCombo' },
    { id:'single_tetris_1',        i18n:'dailyTaskSingleTetris1',        target:1,      exp:50,  scope:'single', tier:1, metric:'tetrisCount' },
    { id:'single_tetris_2',        i18n:'dailyTaskSingleTetris2',        target:2,      exp:90,  scope:'single', tier:2, metric:'tetrisCount' },
    { id:'single_tetris_5',        i18n:'dailyTaskSingleTetris5',        target:5,      exp:180, scope:'single', tier:3, metric:'tetrisCount' },
    { id:'single_no_pause',        i18n:'dailyTaskSingleNoPause',        target:1,      exp:60,  scope:'single', tier:2, metric:'noPauseFlag' },
    { id:'single_harddrop_30',     i18n:'dailyTaskSingleHarddrop30',     target:30,     exp:70,  scope:'single', tier:2, metric:'harddropCount' },

    { id:'daily_games_3',          i18n:'dailyTaskGames3',               target:3,      exp:40,  scope:'daily',  tier:1, metric:'gamesPlayed' },
    { id:'daily_games_5',          i18n:'dailyTaskGames5',               target:5,      exp:60,  scope:'daily',  tier:2, metric:'gamesPlayed' },
    { id:'daily_games_10',         i18n:'dailyTaskGames10',              target:10,     exp:120, scope:'daily',  tier:3, metric:'gamesPlayed' },
    { id:'daily_lines_50',         i18n:'dailyTaskLines50',              target:50,     exp:60,  scope:'daily',  tier:1, metric:'totalLines' },
    { id:'daily_lines_100',        i18n:'dailyTaskLines100',             target:100,    exp:120, scope:'daily',  tier:2, metric:'totalLines' },
    { id:'daily_lines_200',        i18n:'dailyTaskLines200',             target:200,    exp:200, scope:'daily',  tier:3, metric:'totalLines' },
    { id:'daily_lines_400',        i18n:'dailyTaskLines400',             target:400,    exp:350, scope:'daily',  tier:3, metric:'totalLines' },
    { id:'daily_score_50k',        i18n:'dailyTaskScore50k',             target:50000,  exp:80,  scope:'daily',  tier:1, metric:'totalScore' },
    { id:'daily_score_100k',       i18n:'dailyTaskScore100k',            target:100000, exp:150, scope:'daily',  tier:2, metric:'totalScore' },
    { id:'daily_score_300k',       i18n:'dailyTaskScore300k',            target:300000, exp:250, scope:'daily',  tier:3, metric:'totalScore' },
    { id:'daily_score_500k',       i18n:'dailyTaskScore500k',            target:500000, exp:350, scope:'daily',  tier:3, metric:'totalScore' },
    { id:'daily_tetris_1',         i18n:'dailyTaskTetris1',              target:1,      exp:40,  scope:'daily',  tier:1, metric:'tetrisCount' },
    { id:'daily_tetris_3',         i18n:'dailyTaskTetris3',              target:3,      exp:100, scope:'daily',  tier:2, metric:'tetrisCount' },
    { id:'daily_tetris_8',         i18n:'dailyTaskTetris8',              target:8,      exp:200, scope:'daily',  tier:3, metric:'tetrisCount' },
    { id:'daily_no_pause_1',       i18n:'dailyTaskNoPause1',             target:1,      exp:50,  scope:'daily',  tier:1, metric:'noPauseGames' },
    { id:'daily_no_pause_3',       i18n:'dailyTaskNoPause3',             target:3,      exp:90,  scope:'daily',  tier:2, metric:'noPauseGames' },
    { id:'daily_no_pause_5',       i18n:'dailyTaskNoPause5',             target:5,      exp:150, scope:'daily',  tier:3, metric:'noPauseGames' },
    { id:'daily_play_5min',        i18n:'dailyTaskPlay5min',             target:300,    exp:40,  scope:'daily',  tier:1, metric:'playSeconds' },
    { id:'daily_play_15min',       i18n:'dailyTaskPlay15min',            target:900,    exp:80,  scope:'daily',  tier:2, metric:'playSeconds' },
    { id:'daily_play_30min',       i18n:'dailyTaskPlay30min',            target:1800,   exp:150, scope:'daily',  tier:3, metric:'playSeconds' },
    { id:'daily_play_60min',       i18n:'dailyTaskPlay60min',            target:3600,   exp:250, scope:'daily',  tier:3, metric:'playSeconds' },
    { id:'daily_harddrop_100',     i18n:'dailyTaskHarddrop100',          target:100,    exp:80,  scope:'daily',  tier:2, metric:'harddropCount' },
    { id:'daily_harddrop_300',     i18n:'dailyTaskHarddrop300',          target:300,    exp:180, scope:'daily',  tier:3, metric:'harddropCount' },
    { id:'daily_rotate_500',       i18n:'dailyTaskRotate500',            target:500,    exp:100, scope:'daily',  tier:2, metric:'rotateCount' }
];

const WEEKLY_TASK_POOL = [
    { id:'weekly_games_10',    i18n:'weeklyTaskGames10',    target:10,     exp:200,  scope:'accumulate', tier:2, metric:'gamesPlayed' },
    { id:'weekly_games_25',    i18n:'weeklyTaskGames25',    target:25,     exp:400,  scope:'accumulate', tier:3, metric:'gamesPlayed' },
    { id:'weekly_games_50',    i18n:'weeklyTaskGames50',    target:50,     exp:700,  scope:'accumulate', tier:3, metric:'gamesPlayed' },
    { id:'weekly_lines_200',   i18n:'weeklyTaskLines200',   target:200,    exp:250,  scope:'accumulate', tier:2, metric:'totalLines' },
    { id:'weekly_lines_500',   i18n:'weeklyTaskLines500',   target:500,    exp:500,  scope:'accumulate', tier:3, metric:'totalLines' },
    { id:'weekly_lines_1000',  i18n:'weeklyTaskLines1000',  target:1000,   exp:800,  scope:'accumulate', tier:3, metric:'totalLines' },
    { id:'weekly_score_200k',  i18n:'weeklyTaskScore200k',  target:200000, exp:250,  scope:'accumulate', tier:2, metric:'totalScore' },
    { id:'weekly_score_500k',  i18n:'weeklyTaskScore500k',  target:500000, exp:500,  scope:'accumulate', tier:3, metric:'totalScore' },
    { id:'weekly_score_1m',    i18n:'weeklyTaskScore1m',    target:1000000,exp:800,  scope:'accumulate', tier:3, metric:'totalScore' },
    { id:'weekly_play_60min',  i18n:'weeklyTaskPlay60min',  target:3600,   exp:300,  scope:'accumulate', tier:2, metric:'playSeconds' },
    { id:'weekly_play_180min', i18n:'weeklyTaskPlay180min', target:10800,  exp:600,  scope:'accumulate', tier:3, metric:'playSeconds' }
];

const MONTHLY_TASK_POOL = [
    { id:'monthly_games_100',    i18n:'monthlyTaskGames100',    target:100,     exp:500,  scope:'accumulate', tier:2, metric:'gamesPlayed' },
    { id:'monthly_games_300',    i18n:'monthlyTaskGames300',    target:300,     exp:1200, scope:'accumulate', tier:3, metric:'gamesPlayed' },
    { id:'monthly_lines_2000',   i18n:'monthlyTaskLines2000',   target:2000,    exp:800,  scope:'accumulate', tier:2, metric:'totalLines' },
    { id:'monthly_lines_5000',   i18n:'monthlyTaskLines5000',   target:5000,    exp:1500, scope:'accumulate', tier:3, metric:'totalLines' },
    { id:'monthly_lines_10000',  i18n:'monthlyTaskLines10000',  target:10000,   exp:2000, scope:'accumulate', tier:3, metric:'totalLines' },
    { id:'monthly_score_2m',     i18n:'monthlyTaskScore2m',     target:2000000, exp:800,  scope:'accumulate', tier:2, metric:'totalScore' },
    { id:'monthly_score_5m',     i18n:'monthlyTaskScore5m',     target:5000000, exp:1500, scope:'accumulate', tier:3, metric:'totalScore' },
    { id:'monthly_play_10h',     i18n:'monthlyTaskPlay10h',     target:36000,   exp:1000, scope:'accumulate', tier:2, metric:'playSeconds' },
    { id:'monthly_play_30h',     i18n:'monthlyTaskPlay30h',     target:108000,  exp:2000, scope:'accumulate', tier:3, metric:'playSeconds' }
];

// ===== 周期字符串 =====
function pad2(n) { return String(n).padStart(2, '0'); }

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getWeekStr() {
    const d = new Date();
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

function getMonthStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// ===== 抽题 =====
function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function pickN(arr, n, s) {
    const pool = arr.slice();
    const out = [];
    for (let i = 0; i < n && pool.length; i++) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        out.push(pool.splice(s % pool.length, 1)[0]);
    }
    return { out, s };
}

function pickDailyTasks(dateStr) {
    let s = hashStr(dateStr);
    const all = [...DAILY_TASK_POOL];
    const byTier = { 1: [], 2: [], 3: [] };
    for (const t of all) byTier[t.tier].push(t);
    const picked = [];
    const usedIds = new Set();
    { const r = pickN(byTier[1], 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const cand = byTier[2].filter(t => !usedIds.has(t.id)); const r = pickN(cand, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const cand = byTier[3].filter(t => !usedIds.has(t.id)); const r = pickN(cand, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const remain = all.filter(t => !usedIds.has(t.id)); const r = pickN(remain, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    for (let i = picked.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
}

function pickWeeklyTasks(weekStr) {
    let s = hashStr('W:' + weekStr);
    const picked = [];
    const usedIds = new Set();
    const t2 = WEEKLY_TASK_POOL.filter(t => t.tier === 2);
    const t3 = WEEKLY_TASK_POOL.filter(t => t.tier === 3);
    { const r = pickN(t2, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const r = pickN(t3, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const remain = WEEKLY_TASK_POOL.filter(t => !usedIds.has(t.id)); const r = pickN(remain, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); } }
    for (let i = picked.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
}

function pickMonthlyTasks(monthStr) {
    let s = hashStr('M:' + monthStr);
    const picked = [];
    const usedIds = new Set();
    const t2 = MONTHLY_TASK_POOL.filter(t => t.tier === 2);
    const t3 = MONTHLY_TASK_POOL.filter(t => t.tier === 3);
    { const r = pickN(t2, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); } }
    { const r = pickN(t3, 1, s); s = r.s; if (r.out[0]) { picked.push(r.out[0]); } }
    for (let i = picked.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
}

// ============================================================
// 单个周期的任务组
// ============================================================
class TaskGroup {
    constructor({ key, periodFn, poolPickFn, allBonus, hasCurrent }) {
        this.key = key;
        this.periodFn = periodFn;
        this.poolPickFn = poolPickFn;
        this.allBonus = allBonus;
        this.hasCurrent = hasCurrent;
        this.state = null;
    }

    _emptyCurrent() {
        return { lines: 0, score: 0, maxCombo: 0, tetrisCount: 0, harddropCount: 0, noPauseFlag: 0, pausedThisGame: false };
    }
    _emptyStats() {
        return { gamesPlayed: 0, totalLines: 0, totalScore: 0, tetrisCount: 0, noPauseGames: 0, playSeconds: 0, harddropCount: 0, rotateCount: 0 };
    }
    _createNewState(period) {
        const tasks = this.poolPickFn(period).map(t => ({
            id: t.id, i18n: t.i18n, target: t.target, exp: t.exp,
            scope: t.scope, tier: t.tier, metric: t.metric,
            claimed: false, ready: false
        }));
        return {
            period, tasks, allBonusClaimed: false,
            stats: this._emptyStats(),
            current: this.hasCurrent ? this._emptyCurrent() : null
        };
    }
    refresh() {
        const period = this.periodFn();
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) {}
        if (saved && saved.period === period && Array.isArray(saved.tasks)) {
            this.state = saved;
            if (!this.state.stats) this.state.stats = this._emptyStats();
            if (!this.state.stats.rotateCount) this.state.stats.rotateCount = 0;
            if (!this.state.stats.harddropCount) this.state.stats.harddropCount = 0;
            if (this.hasCurrent && !this.state.current) this.state.current = this._emptyCurrent();
            for (const t of this.state.tasks) {
                if (t.ready === undefined) t.ready = false;
                if (!t.ready && !t.claimed) {
                    const { value, target } = this._getProgress(t);
                    if (value >= target) t.ready = true;
                }
            }
            this._save();
        } else {
            this.state = this._createNewState(period);
            this._save();
        }
    }
    _save() {
        try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch (e) {}
        // 任务状态变化后刷新任务按钮红点
        if (typeof updateTaskBadge === 'function') updateTaskBadge();
    }
    onGameStart() {
        if (!this.state) return;
        if (this.hasCurrent) { this.state.current = this._emptyCurrent(); this._save(); }
    }
    onProgress(data) {
        if (!this.state) return;
        if (this.hasCurrent && !this.state.current) this.state.current = this._emptyCurrent();
        const cur = this.state.current;
        if (cur) {
            if (typeof data.lines === 'number') cur.lines = data.lines;
            if (typeof data.score === 'number') cur.score = data.score;
            if (typeof data.maxCombo === 'number') cur.maxCombo = Math.max(cur.maxCombo, data.maxCombo);
            if (typeof data.tetrisInc === 'number') cur.tetrisCount += data.tetrisInc;
            if (typeof data.harddropInc === 'number') cur.harddropCount += data.harddropInc;
            if (typeof data.paused === 'boolean') cur.pausedThisGame = cur.pausedThisGame || data.paused;
        }
        if (typeof data.tetrisInc === 'number') this.state.stats.tetrisCount += data.tetrisInc;
        if (typeof data.harddropInc === 'number') this.state.stats.harddropCount += data.harddropInc;
        if (typeof data.rotateInc === 'number') this.state.stats.rotateCount += data.rotateInc;
        this._checkReady();
        this._save();
    }
    onGameEnd({ score, lines, maxCombo, pausedThisGame, playSeconds }) {
        if (!this.state) return;
        const s = this.state.stats;
        s.gamesPlayed += 1;
        s.totalLines += (lines || 0);
        s.totalScore += (score || 0);
        if (!pausedThisGame) s.noPauseGames += 1;
        s.playSeconds += (playSeconds || 0);
        if (this.hasCurrent) {
            if (!this.state.current) this.state.current = this._emptyCurrent();
            const cur = this.state.current;
            cur.lines = lines || 0;
            cur.score = score || 0;
            cur.maxCombo = maxCombo || 0;
            cur.pausedThisGame = !!pausedThisGame;
            cur.noPauseFlag = pausedThisGame ? 0 : 1;
        }
        this._checkReady();
        this._save();
    }
    _checkReady() {
        if (!this.state || !Array.isArray(this.state.tasks)) return;
        for (const task of this.state.tasks) {
            if (task.claimed || task.ready) continue;
            const { value, target } = this._getProgress(task);
            if (value >= target) task.ready = true;
        }
    }
    _getProgress(task) {
        if (task.scope === 'single') {
            const cur = this.state.current || {};
            return { value: cur[task.metric] || 0, target: task.target };
        } else {
            return { value: this.state.stats[task.metric] || 0, target: task.target };
        }
    }
    _isReady(task) {
        if (task.ready) return true;
        const { value, target } = this._getProgress(task);
        return value >= target;
    }
    _isAllCompleted() { return this.state.tasks.every(t => t.claimed); }
    _isAllReady() { return this.state.tasks.every(t => this._isReady(t) || t.claimed); }

    // 是否有可领取的（任务或全勤奖励）
    hasClaimable() {
        if (!this.state) return false;
        if (!this.state.allBonusClaimed && this._isAllReady()) return true;
        return this.state.tasks.some(t => !t.claimed && this._isReady(t));
    }

    claim(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task || task.claimed) return;
        if (!this._isReady(task)) return;
        task.claimed = true;
        levelManager.addExp(task.exp);
        if (typeof shopManager !== 'undefined') {
            shopManager.addCoins(Math.floor(task.exp / 2));
            if (typeof updateShopBadge === 'function') updateShopBadge();
        }
        audioSystem.playSound('start');
        showSaveNotification(`✅ +${task.exp} EXP`);
        this._save();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        if (typeof achievementManager !== 'undefined') achievementManager.onDailyClaim();
    }
    claimAllBonus() {
        if (this.state.allBonusClaimed) return;
        if (!this._isAllCompleted()) return;
        this.state.allBonusClaimed = true;
        levelManager.addExp(this.allBonus);
        if (typeof shopManager !== 'undefined') {
            shopManager.addCoins(Math.floor(this.allBonus / 2));
            if (typeof updateShopBadge === 'function') updateShopBadge();
        }
        audioSystem.playSound('start');
        showSaveNotification(`🎉 +${this.allBonus} EXP`);
        this._save();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        if (typeof achievementManager !== 'undefined') achievementManager.onDailyAllClaim();
    }
}

// ============================================================
// 任务系统总控
// ============================================================
class TaskSystem {
    constructor() {
        this.daily = new TaskGroup({ key: DAILY_TASKS_KEY, periodFn: getTodayStr, poolPickFn: pickDailyTasks, allBonus: DAILY_ALL_BONUS, hasCurrent: true });
        this.weekly = new TaskGroup({ key: WEEKLY_TASKS_KEY, periodFn: getWeekStr, poolPickFn: pickWeeklyTasks, allBonus: WEEKLY_ALL_BONUS, hasCurrent: false });
        this.monthly = new TaskGroup({ key: MONTHLY_TASKS_KEY, periodFn: getMonthStr, poolPickFn: pickMonthlyTasks, allBonus: MONTHLY_ALL_BONUS, hasCurrent: false });
        this._currentTab = 'daily';
        this._countdownTimer = null;
        this._tickCountdown = null;
        this._modalEl = null;
        this._listEl = null;
        this._dateEl = null;
        this._countdownEl = null;
        this._allBonusEl = null;
        this._tabsEl = null;
    }

    init() {
        this._modalEl = document.getElementById('dailyTaskPanel');
        this._listEl = document.getElementById('dailyTaskList');
        this._dateEl = document.getElementById('dailyTaskDate');
        this._countdownEl = document.getElementById('dailyTaskCountdown');
        this._allBonusEl = document.getElementById('dailyTaskAllBonus');
        this._tabsEl = document.getElementById('taskTabs');
        this._bindEvents();
        this.refresh();
        this.startCountdown();
        this.render();
    }

    _bindEvents() {
        const closeBtn = document.querySelector('.close-daily-task');
        if (closeBtn) closeBtn.addEventListener('click', () => { hidePanel(this._modalEl); audioSystem.playSound('click'); });
        const openBtn = document.getElementById('dailyTasksBtn');
        if (openBtn) openBtn.addEventListener('click', () => {
            showPanel(this._modalEl);
            this.render();
            if (this._tickCountdown) this._tickCountdown();
            audioSystem.playSound('click');
        });
        if (this._tabsEl) {
            this._tabsEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.leaderboard-tab');
                if (!btn) return;
                const newTab = btn.getAttribute('data-task-tab');
                if (newTab === this._currentTab) return;
                this._currentTab = newTab;
                if (this._tickCountdown) this._tickCountdown();
                this.render();
                audioSystem.playSound('click');
            });
        }
        if (this._listEl) {
            this._listEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.daily-task-claim');
                if (!btn) return;
                if (btn.disabled) return;
                const taskId = btn.getAttribute('data-task-id');
                this.getGroup(this._currentTab).claim(taskId);
                this.render();
            });
        }
        if (this._allBonusEl) {
            this._allBonusEl.addEventListener('click', (e) => {
                if (e.target.closest('.daily-task-claim-all')) {
                    this.getGroup(this._currentTab).claimAllBonus();
                    this.render();
                }
            });
        }
    }

    getGroup(tab) {
        if (tab === 'weekly') return this.weekly;
        if (tab === 'monthly') return this.monthly;
        return this.daily;
    }

    // 是否有任何可领取的任务（日/周/月任一）
    hasClaimable() {
        try {
            return this.daily.hasClaimable() || this.weekly.hasClaimable() || this.monthly.hasClaimable();
        } catch (e) {
            return false;
        }
    }

    refresh() {
        this.daily.refresh();
        this.weekly.refresh();
        this.monthly.refresh();
        if (typeof updateTaskBadge === 'function') updateTaskBadge();
    }
    onGameStart() { this.daily.onGameStart(); this.weekly.onGameStart(); this.monthly.onGameStart(); }
    onProgress(data) { this.daily.onProgress(data); this.weekly.onProgress(data); this.monthly.onProgress(data); }
    onGameEnd(data) { this.daily.onGameEnd(data); this.weekly.onGameEnd(data); this.monthly.onGameEnd(data); }

    startCountdown() {
        if (this._countdownTimer) clearInterval(this._countdownTimer);
        this._tickCountdown = () => {
            const now = new Date();
            let target;
            if (this._currentTab === 'weekly') {
                target = new Date(now);
                const day = now.getDay() || 7;
                target.setDate(now.getDate() - day + 8);
                target.setHours(0, 0, 0, 0);
            } else if (this._currentTab === 'monthly') {
                target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            } else {
                target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            }
            const diff = Math.max(0, target - now);
            let text;
            if (this._currentTab === 'daily') {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                text = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
            } else {
                const lang = languageManager;
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                const isChinese = lang.currentLang === 'zh-CN' || lang.currentLang === 'zh-TW';
                const sep = isChinese ? '' : ' ';
                text = `${d}${lang.getText('taskTimeDay')}${sep}${h}${lang.getText('taskTimeHour')}${sep}${m}${lang.getText('taskTimeMin')}${sep}${s}${lang.getText('taskTimeSec')}`;
            }
            if (this._countdownEl) this._countdownEl.textContent = text;
            if (diff <= 1000) { this.refresh(); this.render(); }
        };
        this._tickCountdown();
        this._countdownTimer = setInterval(this._tickCountdown, 1000);
    }

    render() {
        const group = this.getGroup(this._currentTab);
        if (!group.state) return;
        const lang = languageManager;

        if (this._dateEl) {
            const fromLabel = lang.getText('taskPeriodFrom');
            if (this._currentTab === 'weekly') this._dateEl.textContent = '📅 ' + group.state.period + ' ' + fromLabel;
            else if (this._currentTab === 'monthly') this._dateEl.textContent = '📅 ' + group.state.period;
            else this._dateEl.textContent = group.state.period;
        }

        if (this._tabsEl) {
            this._tabsEl.querySelectorAll('.leaderboard-tab').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-task-tab') === this._currentTab);
            });
        }

        if (this._listEl) {
            this._listEl.innerHTML = group.state.tasks.map(task => {
                const { value, target } = group._getProgress(task);
                const pct = Math.min(100, Math.round(value / target * 100));
                const ready = group._isReady(task);
                const claimed = task.claimed;
                const name = lang.getText(task.i18n);
                const check = claimed ? '✅' : (ready ? '🎁' : '⬜');
                const progressText = claimed ? `${pct}%` : `${pct}%  ${value.toLocaleString()}/${target.toLocaleString()}`;
                let actionHtml = '';
                if (claimed) {
                    actionHtml = `<span class="daily-task-claimed">${lang.getText('dailyTaskClaimed')}</span>`;
                } else if (ready) {
                    actionHtml = `<button class="daily-task-claim" data-task-id="${task.id}">${lang.getText('dailyTaskClaim')}</button>`;
                } else {
                    actionHtml = `<button class="daily-task-claim" data-task-id="${task.id}" disabled>${lang.getText('dailyTaskClaim')}</button>`;
                }
                return `<div class="daily-task-item ${claimed ? 'completed' : ''} ${ready && !claimed ? 'ready' : ''}">
                    <div class="daily-task-check">${check}</div>
                    <div class="daily-task-body">
                        <div class="daily-task-row">
                            <span class="daily-task-name">${name}</span>
                            <span class="daily-task-reward">+${task.exp} exp</span>
                        </div>
                        <div class="daily-task-progress">
                            <div class="daily-task-progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="daily-task-progress-text">${progressText}</div>
                    </div>
                    ${actionHtml}
                </div>`;
            }).join('');
        }

        if (this._allBonusEl) {
            const allReady = group._isAllReady();
            const allClaimed = group.state.allBonusClaimed;
            let html = `<span>${lang.getText('dailyTaskAllBonus')}</span>`;
            if (allClaimed) {
                html += `<span class="daily-task-all-exp claimed">✓ ${lang.getText('dailyTaskClaimed')} +${group.allBonus} exp</span>`;
                this._allBonusEl.classList.add('claimed');
            } else if (allReady) {
                html += `<button class="daily-task-claim-all">${lang.getText('dailyTaskClaim')} +${group.allBonus} exp</button>`;
                this._allBonusEl.classList.remove('claimed');
            } else {
                html += `<span class="daily-task-all-exp">+${group.allBonus} exp</span>`;
                this._allBonusEl.classList.remove('claimed');
            }
            this._allBonusEl.innerHTML = html;
        }

        // 渲染完成后刷新任务按钮红点
        if (typeof updateTaskBadge === 'function') updateTaskBadge();
    }
}

const taskSystem = new TaskSystem();

const dailyTaskManager = {
    init: () => taskSystem.init(),
    render: () => taskSystem.render(),
    onGameStart: () => taskSystem.onGameStart(),
    onProgress: (d) => taskSystem.onProgress(d),
    onGameEnd: (d) => taskSystem.onGameEnd(d),
    refresh: () => taskSystem.refresh(),
    get state() { return taskSystem.daily.state; }
};