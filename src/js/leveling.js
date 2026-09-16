// ============================================================
// 等级系统
// ============================================================
const LEVEL_TITLES = [
    { minLevel: 1,   titleKey: 'titleNovice' },
    { minLevel: 5,   titleKey: 'titleApprentice' },
    { minLevel: 10,  titleKey: 'titleSkilled' },
    { minLevel: 15,  titleKey: 'titleExpert' },
    { minLevel: 20,  titleKey: 'titleMaster' },
    { minLevel: 30,  titleKey: 'titleGrandmaster' },
    { minLevel: 50,  titleKey: 'titleLegend' },
    { minLevel: 100, titleKey: 'titleTranscendent' }
];

const MAX_LEVEL = 100;

class LevelManager {
    constructor() {
        this.exp = 0;
    }

    load() {
        const saved = localStorage.getItem('tetrisAccount');
        if (saved) {
            try {
                const p = JSON.parse(saved);
                this.exp = p.exp || 0;
            } catch (e) { this.exp = 0; }
        }
    }

    save() {
        try {
            const saved = localStorage.getItem('tetrisAccount');
            const data = saved ? JSON.parse(saved) : {};
            data.exp = this.exp;
            localStorage.setItem('tetrisAccount', JSON.stringify(data));
            return true;
        } catch (e) { return false; }
    }

    // 根据累计经验计算等级（封顶 100）
    getLevel() {
        let level = 1;
        while (level < MAX_LEVEL && this.exp >= this.expForLevel(level + 1)) level++;
        return level;
    }

    // 升到 level 级所需累计经验（指数 1.2）
    expForLevel(level) {
        if (level <= 1) return 0;
        let total = 0;
        for (let i = 2; i <= level; i++) total += Math.floor(100 * Math.pow(i - 1, 1.2));
        return total;
    }

    // 当前等级内的经验进度
    getProgress() {
        const level = this.getLevel();
        if (level >= MAX_LEVEL) {
            return { level: MAX_LEVEL, current: 1, need: 1, pct: 100 };
        }
        const current = this.exp - this.expForLevel(level);
        const need = this.expForLevel(level + 1) - this.expForLevel(level);
        const pct = need > 0 ? Math.min(100, Math.round(current / need * 100)) : 0;
        return { level, current, need, pct };
    }

    getTitle() {
        const level = this.getLevel();
        let title = LEVEL_TITLES[0];
        for (const t of LEVEL_TITLES) if (level >= t.minLevel) title = t;
        return languageManager.getText(title.titleKey);
    }

    // 结算一局获得的经验
    calcGameExp({ score = 0, lines = 0, challenge = null } = {}) {
        let exp = 30;
        exp += lines * 8;
        exp += Math.floor(score / 30);
        if (challenge) exp = Math.floor(exp * 1.8);
        return exp;
    }

    // 加经验，返回 { gained, oldLevel, newLevel, leveledUp }
    addExp(amount) {
        if (amount <= 0) return { gained: 0, oldLevel: this.getLevel(), newLevel: this.getLevel(), leveledUp: false };
        if (this.getLevel() >= MAX_LEVEL) return { gained: 0, oldLevel: MAX_LEVEL, newLevel: MAX_LEVEL, leveledUp: false };
        const oldLevel = this.getLevel();
        this.exp += amount;
        if (this.exp > this.expForLevel(MAX_LEVEL)) this.exp = this.expForLevel(MAX_LEVEL);
        const newLevel = this.getLevel();
        this.save();
        return { gained: amount, oldLevel, newLevel, leveledUp: newLevel > oldLevel };
    }

    reset() {
        this.exp = 0;
        this.save();
    }
}

const levelManager = new LevelManager();