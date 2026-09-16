// ============================================================
// 成就系统
// ============================================================
const ACHIEVEMENTS = [
    // ===== 里程碑 =====
    { id:'first_game',   category:'milestone',  icon:'🎮', expReward:20,  nameKey:'achFirstGame',   descKey:'achFirstGameDesc' },
    { id:'first_line',   category:'milestone',  icon:'✨', expReward:20,  nameKey:'achFirstLine',   descKey:'achFirstLineDesc' },
    { id:'first_tetris', category:'milestone',  icon:'🎯', expReward:50,  nameKey:'achFirstTetris', descKey:'achFirstTetrisDesc' },
    { id:'games_10',     category:'milestone',  icon:'🎮', expReward:30,  nameKey:'achGames10',     descKey:'achGames10Desc' },
    { id:'games_100',    category:'milestone',  icon:'🕹️', expReward:100, nameKey:'achGames100',    descKey:'achGames100Desc' },
    { id:'level_10',     category:'milestone',  icon:'📈', expReward:100, nameKey:'achLevel10',     descKey:'achLevel10Desc' },
    { id:'level_20',     category:'milestone',  icon:'🚀', expReward:200, nameKey:'achLevel20',     descKey:'achLevel20Desc' },

    // ===== 累计 =====
    { id:'lines_100',    category:'cumulative', icon:'📏', expReward:50,  nameKey:'achLines100',    descKey:'achLines100Desc' },
    { id:'lines_1000',   category:'cumulative', icon:'📐', expReward:200, nameKey:'achLines1000',   descKey:'achLines1000Desc' },
    { id:'harddrop_100', category:'cumulative', icon:'⬇️', expReward:50,  nameKey:'achHarddrop100', descKey:'achHarddrop100Desc' },
    { id:'harddrop_1000',category:'cumulative', icon:'⏬', expReward:200, nameKey:'achHarddrop1000',descKey:'achHarddrop1000Desc' },
    { id:'rotate_1000',  category:'cumulative', icon:'🔃', expReward:100, nameKey:'achRotate1000',  descKey:'achRotate1000Desc' },

    // ===== 单局 =====
    { id:'score_10k',    category:'single',     icon:'💯', expReward:50,  nameKey:'achScore10k',    descKey:'achScore10kDesc' },
    { id:'score_100k',   category:'single',     icon:'💎', expReward:200, nameKey:'achScore100k',   descKey:'achScore100kDesc' },

    // ===== 技巧 =====
    { id:'classic_no_pause_30', category:'skill', icon:'🧘', expReward:100, nameKey:'achClassicNoPause30', descKey:'achClassicNoPause30Desc' },
    { id:'sprint_300',   category:'skill',      icon:'🏃', expReward:50,  nameKey:'achSprint300',   descKey:'achSprint300Desc' },
    { id:'sprint_240',   category:'skill',      icon:'⚡', expReward:100, nameKey:'achSprint240',   descKey:'achSprint240Desc' },
    { id:'sprint_180',   category:'skill',      icon:'💨', expReward:150, nameKey:'achSprint180',   descKey:'achSprint180Desc' },
    { id:'sprint_150',   category:'skill',      icon:'💥', expReward:200, nameKey:'achSprint150',   descKey:'achSprint150Desc' },

    // ===== 模式 =====
    { id:'classic_lines_50',   category:'mode', icon:'🏛️', expReward:50,  nameKey:'achClassicLines50',   descKey:'achClassicLines50Desc' },
    { id:'classic_lines_100',  category:'mode', icon:'🏆', expReward:100, nameKey:'achClassicLines100',  descKey:'achClassicLines100Desc' },
    { id:'timed_score_50k',    category:'mode', icon:'🎯', expReward:100, nameKey:'achTimedScore50k',    descKey:'achTimedScore50kDesc' },
    { id:'timed_score_100k',   category:'mode', icon:'💠', expReward:200, nameKey:'achTimedScore100k',   descKey:'achTimedScore100kDesc' },
    { id:'countdown_60',       category:'mode', icon:'⏳', expReward:50,  nameKey:'achCountdown60',      descKey:'achCountdown60Desc' },
    { id:'countdown_120',      category:'mode', icon:'🕰️', expReward:100, nameKey:'achCountdown120',     descKey:'achCountdown120Desc' },
    { id:'timed_lines_first',  category:'mode', icon:'📊', expReward:100, nameKey:'achTimedLinesFirst',  descKey:'achTimedLinesFirstDesc' },
    { id:'invisible_5',        category:'mode', icon:'👻', expReward:50,  nameKey:'achInvisible5',       descKey:'achInvisible5Desc' },
    { id:'invisible_20',       category:'mode', icon:'🌫️', expReward:150, nameKey:'achInvisible20',      descKey:'achInvisible20Desc' },
    { id:'invisible2_5',       category:'mode', icon:'🔮', expReward:50,  nameKey:'achInvisible2_5',     descKey:'achInvisible2_5Desc' },
    { id:'invisible2_20',      category:'mode', icon:'🧠', expReward:150, nameKey:'achInvisible2_20',    descKey:'achInvisible2_20Desc' },
    { id:'survival_60',        category:'mode', icon:'💀', expReward:50,  nameKey:'achSurvival60',       descKey:'achSurvival60Desc' },
    { id:'survival_180',       category:'mode', icon:'🛡️', expReward:100, nameKey:'achSurvival180',      descKey:'achSurvival180Desc' },
    { id:'survival_300',       category:'mode', icon:'🏰', expReward:200, nameKey:'achSurvival300',      descKey:'achSurvival300Desc' },
    { id:'marathon_3',         category:'mode', icon:'🏃', expReward:100, nameKey:'achMarathon3',        descKey:'achMarathon3Desc' },
    { id:'marathon_5',         category:'mode', icon:'🏅', expReward:200, nameKey:'achMarathon5',        descKey:'achMarathon5Desc' },
    { id:'endless_50',         category:'mode', icon:'♾️', expReward:50,  nameKey:'achEndless50',        descKey:'achEndless50Desc' },
    { id:'endless_100',        category:'mode', icon:'🌌', expReward:100, nameKey:'achEndless100',       descKey:'achEndless100Desc' },
    { id:'endless_300',        category:'mode', icon:'🪐', expReward:200, nameKey:'achEndless300',       descKey:'achEndless300Desc' },
    { id:'endless_30min',      category:'mode', icon:'🕐', expReward:150, nameKey:'achEndless30min',     descKey:'achEndless30minDesc' },

    // ===== 隐藏 =====
    { id:'marathon_no_fail',   category:'milestone', icon:'🎖️', expReward:200, nameKey:'achMarathonNoFail', descKey:'achMarathonNoFailDesc' }
];

