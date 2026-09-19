// ============================================================
// 商店系统
// - 独立金币货币 tetrisCoins
// - 消耗品从 items.js 引入，永久解锁 / 经验包在本文件定义
// - 存档集成（js/savedata.js 里加 key）
// - 购买前弹确认框
// ============================================================

const SHOP_STORAGE_KEY = 'tetrisShop';

// 消耗品来自 items.js（ITEM_DEFS），加上 category 字段
const SHOP_CONSUMABLES = (typeof ITEM_DEFS !== 'undefined' ? ITEM_DEFS : []).map(d => ({
    ...d,
    category: 'consumable'
}));

const SHOP_ITEMS = [
    // ===== 消耗品（来自 items.js） =====
    ...SHOP_CONSUMABLES,

    // ===== 永久解锁 =====
    {
        id: 'unlock_extra_preview',
        category: 'permanent',
        icon: '👁',
        nameKey: 'shopUnlockExtraPreview',
        descKey: 'shopUnlockExtraPreviewDesc',
        price: 800
    },

    // ===== 经验包 =====
    {
        id: 'exp_small',
        category: 'exp',
        icon: '📦',
        nameKey: 'shopExpSmall',
        descKey: 'shopExpSmallDesc',
        price: 500,
        exp: 500,
        repeatable: true
    },
    {
        id: 'exp_medium',
        category: 'exp',
        icon: '📦',
        nameKey: 'shopExpMedium',
        descKey: 'shopExpMediumDesc',
        price: 2000,
        exp: 2500,
        repeatable: true,
        badge: '1.25x'
    },
    {
        id: 'exp_large',
        category: 'exp',
        icon: '📦',
        nameKey: 'shopExpLarge',
        descKey: 'shopExpLargeDesc',
        price: 5000,
        exp: 7000,
        repeatable: true,
        badge: '1.4x'
    },
    {
        id: 'exp_xlarge',
        category: 'exp',
        icon: '📦',
        nameKey: 'shopExpXLarge',
        descKey: 'shopExpXLargeDesc',
        price: 10000,
        exp: 16000,
        repeatable: true,
        badge: '1.6x'
    }
];

class ShopManager {
    constructor() {
        this.coins = 500;
        this.owned = {};
        this.consumables = {};
        this.history = [];
        this._currentTab = 'consumable';
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(SHOP_STORAGE_KEY) || 'null');
            if (saved && typeof saved === 'object') {
                this.coins = typeof saved.coins === 'number' ? saved.coins : 500;
                this.owned = saved.owned || {};
                this.consumables = saved.consumables || {};
                this.history = Array.isArray(saved.history) ? saved.history : [];
            } else {
                this.coins = 500;
                this.save();
            }
        } catch (e) {
            this.coins = 500;
            this.owned = {};
            this.consumables = {};
            this.history = [];
        }
    }

    save() {
        try {
            localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({
                coins: this.coins,
                owned: this.owned,
                consumables: this.consumables,
                history: this.history
            }));
            return true;
        } catch (e) {
            console.warn('[shop] save failed:', e);
            return false;
        }
    }

    getItem(id) {
        return SHOP_ITEMS.find(i => i.id === id) || null;
    }

    isOwned(id) {
        return !!this.owned[id];
    }

    getCount(id) {
        return this.consumables[id] || 0;
    }

    canBuy(item) {
        if (!item) return { ok: false, reason: 'NOT_FOUND' };
        if (this.coins < item.price) return { ok: false, reason: 'NOT_ENOUGH_COINS' };
        if (item.category === 'permanent' && this.isOwned(item.id)) {
            return { ok: false, reason: 'ALREADY_OWNED' };
        }
        if (item.category === 'consumable' && item.maxStack) {
            if (this.getCount(item.id) >= item.maxStack) {
                return { ok: false, reason: 'MAX_STACK' };
            }
        }
        return { ok: true };
    }

    buy(id) {
        const item = this.getItem(id);
        const check = this.canBuy(item);
        if (!check.ok) return check;

        this.coins -= item.price;

        if (item.category === 'permanent') {
            this.owned[id] = { boughtAt: Date.now() };
        } else if (item.category === 'consumable') {
            this.consumables[id] = (this.consumables[id] || 0) + 1;
        } else if (item.category === 'exp') {
            const result = levelManager.addExp(item.exp);
            this.history.unshift({ itemId: id, price: item.price, boughtAt: Date.now(), exp: item.exp });
            if (this.history.length > 50) this.history = this.history.slice(0, 50);
            this.save();
            if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
            return { ok: true, exp: item.exp, levelResult: result };
        }

        this.history.unshift({ itemId: id, price: item.price, boughtAt: Date.now() });
        if (this.history.length > 50) this.history = this.history.slice(0, 50);
        this.save();
        return { ok: true };
    }

    useConsumable(id) {
        if (this.getCount(id) <= 0) return false;
        this.consumables[id] -= 1;
        if (this.consumables[id] <= 0) delete this.consumables[id];
        this.save();
        return true;
    }

    addCoins(amount) {
        if (amount <= 0) return;
        this.coins += Math.floor(amount);
        this.save();
    }

    addCoinsFromGame(score) {
        const gain = Math.floor(score / 50);
        if (gain > 0) this.addCoins(gain);
        return gain;
    }

    hasAffordable() {
        return SHOP_ITEMS.some(item => this.canBuy(item).ok);
    }
}

const shopManager = new ShopManager();

