// ============================================================
// 存档导出 / 导入 / 清空（仅游戏数据，不含音乐）
// ============================================================
const SAVE_VERSION = 1;
const SAVE_LOCALSTORAGE_KEYS = {
    settings: 'tetrisSettings',
    language: 'tetrisLanguage',
    account: 'tetrisAccount',
    stats: 'tetrisStats',
    leaderboard: 'tetrisLeaderboard',
    achievements: 'tetrisAchievements',
    dailyTasks: 'tetrisDailyTasks',
    weeklyTasks: 'tetrisWeeklyTasks',
    monthlyTasks: 'tetrisMonthlyTasks',
    shop: 'tetrisShop',
    checkin: 'tetrisCheckin',
    monthlyCard: 'tetrisMonthlyCard',
    battlePass: 'tetrisBattlePass',
    battlePassTasks: 'tetrisBattlePassTasks'
    // 注意：不含 musicOrder
};

// ---------- 工具：i18n 安全取词 ----------
function sdT(key, fallback) {
    if (typeof languageManager === 'undefined') return fallback || key;
    const v = languageManager.getText(key);
    return v === key ? (fallback || key) : v;
}

// ---------- 数据采集 ----------
function collectSaveData() {
    const data = {};
    for (const [key, lsKey] of Object.entries(SAVE_LOCALSTORAGE_KEYS)) {
        const raw = localStorage.getItem(lsKey);
        if (raw === null) continue;
        try {
            data[key] = JSON.parse(raw);
        } catch (e) {
            data[key] = raw;
        }
    }
    return data;
}

// ---------- 导出 ----------
async function exportSaveData() {
    const save = {
        app: 'tetris',
        type: 'save',
        version: SAVE_VERSION,
        exportedAt: Date.now(),
        data: collectSaveData()
    };

    const json = JSON.stringify(save, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;

    if (typeof downloadBlob === 'function') {
        downloadBlob(blob, `tetris-save-${stamp}.json`);
    }
    return {
        size: blob.size,
        localKeys: Object.keys(save.data).length
    };
}

// ---------- 导入 ----------
async function importSaveData(json, options = {}) {
    const { merge = false } = options;
    if (!json || json.type !== 'save') {
        throw new Error('INVALID_FILE');
    }
    if (json.version > SAVE_VERSION) {
        throw new Error('VERSION_TOO_NEW');
    }

    let localCount = 0;
    if (json.data) {
        for (const [key, lsKey] of Object.entries(SAVE_LOCALSTORAGE_KEYS)) {
            const v = json.data[key];
            if (v === undefined) continue;
            try {
                if (merge && localStorage.getItem(lsKey) !== null) continue;
                localStorage.setItem(lsKey, typeof v === 'string' ? v : JSON.stringify(v));
                localCount++;
            } catch (e) {
                console.warn('[save] write failed:', lsKey, e);
            }
        }
    }

    reloadAllDataFromStorage();
    // ★ 导入后强制刷新，确保所有 UI 同步新数据
    setTimeout(() => { location.reload(); }, 300);
    return { localKeys: localCount };
}

// ---------- 清空（不影响音乐） ----------
async function clearAllSaveData() {
    for (const lsKey of Object.values(SAVE_LOCALSTORAGE_KEYS)) {
        try { localStorage.removeItem(lsKey); } catch (e) {}
    }
    reloadAllDataFromStorage();
    // ★ 清空后强制刷新，确保所有 UI 回到初始状态
    setTimeout(() => { location.reload(); }, 300);
}

// ---------- 重新加载内存状态 ----------
function reloadAllDataFromStorage() {
    try {
        if (typeof loadSettings === 'function') loadSettings();
        if (typeof loadAccountData === 'function') loadAccountData();
        if (typeof loadStatsData === 'function') loadStatsData();
        if (typeof loadLeaderboardData === 'function') loadLeaderboardData();
        if (typeof levelManager !== 'undefined') levelManager.load();
        if (typeof achievementManager !== 'undefined') achievementManager.load();
        if (typeof taskSystem !== 'undefined') taskSystem.refresh();

        // 新模块
        if (typeof shopManager !== 'undefined') shopManager.load();
        if (typeof checkinManager !== 'undefined') checkinManager.load();
        if (typeof monthlyCardManager !== 'undefined') monthlyCardManager.load();
        if (typeof battlePassManager !== 'undefined') battlePassManager.load();

        // 刷新 UI
        if (typeof updateStatsDisplay === 'function') updateStatsDisplay();
        if (typeof updateAccountDisplay === 'function') updateAccountDisplay();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        if (typeof updateLeaderboardDisplay === 'function') updateLeaderboardDisplay();
        if (typeof updateShopBadge === 'function') updateShopBadge();
        if (typeof updateCheckinBadge === 'function') updateCheckinBadge();
        if (typeof updateMonthlyCardBadge === 'function') updateMonthlyCardBadge();
        if (typeof updateBattlePassBadge === 'function') updateBattlePassBadge();
        if (typeof updateTaskBadge === 'function') updateTaskBadge();

        // 渲染面板（如果开着）
        if (typeof renderAchievements === 'function' && typeof achievementPanel !== 'undefined'
            && achievementPanel && achievementPanel.style.display !== 'none') renderAchievements();
        if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) dailyTaskManager.render();
        if (typeof renderShop === 'function' && document.getElementById('shopPanel')
            && document.getElementById('shopPanel').style.display !== 'none') renderShop();
        if (typeof renderCheckin === 'function' && document.getElementById('checkinPanel')
            && document.getElementById('checkinPanel').style.display !== 'none') renderCheckin();
        if (typeof renderMonthlyCardPanel === 'function' && document.getElementById('monthlyCardPanel')
            && document.getElementById('monthlyCardPanel').style.display !== 'none') renderMonthlyCardPanel();
        if (typeof renderBattlePassPanel === 'function' && typeof battlePassPanel !== 'undefined'
            && battlePassPanel && battlePassPanel.style.display !== 'none') renderBattlePassPanel();
    } catch (e) {
        console.warn('[save] reload failed:', e);
    }
}