const ACH_CATEGORIES = ['milestone', 'cumulative', 'single', 'skill', 'mode'];

class AchievementManager {
    constructor() {
        this.unlocked = {};
        this.progress = {};
        this.queue = [];
        this.toastTimer = null;
        this.sessionUnlocks = [];
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('tetrisAchievements') || '{}');
            this.unlocked = saved.unlocked || {};
            this.progress = saved.progress || {};
        } catch (e) { this.unlocked = {}; this.progress = {}; }
    }
    save() {
        try {
            localStorage.setItem('tetrisAchievements', JSON.stringify({
                unlocked: this.unlocked, progress: this.progress
            }));
            return true;
        } catch (e) { return false; }
    }

    isUnlocked(id) { return !!this.unlocked[id]; }
    getUnlockedCount() { return Object.keys(this.unlocked).length; }
    getTotalCount() { return ACHIEVEMENTS.length; }

    addProgress(key, amount = 1) {
        this.progress[key] = (this.progress[key] || 0) + amount;
        this.save();
    }

    unlock(id) {
        if (this.isUnlocked(id)) return false;
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return false;
        this.unlocked[id] = { unlockedAt: Date.now() };
        this.sessionUnlocks.push(ach);
        this.save();
        this.queue.push(ach);
        this.flushQueue();
        if (ach.expReward && typeof levelManager !== 'undefined') {
            levelManager.addExp(ach.expReward);
        }
        return true;
    }

    getSessionUnlocks() { return this.sessionUnlocks.slice(); }
    clearSessionUnlocks() { this.sessionUnlocks = []; }

    // 消行时即时判定
    onLineClear(linesCleared, combo) {
        if (linesCleared === 1) this.unlock('first_line');
        if (linesCleared === 4) this.unlock('first_tetris');
    }

    // 硬降 / 旋转后即时判定（累计类）
    checkSimple() {
        const p = this.progress;
        if ((p.harddrop_count || 0) >= 100) this.unlock('harddrop_100');
        if ((p.harddrop_count || 0) >= 1000) this.unlock('harddrop_1000');
        if ((p.rotate_count || 0) >= 1000) this.unlock('rotate_1000');
    }

    // 局末结算
    onGameEnd(ctx) {
        // 累计
        this.addProgress('total_games', 1);
        this.addProgress('total_lines', ctx.lines || 0);

        // ===== 局末判定 =====
        const p = this.progress;
        const mode = ctx.mode;
        const challenge = ctx.challenge;
        const score = ctx.score || 0;
        const elapsed = ctx.elapsedTime || 0;
        const level = ctx.level || 1;

        // 里程碑
        if ((p.total_games || 0) >= 1) this.unlock('first_game');
        if ((p.total_games || 0) >= 10) this.unlock('games_10');
        if ((p.total_games || 0) >= 100) this.unlock('games_100');
        if (level >= 10) this.unlock('level_10');
        if (level >= 20) this.unlock('level_20');

        // 累计
        if ((p.total_lines || 0) >= 100) this.unlock('lines_100');
        if ((p.total_lines || 0) >= 1000) this.unlock('lines_1000');

        // 单局
        if (score >= 10000) this.unlock('score_10k');
        if (score >= 100000) this.unlock('score_100k');

        // 技巧
        if (ctx.classic && !ctx.pausedThisGame && (ctx.lines || 0) >= 30) {
            this.unlock('classic_no_pause_30');
        }

        // 模式 - 经典
        if (ctx.classic) {
            if ((ctx.lines || 0) >= 50) this.unlock('classic_lines_50');
            if ((ctx.lines || 0) >= 100) this.unlock('classic_lines_100');
        }

        // 模式 - 无尽
        if (ctx.endless) {
            if ((ctx.lines || 0) >= 50) this.unlock('endless_50');
            if ((ctx.lines || 0) >= 100) this.unlock('endless_100');
            if ((ctx.lines || 0) >= 300) this.unlock('endless_300');
            if (elapsed >= 1800) this.unlock('endless_30min');
        }

        // 模式 - 固定时间冲分
        if (challenge === 'timed_score') {
            if (score >= 50000) this.unlock('timed_score_50k');
            if (score >= 100000) this.unlock('timed_score_100k');
        }

        // 模式 - 倒计时生存
        if (challenge === 'countdown_survival') {
            if (elapsed >= 60) this.unlock('countdown_60');
            if (elapsed >= 120) this.unlock('countdown_120');
        }

        // 模式 - 限时消行（完成目标）
        if (challenge === 'timed_lines') {
            if ((ctx.timedLinesCleared || 0) >= (ctx.customTargetLines || 40)) {
                this.unlock('timed_lines_first');
            }
        }

        // 模式 - 隐形
        if (challenge === 'invisible') {
            if ((ctx.lines || 0) >= 5) this.unlock('invisible_5');
            if ((ctx.lines || 0) >= 20) this.unlock('invisible_20');
        }
        if (challenge === 'invisible2') {
            if ((ctx.lines || 0) >= 5) this.unlock('invisible2_5');
            if ((ctx.lines || 0) >= 20) this.unlock('invisible2_20');
        }

        // 模式 - 冲刺
        if (challenge === 'sprint' && (ctx.sprintCleared || 0) >= (ctx.sprintTarget || 40)) {
            if (elapsed <= 300) this.unlock('sprint_300');
            if (elapsed <= 240) this.unlock('sprint_240');
            if (elapsed <= 180) this.unlock('sprint_180');
            if (elapsed <= 150) this.unlock('sprint_150');
        }

        // 模式 - 生存
        if (challenge === 'survival') {
            if (elapsed >= 60) this.unlock('survival_60');
            if (elapsed >= 180) this.unlock('survival_180');
            if (elapsed >= 300) this.unlock('survival_300');
        }

        // 模式 - 马拉松
        if (challenge === 'marathon') {
            if ((ctx.marathonStage || 1) >= 3) this.unlock('marathon_3');
            if ((ctx.marathonStage || 1) >= 5) this.unlock('marathon_5');
        }
        if (challenge === 'marathon' && (ctx.marathonCheckSuccessCount || 0) >= 5) {
            this.unlock('marathon_no_fail');
        }
    }

    flushQueue() {
        if (this.toastTimer || this.queue.length === 0) return;
        const ach = this.queue.shift();
        const name = languageManager.getText(ach.nameKey);
        this.showToast(`🏆 ${languageManager.getText('achUnlockToast')}: ${ach.icon} ${name}`);
        this.toastTimer = setTimeout(() => {
            this.toastTimer = null;
            this.flushQueue();
        }, 3200);
    }
    showToast(msg) {
        const el = document.getElementById('achievementToast');
        if (!el) return;
        el.innerHTML = `<span>${msg}</span>`;
        el.style.display = 'flex';
        el.style.animation = 'none';
        setTimeout(() => {
            el.style.animation = 'slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
        }, 10);
        setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    reset() {
        this.unlocked = {};
        this.progress = {};
        this.sessionUnlocks = [];
        this.save();
    }
}

const achievementManager = new AchievementManager();