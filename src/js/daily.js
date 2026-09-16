// ============================================================
// 每日任务系统
// - 每天 0 点刷新（本地日期）
// - 40 个任务池，每天抽 2 单局 + 2 累计（按 tier 分层）
// - 单局类任务：当前局实时进度，达标即持久化 ready
// - 累计类任务：当天累计
// - 奖励手动领取
// - 仅本系统使用，不写入全局 statsData
// ============================================================

const DAILY_TASKS_KEY = 'tetrisDailyTasks';
const DAILY_TASK_COUNT = 4;
const DAILY_ALL_BONUS = 200;
const DAILY_SINGLE_COUNT = 2;
const DAILY_DAILY_COUNT = 2;

const DAILY_TASK_POOL = [
    // ===== 单局类 16 个 =====
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

    // ===== 累计类 24 个 =====
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

function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

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
    const seed = hashStr(dateStr);
    let s = seed;

    const singles = DAILY_TASK_POOL.filter(t => t.scope === 'single');
    const dailies = DAILY_TASK_POOL.filter(t => t.scope === 'daily');

    const all = [...singles, ...dailies];
    const byTier = { 1: [], 2: [], 3: [] };
    for (const t of all) byTier[t.tier].push(t);

    const picked = [];
    const usedIds = new Set();

    {
        const r = pickN(byTier[1], 1, s); s = r.s;
        if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); }
    }
    {
        const cand = byTier[2].filter(t => !usedIds.has(t.id));
        const r = pickN(cand, 1, s); s = r.s;
        if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); }
    }
    {
        const cand = byTier[3].filter(t => !usedIds.has(t.id));
        const r = pickN(cand, 1, s); s = r.s;
        if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); }
    }
    {
        const remain = all.filter(t => !usedIds.has(t.id));
        const r = pickN(remain, 1, s); s = r.s;
        if (r.out[0]) { picked.push(r.out[0]); usedIds.add(r.out[0].id); }
    }

    for (let i = picked.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [picked[i], picked[j]] = [picked[j], picked[i]];
    }

    return picked;
}

class DailyTaskManager {
    constructor() {
        this.state = null;
        this._countdownTimer = null;
        this._modalEl = null;
        this._listEl = null;
        this._dateEl = null;
        this._countdownEl = null;
        this._allBonusEl = null;
    }

    init() {
        this._modalEl = document.getElementById('dailyTaskPanel');
        this._listEl = document.getElementById('dailyTaskList');
        this._dateEl = document.getElementById('dailyTaskDate');
        this._countdownEl = document.getElementById('dailyTaskCountdown');
        this._allBonusEl = document.getElementById('dailyTaskAllBonus');
        this._bindEvents();
        this.refresh();
        this.startCountdown();
    }

