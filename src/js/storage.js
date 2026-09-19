// ============================================================
// 本地存储模块
// - 账号（昵称 / 创建时间）
// - 统计（局数 / 时长 / 行数 / 分数 / 方块使用）
// - 排行榜（三种模式）
// 只做纯数据读写，不含 UI
// ============================================================

// ============================================================
// 账号
// ============================================================
function loadAccountData() {
    const saved = localStorage.getItem('tetrisAccount');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            accountData.nickname = p.nickname || '';
            accountData.createdAt = p.createdAt || 0;
        } catch (e) {}
    }
}

function saveAccountData() {
    try {
        localStorage.setItem('tetrisAccount', JSON.stringify(accountData));
        return true;
    } catch (e) {
        return false;
    }
}

function hasAccount() {
    return accountData.nickname && accountData.nickname.trim().length > 0;
}

function createAccount(nickname) {
    if (!nickname || !nickname.trim()) return false;
    accountData.nickname = nickname.trim().substring(0, 20);
    accountData.createdAt = Date.now();
    saveAccountData();
    return true;
}

function changeAccountName(nickname) {
    if (!nickname || !nickname.trim()) return false;
    accountData.nickname = nickname.trim().substring(0, 20);
    saveAccountData();
    return true;
}

function resetAccount() {
    accountData = { nickname: '', createdAt: 0 };
    try { localStorage.removeItem('tetrisAccount'); } catch (e) {}
}

// ============================================================
// 统计
// ============================================================
function loadStatsData() {
    const saved = localStorage.getItem('tetrisStats');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            statsData = { ...statsData, ...p };
            if (!Array.isArray(statsData.pieces) || statsData.pieces.length !== 7) {
                statsData.pieces = [0, 0, 0, 0, 0, 0, 0];
            }
        } catch (e) {}
    }
}

function saveStatsData() {
    try {
        localStorage.setItem('tetrisStats', JSON.stringify(statsData));
        return true;
    } catch (e) {
        return false;
    }
}

function resetStatsData() {
    statsData = {
        totalGames: 0,
        totalPlaytime: 0,
        totalLines: 0,
        totalScore: 0,
        highestScore: 0,
        highestCombo: 0,
        pieces: [0, 0, 0, 0, 0, 0, 0]
    };
}

// ============================================================
// 排行榜
// ============================================================
function loadLeaderboardData() {
    const saved = localStorage.getItem('tetrisLeaderboard');
    if (saved) {
        try {
            leaderboardData = JSON.parse(saved);
            if (!leaderboardData.classic) leaderboardData.classic = [];
            if (!leaderboardData.challenge) leaderboardData.challenge = [];
            if (!leaderboardData.endless) leaderboardData.endless = [];
        } catch (e) {
            leaderboardData = { classic: [], challenge: [], endless: [] };
        }
    }
}

function saveLeaderboardData() {
    try {
        localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboardData));
        return true;
    } catch (e) {
        return false;
    }
}

function resetLeaderboardData(mode) {
    if (!mode) {
        leaderboardData = { classic: [], challenge: [], endless: [] };
    } else {
        leaderboardData[mode] = [];
    }
}