// ============================================================
// UI 渲染
// ============================================================
function renderShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;
    const tabsEl = document.getElementById('shopTabs');
    const listEl = document.getElementById('shopList');
    const coinsEl = document.getElementById('shopCoinsValue');
    if (!tabsEl || !listEl) return;

    if (coinsEl) coinsEl.textContent = shopManager.coins.toLocaleString();

    const tabs = [
        { id: 'consumable', key: 'shopTabConsumable' },
        { id: 'permanent',  key: 'shopTabPermanent' },
        { id: 'exp',        key: 'shopTabExp' }
    ];
    tabsEl.innerHTML = tabs.map(t => {
        const active = t.id === shopManager._currentTab ? ' active' : '';
        return `<button class="leaderboard-tab${active}" data-shop-tab="${t.id}">${languageManager.getText(t.key)}</button>`;
    }).join('');
    tabsEl.querySelectorAll('.leaderboard-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            shopManager._currentTab = btn.getAttribute('data-shop-tab');
            renderShop();
            audioSystem.playSound('click');
        });
    });

    const items = SHOP_ITEMS.filter(i => i.category === shopManager._currentTab);
    if (items.length === 0) {
        listEl.innerHTML = `<div class="shop-empty">${languageManager.getText('shopEmpty')}</div>`;
        return;
    }
    listEl.innerHTML = items.map(item => {
        const owned = item.category === 'permanent' && shopManager.isOwned(item.id);
        const count = item.category === 'consumable' ? shopManager.getCount(item.id) : 0;
        const maxReached = item.category === 'consumable' && item.maxStack && count >= item.maxStack;
        const canBuy = shopManager.canBuy(item);
        const name = languageManager.getText(item.nameKey);
        const desc = languageManager.getText(item.descKey);

        let actionHtml = '';
        if (owned) {
            actionHtml = `<div class="shop-item-owned">✓ ${languageManager.getText('shopOwned')}</div>`;
        } else if (maxReached) {
            actionHtml = `<button class="shop-item-buy" disabled>${languageManager.getText('shopMax')}</button>`;
        } else if (!canBuy.ok && canBuy.reason === 'NOT_ENOUGH_COINS') {
            actionHtml = `<button class="shop-item-buy" disabled>${languageManager.getText('shopBuy')}</button>`;
        } else {
            actionHtml = `<button class="shop-item-buy" data-buy-id="${item.id}">${languageManager.getText('shopBuy')}</button>`;
        }

        const badge = item.badge ? `<span class="shop-item-badge">${item.badge}</span>` : '';
        const countHtml = item.category === 'consumable' && count > 0
            ? `<div class="shop-item-count">${languageManager.getText('shopOwnedCount')}: ${count}${item.maxStack ? ' / ' + item.maxStack : ''}</div>`
            : '';

        return `<div class="shop-item${owned ? ' owned' : ''}">
<div class="shop-item-icon">${item.icon}</div>
<div class="shop-item-info">
<div class="shop-item-name">${name}${badge}</div>
<div class="shop-item-desc">${desc}</div>
${countHtml}
</div>
<div class="shop-item-right">
<div class="shop-item-price">${item.price.toLocaleString()} <span class="shop-coin-icon">💰</span></div>
${actionHtml}
</div>
</div>`;
    }).join('');

    listEl.querySelectorAll('.shop-item-buy').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-buy-id');
            if (typeof showShopPurchaseConfirm === 'function') {
                showShopPurchaseConfirm(id);
            } else {
                handleBuy(id);
            }
        });
    });
}

// ============================================================
// 购买执行
// ============================================================
function handleBuy(id) {
    const item = shopManager.getItem(id);
    if (!item) return;
    const result = shopManager.buy(id);

    if (!result.ok) {
        let msg = '';
        if (result.reason === 'NOT_ENOUGH_COINS') msg = languageManager.getText('shopNotEnoughCoins');
        else if (result.reason === 'ALREADY_OWNED') msg = languageManager.getText('shopAlreadyOwned');
        else if (result.reason === 'MAX_STACK') msg = languageManager.getText('shopMaxStack');
        else msg = languageManager.getText('shopBuyFailed');
        showSaveNotification('❌ ' + msg, true);
        audioSystem.playSound('gameover');
        return;
    }

    if (item.category === 'exp') {
        const expStr = (result.exp || item.exp).toLocaleString();
        showSaveNotification(`✅ +${expStr} EXP`);
        audioSystem.playSound('targetIncrease');
    } else {
        showSaveNotification(`✅ ${languageManager.getText('shopBuySuccess')}`);
        audioSystem.playSound('start');
    }

    renderShop();
    updateShopBadge();
    if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
}

// ============================================================
// 小红点
// ============================================================
function updateShopBadge() {
    const btn = document.getElementById('shopBtnCorner');
    if (!btn) return;
    if (shopManager.hasAffordable()) {
        btn.classList.add('has-affordable');
    } else {
        btn.classList.remove('has-affordable');
    }
}

// ============================================================
// 打开商店
// ============================================================
function openShop() {
    showPanel(document.getElementById('shopPanel'));
    renderShop();
    audioSystem.playSound('click');
}

// ============================================================
// 初始化
// ============================================================
function initShop() {
    shopManager.load();
    const btn = document.getElementById('shopBtnCorner');
    if (btn) btn.addEventListener('click', openShop);
    const closeBtn = document.querySelector('.close-shop');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        hidePanel(document.getElementById('shopPanel'));
        audioSystem.playSound('click');
    });
    updateShopBadge();
}