// ---------- 工具 ----------
function formatSaveSize(bytes) {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// ---------- 刷新面板显示 ----------
function refreshSaveDataPanel() {
    const el = document.getElementById('saveDataStats');
    if (!el) return;
    const d = collectSaveData();
    const lines = [];
    const t = (key, fallback) => sdT(key, fallback);

    const lsSize = (() => {
        let total = 0;
        for (const lsKey of Object.values(SAVE_LOCALSTORAGE_KEYS)) {
            try {
                const v = localStorage.getItem(lsKey);
                if (v) total += v.length * 2;
            } catch (e) {}
        }
        return total;
    })();

    lines.push(`📦 ${t('saveDataSize', '存档大小')}: <strong>${formatSaveSize(lsSize)}</strong>`);

    if (d.account) {
        const acc = typeof d.account === 'string' ? JSON.parse(d.account) : d.account;
        const name = acc.nickname || t('saveDataNoNickname', '(未设置)');
        const expLabel = t('exp', '经验');
        lines.push(`👤 ${t('accountCurrentName', '昵称')}: <strong>${name}</strong> · ${expLabel} ${acc.exp || 0}`);
    }

    if (d.stats) {
        const s = typeof d.stats === 'string' ? JSON.parse(d.stats) : d.stats;
        lines.push(`📊 ${t('statsTotalGames', '局数')}: <strong>${s.totalGames || 0}</strong> · ${t('statsTotalLines', '消行')}: <strong>${s.totalLines || 0}</strong> · ${t('statsHighestScore', '最高分')}: <strong>${s.highestScore || 0}</strong>`);
    }

    if (d.leaderboard) {
        const lb = typeof d.leaderboard === 'string' ? JSON.parse(d.leaderboard) : d.leaderboard;
        lines.push(`🏆 ${t('leaderboard', '排行榜')}: ${t('classicMode', '经典')} <strong>${(lb.classic || []).length}</strong> · ${t('challengeMode', '挑战')} <strong>${(lb.challenge || []).length}</strong> · ${t('endlessMode', '无尽')} <strong>${(lb.endless || []).length}</strong>`);
    }

    if (d.achievements) {
        const a = typeof d.achievements === 'string' ? JSON.parse(d.achievements) : d.achievements;
        const unlockedCount = a.unlocked ? Object.keys(a.unlocked).length : 0;
        lines.push(`🏅 ${t('achievements', '成就')}: <strong>${unlockedCount}</strong> ${t('saveDataUnlockedCount', '个已解锁')}`);
    }

    if (d.dailyTasks) {
        const tsk = typeof d.dailyTasks === 'string' ? JSON.parse(d.dailyTasks) : d.dailyTasks;
        const claimed = (tsk.tasks || []).filter(x => x.claimed).length;
        lines.push(`📅 ${t('taskTabDaily', '今日任务')}: <strong>${claimed}/${(tsk.tasks || []).length}</strong> ${t('dailyTaskClaimed', '已领取')}`);
    }

    if (d.shop) {
        const shop = typeof d.shop === 'string' ? JSON.parse(d.shop) : d.shop;
        lines.push(`🛒 ${t('shopTitle', '商店')}: 💰 <strong>${shop.coins || 0}</strong>`);
    }

    if (d.checkin) {
        const ci = typeof d.checkin === 'string' ? JSON.parse(d.checkin) : d.checkin;
        const count = (ci.signedDates || []).length;
        lines.push(`📆 ${t('checkinTitle', '签到')}: <strong>${count}</strong> ${t('checkinTimes', '次')}`);
    }

    if (d.monthlyCard) {
        const mc = typeof d.monthlyCard === 'string' ? JSON.parse(d.monthlyCard) : d.monthlyCard;
        const days = mc.expireAt > Date.now() ? Math.ceil((mc.expireAt - Date.now()) / 86400000) : 0;
        lines.push(`💎 ${t('monthlyCardTitle', '月卡')}: <strong>${days > 0 ? `${days} ${t('monthlyCardDays', '天')}` : t('monthlyCardInactive', '未开通')}</strong>`);
    }

    if (d.battlePass) {
        const bp = typeof d.battlePass === 'string' ? JSON.parse(d.battlePass) : d.battlePass;
        const lv = Math.min(50, Math.floor((bp.exp || 0) / 1000) + 1);
        lines.push(`🎫 ${t('bpTitle', '通行证')}: <strong>${t('bpLevelShort', 'Lv')}${lv}</strong>`);
    }

    el.innerHTML = lines.join('<br>');
}

// ---------- 面板事件绑定 ----------
function initSaveDataPanel() {
    const exportBtn = document.getElementById('exportSaveBtn');
    const importBtn = document.getElementById('importSaveBtn');
    const clearBtn = document.getElementById('clearAllSaveBtn');
    const fileInput = document.getElementById('importSaveFileInput');

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            exportBtn.disabled = true;
            try {
                const r = await exportSaveData();
                showSaveNotification(`✅ ${sdT('saveExportSuccess', '存档已导出')} (${formatSaveSize(r.size)})`);
            } catch (e) {
                console.error('[save] export failed:', e);
                showSaveNotification('❌ ' + sdT('saveExportFailed', '导出失败'), true);
            }
            exportBtn.disabled = false;
            refreshSaveDataPanel();
            audioSystem.playSound('click');
        });
    }

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            fileInput.value = '';
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                if (!json || json.type !== 'save' || !json.data) {
                    showSaveNotification('❌ ' + sdT('saveImportInvalid', '文件格式无效'), true);
                    return;
                }
                showImportConfirmModal(json);
            } catch (err) {
                console.error('[save] read failed:', err);
                showSaveNotification('❌ ' + sdT('saveImportInvalid', '文件格式无效'), true);
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetCustomModalToDefault();
            modalIcon.textContent = '🗑️';
            modalTitle.textContent = sdT('saveClearAllTitle', '清空游戏数据');
            modalText.textContent = sdT('saveClearAllText', '这将删除所有游戏数据（设置、账号、统计、排行榜、成就、任务、商店），且不可恢复。音乐文件不受影响。确定继续？');
            modalScore.textContent = '';
            modalInput.style.display = 'none';
            modalScore.style.display = 'none';
            modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-danger';
            modalConfirmBtn.textContent = sdT('delete', '删除');
            showPanel(customModal);
            const original = modalConfirmBtn.onclick;
            modalConfirmBtn.onclick = async () => {
                await clearAllSaveData();
                hidePanel(customModal);
                resetCustomModalToDefault();
                modalConfirmBtn.onclick = original;
                // 提示会在页面刷新前短暂显示（300ms）
                showSaveNotification(`✅ ${sdT('saveClearAllSuccess', '游戏数据已清空')}`);
                audioSystem.playSound('click');
            };
            modalCancelBtn.onclick = () => {
                hidePanel(customModal);
                resetCustomModalToDefault();
                audioSystem.playSound('click');
            };
        });
    }
}

