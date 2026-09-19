// ============================================================
// 成就系统
// ============================================================
const ACHIEVEMENTS = [
    // ============================================================
    // 里程碑 (milestone)
    // ============================================================
    { id:'first_game',   category:'milestone',  icon:'🎮', expReward:20,  nameKey:'achFirstGame',   descKey:'achFirstGameDesc' },
    { id:'first_line',   category:'milestone',  icon:'✨', expReward:20,  nameKey:'achFirstLine',   descKey:'achFirstLineDesc' },
    { id:'first_tetris', category:'milestone',  icon:'🎯', expReward:50,  nameKey:'achFirstTetris', descKey:'achFirstTetrisDesc' },
    { id:'games_10',     category:'milestone',  icon:'🎮', expReward:30,  nameKey:'achGames10',     descKey:'achGames10Desc' },
    { id:'games_100',    category:'milestone',  icon:'🕹️', expReward:100, nameKey:'achGames100',    descKey:'achGames100Desc' },
    { id:'level_10',     category:'milestone',  icon:'📈', expReward:100, nameKey:'achLevel10',     descKey:'achLevel10Desc' },
    { id:'level_20',     category:'milestone',  icon:'🚀', expReward:200, nameKey:'achLevel20',     descKey:'achLevel20Desc' },
    { id:'marathon_no_fail', category:'milestone', icon:'🎖️', expReward:200, nameKey:'achMarathonNoFail', descKey:'achMarathonNoFailDesc' },
    // ===== 新增：等级 / 时长 / 局数 =====
    { id:'level_30',     category:'milestone',  icon:'🌟', expReward:300, nameKey:'achLevel30',     descKey:'achLevel30Desc' },
    { id:'level_50',     category:'milestone',  icon:'👑', expReward:600, nameKey:'achLevel50',     descKey:'achLevel50Desc' },
    { id:'level_100',    category:'milestone',  icon:'🌠', expReward:1000,nameKey:'achLevel100',    descKey:'achLevel100Desc' },
    { id:'survive_10min',category:'milestone',  icon:'⏱️', expReward:80,  nameKey:'achSurvive10min',descKey:'achSurvive10minDesc' },
    { id:'survive_30min',category:'milestone',  icon:'🕐', expReward:200, nameKey:'achSurvive30min',descKey:'achSurvive30minDesc' },
    { id:'survive_60min',category:'milestone',  icon:'🕰️', expReward:400, nameKey:'achSurvive60min',descKey:'achSurvive60minDesc' },
    { id:'games_500',    category:'milestone',  icon:'🎰', expReward:300, nameKey:'achGames500',    descKey:'achGames500Desc' },
    { id:'games_1000',   category:'milestone',  icon:'🎲', expReward:600, nameKey:'achGames1000',   descKey:'achGames1000Desc' },
    // ===== 新增：每日任务 =====
    { id:'daily_first',  category:'milestone',  icon:'📅', expReward:50,  nameKey:'achDailyFirst',  descKey:'achDailyFirstDesc' },
    { id:'daily_all_1',  category:'milestone',  icon:'🎁', expReward:100, nameKey:'achDailyAll1',   descKey:'achDailyAll1Desc' },
    { id:'daily_all_7',  category:'milestone',  icon:'🗓️', expReward:300, nameKey:'achDailyAll7',   descKey:'achDailyAll7Desc' },
    { id:'daily_all_30', category:'milestone',  icon:'📆', expReward:800, nameKey:'achDailyAll30',  descKey:'achDailyAll30Desc' },
    // ===== 新增：隐藏 =====
    { id:'hidden_night_owl',       category:'milestone', icon:'🦉', expReward:100, nameKey:'achHiddenNightOwl',      descKey:'achHiddenNightOwlDesc' },
    { id:'hidden_marathon_fail_1', category:'milestone', icon:'💔', expReward:50,  nameKey:'achHiddenMarathonFail1', descKey:'achHiddenMarathonFail1Desc' },
    { id:'hidden_score_0',         category:'milestone', icon:'🕳️', expReward:30,  nameKey:'achHiddenScore0',        descKey:'achHiddenScore0Desc' },
    { id:'hidden_lucky_777',       category:'milestone', icon:'🎰', expReward:80,  nameKey:'achHiddenLucky777',      descKey:'achHiddenLucky777Desc' },

    // ============================================================
    // 累计 (cumulative)
    // ============================================================
    { id:'lines_100',    category:'cumulative', icon:'📏', expReward:50,  nameKey:'achLines100',    descKey:'achLines100Desc' },
    { id:'lines_1000',   category:'cumulative', icon:'📐', expReward:200, nameKey:'achLines1000',   descKey:'achLines1000Desc' },
    { id:'harddrop_100', category:'cumulative', icon:'⬇️', expReward:50,  nameKey:'achHarddrop100', descKey:'achHarddrop100Desc' },
    { id:'harddrop_1000',category:'cumulative', icon:'⏬', expReward:200, nameKey:'achHarddrop1000',descKey:'achHarddrop1000Desc' },
    { id:'rotate_1000',  category:'cumulative', icon:'🔃', expReward:100, nameKey:'achRotate1000',  descKey:'achRotate1000Desc' },
    // ===== 新增：消行 / 硬降 / 旋转 =====
    { id:'lines_5000',   category:'cumulative', icon:'📏', expReward:300, nameKey:'achLines5000',   descKey:'achLines5000Desc' },
    { id:'lines_10000',  category:'cumulative', icon:'📐', expReward:500, nameKey:'achLines10000',  descKey:'achLines10000Desc' },
    { id:'lines_50000',  category:'cumulative', icon:'🧮', expReward:1000,nameKey:'achLines50000',  descKey:'achLines50000Desc' },
    { id:'harddrop_5000',category:'cumulative', icon:'⬇️', expReward:400, nameKey:'achHarddrop5000',descKey:'achHarddrop5000Desc' },
    { id:'harddrop_10000',category:'cumulative',icon:'🚀', expReward:700, nameKey:'achHarddrop10000',descKey:'achHarddrop10000Desc' },
    { id:'rotate_5000',  category:'cumulative', icon:'🔃', expReward:300, nameKey:'achRotate5000',  descKey:'achRotate5000Desc' },
    { id:'rotate_10000', category:'cumulative', icon:'🔄', expReward:600, nameKey:'achRotate10000', descKey:'achRotate10000Desc' },
    // ===== 新增：四消累计 =====
    { id:'tetris_10',    category:'cumulative', icon:'🎯', expReward:100, nameKey:'achTetris10',    descKey:'achTetris10Desc' },
    { id:'tetris_50',    category:'cumulative', icon:'🎖️', expReward:250, nameKey:'achTetris50',    descKey:'achTetris50Desc' },
    { id:'tetris_100',   category:'cumulative', icon:'🏆', expReward:500, nameKey:'achTetris100',   descKey:'achTetris100Desc' },
    // ===== 新增：累计时长 =====
    { id:'playtime_1h',  category:'cumulative', icon:'⏳', expReward:60,  nameKey:'achPlaytime1h',  descKey:'achPlaytime1hDesc' },
    { id:'playtime_10h', category:'cumulative', icon:'⌛', expReward:200, nameKey:'achPlaytime10h', descKey:'achPlaytime10hDesc' },
    { id:'playtime_50h', category:'cumulative', icon:'📿', expReward:500, nameKey:'achPlaytime50h', descKey:'achPlaytime50hDesc' },
    { id:'playtime_100h',category:'cumulative', icon:'🏵️', expReward:1000,nameKey:'achPlaytime100h',descKey:'achPlaytime100hDesc' },
    // ===== 新增：经验累计 =====
    { id:'exp_100k',     category:'cumulative', icon:'📖', expReward:200, nameKey:'achExp100k',     descKey:'achExp100kDesc' },
    { id:'exp_500k',     category:'cumulative', icon:'📚', expReward:400, nameKey:'achExp500k',     descKey:'achExp500kDesc' },
    { id:'exp_1m',       category:'cumulative', icon:'🎓', expReward:800, nameKey:'achExp1m',       descKey:'achExp1mDesc' },

    // ============================================================
    // 单局 (single)
    // ============================================================
    { id:'score_10k',    category:'single',     icon:'💯', expReward:50,  nameKey:'achScore10k',    descKey:'achScore10kDesc' },
    { id:'score_100k',   category:'single',     icon:'💎', expReward:200, nameKey:'achScore100k',   descKey:'achScore100kDesc' },
    // ===== 新增：单局消行 =====
    { id:'single_lines_20',  category:'single', icon:'🧱', expReward:80,  nameKey:'achSingleLines20',  descKey:'achSingleLines20Desc' },
    { id:'single_lines_50',  category:'single', icon:'🏗️', expReward:200, nameKey:'achSingleLines50',  descKey:'achSingleLines50Desc' },
    { id:'single_lines_100', category:'single', icon:'🏛️', expReward:400, nameKey:'achSingleLines100', descKey:'achSingleLines100Desc' },
    { id:'single_lines_200', category:'single', icon:'🌉', expReward:800, nameKey:'achSingleLines200', descKey:'achSingleLines200Desc' },

    // ============================================================
    // 技巧 (skill)
    // ============================================================
    { id:'classic_no_pause_30', category:'skill', icon:'🧘', expReward:100, nameKey:'achClassicNoPause30', descKey:'achClassicNoPause30Desc' },
    { id:'sprint_300',   category:'skill',      icon:'🏃', expReward:50,  nameKey:'achSprint300',   descKey:'achSprint300Desc' },
    { id:'sprint_240',   category:'skill',      icon:'⚡', expReward:100, nameKey:'achSprint240',   descKey:'achSprint240Desc' },
    { id:'sprint_180',   category:'skill',      icon:'💨', expReward:150, nameKey:'achSprint180',   descKey:'achSprint180Desc' },
    { id:'sprint_150',   category:'skill',      icon:'💥', expReward:200, nameKey:'achSprint150',   descKey:'achSprint150Desc' },
    // ===== 新增：冲刺 =====
    { id:'sprint_120',   category:'skill',      icon:'💨', expReward:300, nameKey:'achSprint120',   descKey:'achSprint120Desc' },
    { id:'sprint_100',   category:'skill',      icon:'⚡', expReward:400, nameKey:'achSprint100',   descKey:'achSprint100Desc' },
    { id:'sprint_90',    category:'skill',      icon:'💥', expReward:600, nameKey:'achSprint90',    descKey:'achSprint90Desc' },
    // ===== 新增：经典不暂停进阶 =====
    { id:'classic_no_pause_60', category:'skill', icon:'🧘', expReward:250, nameKey:'achClassicNoPause60', descKey:'achClassicNoPause60Desc' },
    // ===== 新增：速通特殊 =====
    { id:'speed_no_timeout', category:'skill',  icon:'⏱️', expReward:300, nameKey:'achSpeedNoTimeout', descKey:'achSpeedNoTimeoutDesc' },
    { id:'all_modes_played', category:'skill',  icon:'🎮', expReward:500, nameKey:'achAllModesPlayed', descKey:'achAllModesPlayedDesc' },

    // ============================================================
    // 模式 (mode)
    // ============================================================
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
    // ===== 新增：经典模式 =====
    { id:'classic_speed_max',  category:'mode', icon:'🚀', expReward:200, nameKey:'achClassicSpeedMax',  descKey:'achClassicSpeedMaxDesc' },
    { id:'classic_games_100',  category:'mode', icon:'🎮', expReward:300, nameKey:'achClassicGames100',  descKey:'achClassicGames100Desc' },
    { id:'classic_score_50k',  category:'mode', icon:'💯', expReward:150, nameKey:'achClassicScore50k',  descKey:'achClassicScore50kDesc' },
    { id:'classic_score_100k', category:'mode', icon:'💎', expReward:300, nameKey:'achClassicScore100k', descKey:'achClassicScore100kDesc' },
    // ===== 新增：无尽模式 =====
    { id:'endless_500',        category:'mode', icon:'🌌', expReward:300, nameKey:'achEndless500',       descKey:'achEndless500Desc' },
    { id:'endless_1000',       category:'mode', icon:'🪐', expReward:500, nameKey:'achEndless1000',      descKey:'achEndless1000Desc' },
    { id:'endless_score_200k', category:'mode', icon:'💫', expReward:300, nameKey:'achEndlessScore200k', descKey:'achEndlessScore200kDesc' },
    { id:'endless_1h',         category:'mode', icon:'🕐', expReward:400, nameKey:'achEndless1h',        descKey:'achEndless1hDesc' },
    // ===== 新增：生存 / 马拉松 =====
    { id:'survival_600',       category:'mode', icon:'🏰', expReward:300, nameKey:'achSurvival600',      descKey:'achSurvival600Desc' },
    { id:'survival_900',       category:'mode', icon:'🛡️', expReward:500, nameKey:'achSurvival900',      descKey:'achSurvival900Desc' },
    { id:'marathon_8',         category:'mode', icon:'🏃', expReward:300, nameKey:'achMarathon8',        descKey:'achMarathon8Desc' },
    { id:'marathon_10',        category:'mode', icon:'🏅', expReward:500, nameKey:'achMarathon10',       descKey:'achMarathon10Desc' },
    { id:'marathon_15',        category:'mode', icon:'🎖️', expReward:800, nameKey:'achMarathon15',       descKey:'achMarathon15Desc' },
    // ===== 新增：限时 / 隐形 =====
    { id:'timed_score_200k',   category:'mode', icon:'🎯', expReward:400, nameKey:'achTimedScore200k',   descKey:'achTimedScore200kDesc' },
    { id:'countdown_180',      category:'mode', icon:'🕰️', expReward:200, nameKey:'achCountdown180',     descKey:'achCountdown180Desc' },
    { id:'invisible_50',       category:'mode', icon:'👻', expReward:300, nameKey:'achInvisible50',      descKey:'achInvisible50Desc' },
    { id:'invisible2_50',      category:'mode', icon:'🔮', expReward:300, nameKey:'achInvisible2_50',    descKey:'achInvisible2_50Desc' }
];