    _bindEvents() {
        const closeBtn = document.querySelector('.close-daily-task');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            hidePanel(this._modalEl);
            audioSystem.playSound('click');
        });
        const openBtn = document.getElementById('dailyTasksBtn');
        if (openBtn) openBtn.addEventListener('click', () => {
            showPanel(this._modalEl);
            this.render();
            audioSystem.playSound('click');
        });
        if (this._listEl) {
            this._listEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.daily-task-claim');
                if (!btn) return;
                const taskId = btn.getAttribute('data-task-id');
                this.claim(taskId);
            });
        }
        if (this._allBonusEl) {
            this._allBonusEl.addEventListener('click', (e) => {
                if (e.target.closest('.daily-task-claim-all')) {
                    this.claimAllBonus();
                }
            });
        }
    }

    refresh() {
        const today = getTodayStr();
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(DAILY_TASKS_KEY) || 'null'); } catch (e) {}

        if (saved && saved.date === today && Array.isArray(saved.tasks)) {
            this.state = saved;
            if (!this.state.stats) this.state.stats = {};
            if (!this.state.stats.rotateCount) this.state.stats.rotateCount = 0;
            if (!this.state.stats.harddropCount) this.state.stats.harddropCount = 0;
            if (!this.state.current) this.state.current = this._emptyCurrent();
            // 补 ready 字段，并对已有进度做一次达标补判
            for (const t of this.state.tasks) {
                if (t.ready === undefined) t.ready = false;
                if (!t.ready && !t.claimed) {
                    const { value, target } = this._getProgress(t);
                    if (value >= target) t.ready = true;
                }
            }
            this._save();
        } else {
            this.state = this._createNewState(today);
            this._save();
        }
        this.render();
    }

    _emptyCurrent() {
        return {
            lines: 0,
            score: 0,
            maxCombo: 0,
            tetrisCount: 0,
            harddropCount: 0,
            noPauseFlag: 0,
            pausedThisGame: false
        };
    }

    _createNewState(date) {
        const tasks = pickDailyTasks(date).map(t => ({
            id: t.id,
            i18n: t.i18n,
            target: t.target,
            exp: t.exp,
            scope: t.scope,
            tier: t.tier,
            metric: t.metric,
            progress: 0,
            claimed: false,
            ready: false
        }));
        return {
            date,
            tasks,
            allBonusClaimed: false,
            stats: {
                gamesPlayed: 0,
                totalLines: 0,
                totalScore: 0,
                tetrisCount: 0,
                noPauseGames: 0,
                playSeconds: 0,
                harddropCount: 0,
                rotateCount: 0
            },
            current: this._emptyCurrent()
        };
    }

    _save() {
        try { localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(this.state)); } catch (e) {}
    }

    onGameStart() {
        if (!this.state) return;
        this.state.current = this._emptyCurrent();
        this._save();
        if (this._modalEl && this._modalEl.style.display !== 'none') this.render();
    }

    onProgress(data) {
        if (!this.state) return;
        if (!this.state.current) this.state.current = this._emptyCurrent();
        const cur = this.state.current;
        if (typeof data.lines === 'number') cur.lines = data.lines;
        if (typeof data.score === 'number') cur.score = data.score;
        if (typeof data.maxCombo === 'number') cur.maxCombo = Math.max(cur.maxCombo, data.maxCombo);
        if (typeof data.tetrisInc === 'number') {
            cur.tetrisCount += data.tetrisInc;
            this.state.stats.tetrisCount += data.tetrisInc;
        }
        if (typeof data.harddropInc === 'number') {
            cur.harddropCount += data.harddropInc;
            this.state.stats.harddropCount += data.harddropInc;
        }
        if (typeof data.rotateInc === 'number') {
            this.state.stats.rotateCount += data.rotateInc;
        }
        if (typeof data.paused === 'boolean') {
            cur.pausedThisGame = cur.pausedThisGame || data.paused;
        }

        // 达标检测：达标即写 ready 并持久化
        this._checkReady();

        this._save();
        if (this._modalEl && this._modalEl.style.display !== 'none') this.render();
    }

    onGameEnd({ score, lines, maxCombo, pausedThisGame, playSeconds }) {
        if (!this.state) return;
        if (!this.state.current) this.state.current = this._emptyCurrent();
        const s = this.state.stats;
        s.gamesPlayed += 1;
        s.totalLines += (lines || 0);
        s.totalScore += (score || 0);
        if (!pausedThisGame) s.noPauseGames += 1;
        s.playSeconds += (playSeconds || 0);

        const cur = this.state.current;
        cur.lines = lines || 0;
        cur.score = score || 0;
        cur.maxCombo = maxCombo || 0;
        cur.pausedThisGame = !!pausedThisGame;
        cur.noPauseFlag = pausedThisGame ? 0 : 1;

        // 达标检测：本局最终数据也参与判定
        this._checkReady();

        this._save();
        if (this._modalEl && this._modalEl.style.display !== 'none') this.render();
    }

    // 遍历所有未领取任务，达标则写 ready
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
            const v = cur[task.metric] || 0;
            return { value: v, target: task.target };
        } else {
            const v = this.state.stats[task.metric] || 0;
            return { value: v, target: task.target };
        }
    }

    _isReady(task) {
        if (task.ready) return true;
        const { value, target } = this._getProgress(task);
        return value >= target;
    }

    _isAllCompleted() {
        return this.state.tasks.every(t => t.claimed);
    }

    _isAllReady() {
        return this.state.tasks.every(t => this._isReady(t) || t.claimed);
    }

    claim(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task || task.claimed) return;
        if (!this._isReady(task)) return;
        task.claimed = true;
        levelManager.addExp(task.exp);
        audioSystem.playSound('start');
        showSaveNotification(`✅ +${task.exp} EXP`);
        this._save();
        this.render();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
    }

    claimAllBonus() {
        if (this.state.allBonusClaimed) return;
        if (!this._isAllCompleted()) return;
        this.state.allBonusClaimed = true;
        levelManager.addExp(DAILY_ALL_BONUS);
        audioSystem.playSound('start');
        showSaveNotification(`🎉 +${DAILY_ALL_BONUS} EXP`);
        this._save();
        this.render();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
    }

    startCountdown() {
        if (this._countdownTimer) clearInterval(this._countdownTimer);
        const tick = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const diff = Math.max(0, tomorrow - now);
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const text = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (this._countdownEl) this._countdownEl.textContent = text;
            if (diff <= 1000) this.refresh();
        };
        tick();
        this._countdownTimer = setInterval(tick, 1000);
    }

    render() {
        if (!this.state) return;
        const lang = languageManager;
        if (this._dateEl) this._dateEl.textContent = this.state.date;
        if (!this._listEl) return;

        this._listEl.innerHTML = this.state.tasks.map(task => {
            const { value, target } = this._getProgress(task);
            const pct = Math.min(100, Math.round(value / target * 100));
            const ready = this._isReady(task);
            const claimed = task.claimed;
            const done = claimed;
            const name = lang.getText(task.i18n);
            const check = done ? '✅' : (ready ? '🎁' : '⬜');
            const progressText = done
                ? `${pct}%`
                : `${pct}%  ${value.toLocaleString()}/${target.toLocaleString()}`;
            let actionHtml = '';
            if (claimed) {
                actionHtml = `<span class="daily-task-claimed">${lang.getText('dailyTaskClaimed')}</span>`;
            } else if (ready) {
                actionHtml = `<button class="daily-task-claim" data-task-id="${task.id}">${lang.getText('dailyTaskClaim')}</button>`;
            }
            return `<div class="daily-task-item ${done ? 'completed' : ''} ${ready && !claimed ? 'ready' : ''}">
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

        if (this._allBonusEl) {
            const allReady = this._isAllReady();
            const allClaimed = this.state.allBonusClaimed;
            let html = `<span>${lang.getText('dailyTaskAllBonus')}</span>`;
            if (allClaimed) {
                html += `<span class="daily-task-all-exp claimed">✓ ${lang.getText('dailyTaskClaimed')} +${DAILY_ALL_BONUS} exp</span>`;
                this._allBonusEl.classList.add('claimed');
            } else if (allReady && this._isAllCompleted()) {
                html += `<button class="daily-task-claim-all">${lang.getText('dailyTaskClaim')} +${DAILY_ALL_BONUS} exp</button>`;
                this._allBonusEl.classList.remove('claimed');
            } else {
                html += `<span class="daily-task-all-exp">+${DAILY_ALL_BONUS} exp</span>`;
                this._allBonusEl.classList.remove('claimed');
            }
            this._allBonusEl.innerHTML = html;
        }
    }
}

const dailyTaskManager = new DailyTaskManager();