// ---------- 导入确认弹窗 ----------
function showImportConfirmModal(json) {
    resetCustomModalToDefault();
    modalIcon.textContent = '📥';
    modalTitle.textContent = sdT('saveImportConfirmTitle', '导入存档');

    const exportedDate = json.exportedAt
        ? new Date(json.exportedAt).toLocaleString()
        : sdT('saveImportUnknownTime', '未知时间');

    let info = `${sdT('saveImportExportTime', '导出时间')}: ${exportedDate}<br>`;
    info += `${sdT('saveImportVersion', '存档版本')}: v${json.version}<br><br>`;
    info += `<strong>${sdT('saveImportChooseMode', '选择导入方式')}：</strong><br>`;
    info += `<span style="color:#ff5e62">${sdT('saveImportOverwrite', '覆盖')}</span> - ${sdT('saveImportOverwriteDesc', '用存档替换当前所有数据')}<br>`;
    info += `<span style="color:#4CAF50">${sdT('saveImportMerge', '合并')}</span> - ${sdT('saveImportMergeDesc', '保留现有数据，只补充存档里有的')}<br>`;
    info += `<br><span style="color:#a0a0c0;font-size:.85rem">${sdT('saveImportMusicHint', '※ 音乐文件不受影响')}</span>`;
    modalText.innerHTML = info;
    modalScore.textContent = '';
    modalInput.style.display = 'none';
    modalScore.style.display = 'none';

    // 不替换 footer HTML，只临时插入"合并"按钮 + 临时替换 onclick
    const prevConfirmOnclick = modalConfirmBtn.onclick;
    const prevCancelOnclick = modalCancelBtn.onclick;

    modalConfirmBtn.textContent = sdT('saveImportOverwrite', '覆盖');
    modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-primary';

    // 取消按钮也应该 i18n
    modalCancelBtn.textContent = sdT('cancel', '取消');

    // 临时插入"合并"按钮
    let mergeBtn = document.getElementById('importMergeBtn');
    if (!mergeBtn) {
        mergeBtn = document.createElement('button');
        mergeBtn.id = 'importMergeBtn';
        mergeBtn.className = 'custom-modal-btn custom-modal-btn-secondary';
        mergeBtn.textContent = sdT('saveImportMerge', '合并');
        modalConfirmBtn.parentElement.insertBefore(mergeBtn, modalConfirmBtn);
    } else {
        mergeBtn.textContent = sdT('saveImportMerge', '合并');
    }

    // 清理函数
    const cleanup = () => {
        if (mergeBtn && mergeBtn.parentElement) mergeBtn.remove();
        modalConfirmBtn.onclick = prevConfirmOnclick;
        modalCancelBtn.onclick = prevCancelOnclick;
    };

    // 合并
    mergeBtn.onclick = async () => {
        try {
            const r = await importSaveData(json, { merge: true });
            cleanup();
            hidePanel(customModal);
            resetCustomModalToDefault();
            showSaveNotification(`✅ ${sdT('saveImportMergeDone', '合并导入完成')} (${r.localKeys} ${sdT('saveImportItems', '项')})`);
        } catch (e) {
            console.error(e);
            cleanup();
            hidePanel(customModal);
            resetCustomModalToDefault();
            showSaveNotification('❌ ' + sdT('saveImportFailed', '导入失败'), true);
        }
    };

    // 覆盖
    modalConfirmBtn.onclick = async () => {
        try {
            const r = await importSaveData(json, { merge: false });
            cleanup();
            hidePanel(customModal);
            resetCustomModalToDefault();
            showSaveNotification(`✅ ${sdT('saveImportOverwriteDone', '覆盖导入完成')} (${r.localKeys} ${sdT('saveImportItems', '项')})`);
        } catch (e) {
            console.error(e);
            cleanup();
            hidePanel(customModal);
            resetCustomModalToDefault();
            showSaveNotification('❌ ' + sdT('saveImportFailed', '导入失败'), true);
        }
    };

    // 取消
    modalCancelBtn.onclick = () => {
        cleanup();
        hidePanel(customModal);
        resetCustomModalToDefault();
        audioSystem.playSound('click');
    };

    showPanel(customModal);
}