const ACH_CATEGORIES = ['milestone', 'cumulative', 'single', 'skill', 'mode'];

class AchievementManager {
    constructor() {
    this.unlocked = {};
    this.progress = {};
    this.queue = [];
    this.toastTimer = null;
    this.sessionUnlocks = [];
    this._playedModes = null;
    this._toastTimer1 = null;
    this._toastTimer2 = null;
}

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('tetrisAchievements') || '{}');
            this.unlocked = saved.unlocked || {};
            this.progress = saved.progress || {};
            this._playedModes = saved.playedModes || null;
        } catch (e) { this.unlocked = {}; this.progress = {}; this._playedModes = null; }
    }
    save() {
        try {
            localStorage.setItem('tetrisAchievements', JSON.stringify({
                unlocked: this.unlocked,
                progress: this.progress,
                playedModes: this._playedModes
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
        if (linesCleared >= 1) this.unlock('first_line');
        if (linesCleared === 4) {
            this.unlock('first_tetris');
            this.addProgress('tetris_count', 1);
            const tc = this.progress.tetris_count || 0;
            if (tc >= 10)  this.unlock('tetris_10');
            if (tc >= 50)  this.unlock('tetris_50');
            if (tc >= 100) this.unlock('tetris_100');
        }
    }

    // 硬降 / 旋转后即时判定（累计类）
    checkSimple() {
        const p = this.progress;
        if ((p.harddrop_count || 0) >= 100)   this.unlock('harddrop_100');
        if ((p.harddrop_count || 0) >= 1000)  this.unlock('harddrop_1000');
        if ((p.harddrop_count || 0) >= 5000)  this.unlock('harddrop_5000');
        if ((p.harddrop_count || 0) >= 10000) this.unlock('harddrop_10000');
        if ((p.rotate_count || 0) >= 1000)    this.unlock('rotate_1000');
        if ((p.rotate_count || 0) >= 5000)    this.unlock('rotate_5000');
        if ((p.rotate_count || 0) >= 10000)   this.unlock('rotate_10000');
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

        // ---------- 里程碑 ----------
        if ((p.total_games || 0) >= 1)    this.unlock('first_game');
        if ((p.total_games || 0) >= 10)   this.unlock('games_10');
        if ((p.total_games || 0) >= 100)  this.unlock('games_100');
        if ((p.total_games || 0) >= 500)  this.unlock('games_500');
        if ((p.total_games || 0) >= 1000) this.unlock('games_1000');
        if (level >= 10)  this.unlock('level_10');
        if (level >= 20)  this.unlock('level_20');
        if (level >= 30)  this.unlock('level_30');
        if (level >= 50)  this.unlock('level_50');
        if (level >= 100) this.unlock('level_100');

        // 单局时长（仅统计有效局）
        if (elapsed >= 600)  this.unlock('survive_10min');
        if (elapsed >= 1800) this.unlock('survive_30min');
        if (elapsed >= 3600) this.unlock('survive_60min');

        // ---------- 累计 ----------
        if ((p.total_lines || 0) >= 100)   this.unlock('lines_100');
        if ((p.total_lines || 0) >= 1000)  this.unlock('lines_1000');
        if ((p.total_lines || 0) >= 5000)  this.unlock('lines_5000');
        if ((p.total_lines || 0) >= 10000) this.unlock('lines_10000');
        if ((p.total_lines || 0) >= 50000) this.unlock('lines_50000');

        // 累计时长（从 statsData 读，所有模式都生效）
        const totalPlaytime = (typeof statsData !== 'undefined' && statsData.totalPlaytime) || 0;
        if (totalPlaytime >= 3600)    this.unlock('playtime_1h');
        if (totalPlaytime >= 36000)   this.unlock('playtime_10h');
        if (totalPlaytime >= 180000)  this.unlock('playtime_50h');
        if (totalPlaytime >= 360000)  this.unlock('playtime_100h');

        // 累计经验（从 levelManager 读）
        const totalExp = (typeof levelManager !== 'undefined' && levelManager.exp) || 0;
        if (totalExp >= 100000)  this.unlock('exp_100k');
        if (totalExp >= 500000)  this.unlock('exp_500k');
        if (totalExp >= 1000000) this.unlock('exp_1m');

        // ---------- 单局 ----------
        if (score >= 10000)  this.unlock('score_10k');
        if (score >= 100000) this.unlock('score_100k');

        // 单局消行
        if ((ctx.lines || 0) >= 20)  this.unlock('single_lines_20');
        if ((ctx.lines || 0) >= 50)  this.unlock('single_lines_50');
        if ((ctx.lines || 0) >= 100) this.unlock('single_lines_100');
        if ((ctx.lines || 0) >= 200) this.unlock('single_lines_200');

        // ---------- 技巧 ----------
        if (ctx.classic && !ctx.pausedThisGame && (ctx.lines || 0) >= 30) {
            this.unlock('classic_no_pause_30');
        }
        if (ctx.classic && !ctx.pausedThisGame && (ctx.lines || 0) >= 60) {
            this.unlock('classic_no_pause_60');
        }
        if (challenge === 'speed' && (ctx.speedTimeouts || 0) === 0 && ctx.score > 0) {
            this.unlock('speed_no_timeout');
        }

        // 全能玩家：记录玩过的挑战模式
        if (challenge) {
            if (!this._playedModes) this._playedModes = {};
            this._playedModes[challenge] = true;
            const totalChallenges = 10; // timed, invisible, invisible2, sprint, survival, marathon, timed_score, countdown_survival, timed_lines, speed
            if (Object.keys(this._playedModes).length >= totalChallenges) {
                this.unlock('all_modes_played');
            }
            this.save();
        }

        // ---------- 模式：经典 ----------
        if (ctx.classic) {
            this.addProgress('classic_games', 1);
            if ((this.progress.classic_games || 0) >= 100) this.unlock('classic_games_100');
            if ((ctx.lines || 0) >= 50)  this.unlock('classic_lines_50');
            if ((ctx.lines || 0) >= 100) this.unlock('classic_lines_100');
            if (score >= 50000)  this.unlock('classic_score_50k');
            if (score >= 100000) this.unlock('classic_score_100k');
            // 最高下落速度：游戏内 level >= 10
            const gameLevel = ctx.gameLevel || 1;
            if (gameLevel >= 10) this.unlock('classic_speed_max');
        }

        // ---------- 模式：无尽 ----------
        if (ctx.endless) {
            if ((ctx.lines || 0) >= 50)   this.unlock('endless_50');
            if ((ctx.lines || 0) >= 100)  this.unlock('endless_100');
            if ((ctx.lines || 0) >= 300)  this.unlock('endless_300');
            if ((ctx.lines || 0) >= 500)  this.unlock('endless_500');
            if ((ctx.lines || 0) >= 1000) this.unlock('endless_1000');
            if (elapsed >= 1800) this.unlock('endless_30min');
            if (elapsed >= 3600) this.unlock('endless_1h');
            if (score >= 200000) this.unlock('endless_score_200k');
        }

        // ---------- 模式：固定时间冲分 ----------
        if (challenge === 'timed_score') {
            if (score >= 50000)  this.unlock('timed_score_50k');
            if (score >= 100000) this.unlock('timed_score_100k');
            if (score >= 200000) this.unlock('timed_score_200k');
        }

        // ---------- 模式：倒计时生存 ----------
        if (challenge === 'countdown_survival') {
            if (elapsed >= 60)  this.unlock('countdown_60');
            if (elapsed >= 120) this.unlock('countdown_120');
            if (elapsed >= 180) this.unlock('countdown_180');
        }

        // ---------- 模式：限时消行（完成目标） ----------
        if (challenge === 'timed_lines') {
            if ((ctx.timedLinesCleared || 0) >= (ctx.customTargetLines || 40)) {
                this.unlock('timed_lines_first');
            }
        }

        // ---------- 模式：隐形 ----------
        if (challenge === 'invisible') {
            if ((ctx.lines || 0) >= 5)  this.unlock('invisible_5');
            if ((ctx.lines || 0) >= 20) this.unlock('invisible_20');
            if ((ctx.lines || 0) >= 50) this.unlock('invisible_50');
        }
        if (challenge === 'invisible2') {
            if ((ctx.lines || 0) >= 5)  this.unlock('invisible2_5');
            if ((ctx.lines || 0) >= 20) this.unlock('invisible2_20');
            if ((ctx.lines || 0) >= 50) this.unlock('invisible2_50');
        }

        // ---------- 模式：冲刺 ----------
        if (challenge === 'sprint' && (ctx.sprintCleared || 0) >= (ctx.sprintTarget || 40)) {
            if (elapsed <= 300) this.unlock('sprint_300');
            if (elapsed <= 240) this.unlock('sprint_240');
            if (elapsed <= 180) this.unlock('sprint_180');
            if (elapsed <= 150) this.unlock('sprint_150');
            if (elapsed <= 120) this.unlock('sprint_120');
            if (elapsed <= 100) this.unlock('sprint_100');
            if (elapsed <= 90)  this.unlock('sprint_90');
        }

        // ---------- 模式：生存 ----------
        if (challenge === 'survival') {
            if (elapsed >= 60)  this.unlock('survival_60');
            if (elapsed >= 180) this.unlock('survival_180');
            if (elapsed >= 300) this.unlock('survival_300');
            if (elapsed >= 600) this.unlock('survival_600');
            if (elapsed >= 900) this.unlock('survival_900');
        }

        // ---------- 模式：马拉松 ----------
        if (challenge === 'marathon') {
            if ((ctx.marathonStage || 1) >= 3)  this.unlock('marathon_3');
            if ((ctx.marathonStage || 1) >= 5)  this.unlock('marathon_5');
            if ((ctx.marathonStage || 1) >= 8)  this.unlock('marathon_8');
            if ((ctx.marathonStage || 1) >= 10) this.unlock('marathon_10');
            if ((ctx.marathonStage || 1) >= 15) this.unlock('marathon_15');
            if ((ctx.marathonCheckSuccessCount || 0) >= 5) {
                this.unlock('marathon_no_fail');
            }
            // 出师未捷：第 1 阶段就失败
            if ((ctx.marathonStage || 1) === 1 && ctx.marathonCheckFailed) {
                this.unlock('hidden_marathon_fail_1');
            }
        }

        // ---------- 隐藏 ----------
        const h = new Date().getHours();
        if (h >= 2 && h < 5) this.unlock('hidden_night_owl');
        if (score === 0 && (ctx.lines || 0) === 0 && elapsed > 0) {
            this.unlock('hidden_score_0');
        }
        if (String(score).includes('777')) this.unlock('hidden_lucky_777');
    }

    // 每日任务回调
    onDailyClaim() {
        this.unlock('daily_first');
    }
    onDailyAllClaim(allCount) {
        this.unlock('daily_all_1');
        this.addProgress('daily_all_days', 1);
        const d = this.progress.daily_all_days || 0;
        if (d >= 7)  this.unlock('daily_all_7');
        if (d >= 30) this.unlock('daily_all_30');
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
    if (this._toastTimer1) { clearTimeout(this._toastTimer1); this._toastTimer1 = null; }
    if (this._toastTimer2) { clearTimeout(this._toastTimer2); this._toastTimer2 = null; }
    el.style.animation = 'none';
    el.style.display = 'none';
    void el.offsetWidth;
    el.innerHTML = `<span>${msg}</span>`;
    el.style.display = 'flex';
    this._toastTimer1 = setTimeout(() => {
        el.style.animation = 'slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
        this._toastTimer1 = null;
    }, 16);
    this._toastTimer2 = setTimeout(() => {
        el.style.display = 'none';
        el.style.animation = 'none';
        this._toastTimer2 = null;
    }, 3000);
}

    reset() {
        this.unlocked = {};
        this.progress = {};
        this.sessionUnlocks = [];
        this._playedModes = null;
        this.save();
    }
}

const achievementManager = new AchievementManager();