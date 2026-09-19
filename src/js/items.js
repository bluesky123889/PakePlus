// ============================================================
// 道具系统
// - 道具定义（ITEM_DEFS）
// - 道具管理器（itemsManager）
// - 使用时机钩子（itemsHook_*）—— 后续再抽
// 依赖：shop.js（shopManager）
// ============================================================

// ============================================================
// 道具使用时机
// ============================================================
const ITEM_USAGE = {
    GAME_END: 'game_end',              // 游戏结束结算时（双倍卡）
    ON_DEATH: 'on_death',              // 撞顶/失败时（复活币、护盾）
    IN_GAME_ACTIVE: 'in_game_active',  // 游戏中主动按快捷键（时间冻结、炸弹）
    IN_BAG: 'in_bag'                   // 在背包里直接使用（经验加成类）
};

// ============================================================
// 道具定义
// 只有消耗品在这里定义；永久解锁和经验包在 shop.js 里
// ============================================================
const ITEM_DEFS = [
    {
        id: 'double_exp',
        icon: '🎫',
        nameKey: 'shopDoubleExp',
        descKey: 'shopDoubleExpDesc',
        price: 300,
        maxStack: 5,
        usage: ITEM_USAGE.GAME_END,
        usableInBag: false
    },
    {
        id: 'double_coins',
        icon: '🎰',
        nameKey: 'shopDoubleCoins',
        descKey: 'shopDoubleCoinsDesc',
        price: 400,
        maxStack: 5,
        usage: ITEM_USAGE.GAME_END,
        usableInBag: false
    },
    {
        id: 'revive',
        icon: '❤️',
        nameKey: 'shopRevive',
        descKey: 'shopReviveDesc',
        price: 500,
        maxStack: 3,
        usage: ITEM_USAGE.ON_DEATH,
        usableInBag: false
    }
];

// ============================================================
// 道具管理器
// ============================================================
class ItemsManager {
    constructor() {
        this.defs = ITEM_DEFS;
        this.defMap = new Map(ITEM_DEFS.map(d => [d.id, d]));
    }

    getDef(id) {
        return this.defMap.get(id) || null;
    }

    getCount(id) {
        if (typeof shopManager === 'undefined') return 0;
        return shopManager.getCount(id);
    }

    has(id) {
        return this.getCount(id) > 0;
    }

    use(id) {
        if (typeof shopManager === 'undefined') return false;
        return shopManager.useConsumable(id);
    }

    // 是否能在背包直接使用（保留字段，暂无 UI）
    canUseInBag(id) {
        const def = this.getDef(id);
        return !!(def && def.usableInBag === true);
    }

    // 背包列表（暂无 UI，保留给其他模块备用）
    getBagItems() {
        return this.defs
            .filter(d => this.has(d.id))
            .map(d => ({ ...d, count: this.getCount(d.id) }));
    }

    // 获取指定使用时机的所有道具（按定义顺序）
    getByUsage(usage) {
        return this.defs.filter(d => d.usage === usage);
    }
}

const itemsManager = new ItemsManager();