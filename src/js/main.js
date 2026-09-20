// ============================================================
// 常量
// ============================================================
const COLS=10, ROWS=20;
let BLOCK_SIZE = 30;
const COLORS=['cyan','blue','orange','yellow','green','purple','red'];
const SHAPES=[
[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
[[2,0,0],[2,2,2],[0,0,0]],
[[0,0,3],[3,3,3],[0,0,0]],
[[4,4],[4,4]],
[[0,5,5],[5,5,0],[0,0,0]],
[[0,6,0],[6,6,6],[0,0,0]],
[[7,7,0],[0,7,7],[0,0,0]]
];
const GAME_MODES={CLASSIC:'classic',CHALLENGE:'challenge',ENDLESS:'endless'};
const CHALLENGE_TYPES={TIMED:'timed',INVISIBLE:'invisible',INVISIBLE2:'invisible2',SPRINT:'sprint',SURVIVAL:'survival',MARATHON:'marathon',TIMED_SCORE:'timed_score',COUNTDOWN_SURVIVAL:'countdown_survival',TIMED_LINES:'timed_lines',SPEED:'speed'};
const GAME_STATE={WAITING:'waiting',PLAYING:'playing',PAUSED:'paused',GAMEOVER:'gameover',TIMEUP:'timeup'};

function debounce(fn, wait) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => { fn.apply(this, args); timer = null; }, wait);
    };
}

function updateSliderFill(slider) {
    if (!slider) return;
    const min = +slider.min || 0;
    const max = +slider.max || 100;
    const val = +slider.value;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--fill', pct + '%');
}

function attachDragSort(containerEl, trackSelector, onReorder) {
    if (!containerEl) return;
    let dragState = null;
    const SCROLL_EDGE = 30;
    const SCROLL_SPEED = 8;

    containerEl.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('music-track-remove')) return;
        if (e.target.classList.contains('bgm-track-remove')) return;
        if (e.button !== 0) return;
        const row = e.target.closest(trackSelector);
        if (!row) return;

        e.preventDefault();
        const rows = Array.from(containerEl.querySelectorAll(trackSelector));
        const fromIndex = rows.indexOf(row);
        if (fromIndex === -1) return;

        const rowRect = row.getBoundingClientRect();
        const rowHeight = rowRect.height;
        const gap = 6;

        const ghost = row.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = rowRect.width + 'px';
        ghost.style.height = rowRect.height + 'px';
        ghost.style.left = rowRect.left + 'px';
        ghost.style.top = rowRect.top + 'px';
        document.body.appendChild(ghost);

        row.classList.add('drag-placeholder');
        row.style.height = rowRect.height + 'px';

        dragState = {
            fromIndex,
            currentIndex: fromIndex,
            offsetY: e.clientY - rowRect.top,
            ghost,
            row,
            rows,
            rowHeight,
            gap,
            scrollInterval: null
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragState) return;
        const { ghost, offsetY, rows, rowHeight, gap } = dragState;
        ghost.style.top = (e.clientY - offsetY) + 'px';

        const containerRect = containerEl.getBoundingClientRect();
        const y = e.clientY - containerRect.top + containerEl.scrollTop;
        let targetIndex = 0;
        for (let i = 0; i < rows.length; i++) {
            const rowTop = i * (rowHeight + gap);
            if (y < rowTop + rowHeight / 2) {
                targetIndex = i;
                break;
            }
            targetIndex = i + 1;
        }
        if (targetIndex > rows.length) targetIndex = rows.length;
        if (targetIndex > dragState.fromIndex) targetIndex--;
        if (targetIndex === dragState.currentIndex) return;
        dragState.currentIndex = targetIndex;

        rows.forEach((r, i) => {
            if (i === dragState.fromIndex) return;
            let shift = 0;
            if (dragState.fromIndex < dragState.currentIndex) {
                if (i > dragState.fromIndex && i <= dragState.currentIndex) {
                    shift = -(rowHeight + gap);
                }
            } else if (dragState.fromIndex > dragState.currentIndex) {
                if (i >= dragState.currentIndex && i < dragState.fromIndex) {
                    shift = rowHeight + gap;
                }
            }
            r.style.transform = shift ? `translateY(${shift}px)` : '';
        });

        const mouseY = e.clientY;
        if (mouseY < containerRect.top + SCROLL_EDGE) {
            if (!dragState.scrollInterval) {
                dragState.scrollInterval = setInterval(() => { containerEl.scrollTop -= SCROLL_SPEED; }, 16);
            }
        } else if (mouseY > containerRect.bottom - SCROLL_EDGE) {
            if (!dragState.scrollInterval) {
                dragState.scrollInterval = setInterval(() => { containerEl.scrollTop += SCROLL_SPEED; }, 16);
            }
        } else {
            if (dragState.scrollInterval) {
                clearInterval(dragState.scrollInterval);
                dragState.scrollInterval = null;
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (!dragState) return;
        const { ghost, row, rows, scrollInterval } = dragState;
        if (scrollInterval) clearInterval(scrollInterval);

        ghost.remove();
        row.classList.remove('drag-placeholder');
        row.style.height = '';
        rows.forEach(r => { r.style.transform = ''; });
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const from = dragState.fromIndex;
        const to = dragState.currentIndex;
        dragState = null;

        if (from !== to) onReorder(from, to);
    });
}

class LanguageManager {
    constructor() {
        this.currentLang = 'zh-CN';
        this.textElements = new Map();
        this.placeholderElements = new Map();
        this.callbacks = [];
    }
    init() {
        const saved = localStorage.getItem('tetrisLanguage');
        if (saved && LANGUAGE_PACKS[saved]) this.currentLang = saved;
        else this.detectBrowserLanguage();
        this.collectTextElements();
        this.updateAllTexts();
        this.updateLanguageButtons();
        this.setupLanguageSwitcher();
        this.validateAll();
    }
    collectTextElements() {
        document.querySelectorAll('[data-i18n]').forEach(el => this.textElements.set(el, el.getAttribute('data-i18n')));
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => this.placeholderElements.set(el, el.getAttribute('data-i18n-placeholder')));
    }
    updateAllTexts() {
        const pack = LANGUAGE_PACKS[this.currentLang];
        const note = document.getElementById('settingsNoteContainer');
        if (note && pack.settingsNoteTitle) {
            note.innerHTML = `<p style="margin-bottom:5px"><strong>${pack.settingsNoteTitle}</strong></p>
<p style="margin:5px 0 0 10px">${pack.settingsNoteItem1}</p>
<p style="margin:5px 0 0 10px">${pack.settingsNoteItem2}</p>
<p style="margin:5px 0 0 10px">${pack.settingsNoteItem3||''}</p>`;
        }
        const modes = document.getElementById('modesDescriptionText');
        if (modes && pack.modesDescription) {
            modes.innerHTML = pack.modesDescription
                .replace(/^([^：:\n]+?)\s*([：:])\s*/gm, '<strong>$1$2</strong> ')
                .replace(/\n/g, '<br>');
        }
        this.textElements.forEach((key, el) => {
            if (pack[key] === undefined) return;
            if (key === 'modesDescription') return;
            if (el.tagName === 'INPUT' && el.type === 'text') el.placeholder = pack[key];
            else el.textContent = pack[key];
        });
        this.placeholderElements.forEach((key, el) => {
            if (pack[key] !== undefined && el.tagName === 'INPUT') el.placeholder = pack[key];
        });
        document.title = `${pack.gameTitle || 'Tetris'} - ${pack.version || 'Version'} 5.2.0`;
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) gameBoard.setAttribute('data-paused-label', pack.pausedLabel || '已暂停');
        if (typeof refreshVersionList === 'function') refreshVersionList();
        if (typeof renderBgmPanel === 'function') renderBgmPanel();
        if (typeof updateBgmPanelUI === 'function') updateBgmPanelUI();
        if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) dailyTaskManager.render();
        if (typeof renderShop === 'function' && document.getElementById('shopPanel') && document.getElementById('shopPanel').style.display !== 'none') renderShop();
        this.callbacks.forEach(cb => cb(this.currentLang));
        localStorage.setItem('tetrisLanguage', this.currentLang);
        this.validatePack(this.currentLang);
    }
    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === this.currentLang);
        });
    }
    setupLanguageSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeLanguage(btn.getAttribute('data-lang')));
        });
    }
    changeLanguage(lang) {
        if (!LANGUAGE_PACKS[lang]) return false;
        this.currentLang = lang;
        this.updateLanguageButtons();
        this.updateAllTexts();
        return true;
    }
    detectBrowserLanguage() {
        const bl = navigator.language || navigator.userLanguage;
        const supported = Object.keys(LANGUAGE_PACKS);
        if (supported.includes(bl)) { this.currentLang = bl; return; }
        const prefix = bl.split('-')[0];
        for (const l of supported) if (l.startsWith(prefix)) { this.currentLang = l; return; }
    }
    onLanguageChange(cb) { this.callbacks.push(cb); }
    getText(key) {
        const pack = LANGUAGE_PACKS[this.currentLang];
        if (pack && pack[key] !== undefined) return pack[key];
        const en = LANGUAGE_PACKS['en-US'];
        if (en && en[key] !== undefined) return en[key];
        return key;
    }
    validatePack(lang) {
        const base = LANGUAGE_PACKS['en-US'];
        const target = LANGUAGE_PACKS[lang];
        if (!base || !target) return;
        const baseKeys = Object.keys(base);
        const missing = baseKeys.filter(k => target[k] === undefined);
        const empty = baseKeys.filter(k => target[k] !== undefined && String(target[k]).trim() === '');
        if (missing.length === 0 && empty.length === 0) {
            console.log(`[i18n] ✅ ${lang} 语言包完整（${baseKeys.length} 个 key）`);
            return;
        }
        if (missing.length) console.warn(`[i18n] ⚠️ ${lang} 缺少 ${missing.length} 个 key:`, missing);
        if (empty.length) console.warn(`[i18n] ⚠️ ${lang} 有 ${empty.length} 个空值:`, empty);
    }
    validateAll() {
        Object.keys(LANGUAGE_PACKS).forEach(lang => {
            if (lang !== 'en-US') this.validatePack(lang);
        });
    }
}

const languageManager = new LanguageManager();

let canvas, ctx, nextCanvas, nextCtx;
let nextCanvas2, nextCtx2, nextCanvas3, nextCtx3;
let board = [];
let currentPiece, nextPiece;
let nextQueue = [];
let score = 0, level = 1, lines = 0;
let gameOver = false, isPaused = false;
let dropCounter = 0, dropInterval = 1000, lastTime = 0;
let currentMode = GAME_MODES.CLASSIC;
let currentChallenge = null;
let gameTime = 0, timeLimit = 180;
let gameTimer = null, countdownTimer = null;
let gameStarted = false, isCountingDown = false;
const invisibleRows = 10;
const sprintTargetLines = 40;
let sprintLinesCleared = 0;
let survivalTimer = 30;
let survivalGarbageInterval = null;
let elapsedTime = 0, elapsedTimer = null;
let cameFromChallengeMenu = false;
let gameState = GAME_STATE.WAITING;
let currentVersionIndex = 0;

let marathonTarget = 10, marathonLinesCleared = 0;
let marathonIncreaseTimer = 75, marathonIncreaseInterval = null;
let marathonCheckTimer = 60, marathonCheckInterval = null;
let marathonStage = 1, marathonFailed = false, marathonCheckFailed = false;

let customInitialTime = 180;
let customTargetLines = 40;
let countdownTime = 0;
let timedScoreTime = 0;
let timedLinesTime = 0;
let timedLinesCleared = 0;
const timeAddPerLine = 2;
let newModeTimer = null;
let pendingChallengeType = null;
let customSurvivalInterval = 30;

let speedTimeLimit = 5;
let speedMaxTimeouts = 3;
let speedTimeouts = 0;
let speedBlockTimer = 0;
let speedBlockTimedOut = false;
let speedTimerInterval = null;
const speedDropInterval = 1000;

let pausedThisGame = false;
let marathonCheckSuccessCount = 0;

let currentTetrisCount = 0;
let currentHarddropCount = 0;

let maxComboThisGame = 0;

let showPreview = true, showHeightLine = true, showExtraPreview = false;
let enableBuiltinBGM = true;
let musicVolume = 70, soundVolume = 80;

let leaderboardData = { classic:[], challenge:[], endless:[] };
let statsData = { totalGames:0, totalPlaytime:0, totalLines:0, totalScore:0, highestScore:0, highestCombo:0, pieces:[0,0,0,0,0,0,0] };
let currentGameStartTime = 0;
let currentCombo = 0;
let accountData = { nickname: '', createdAt: 0 };

const $ = id => document.getElementById(id);
const mainMenu = $('mainMenu'), challengeMenu = $('challengeMenu'), gameScreen = $('gameScreen');
const backBtn = $('backBtn'), backToMainBtn = $('backToMainBtn');
const gameModeTitle = $('gameModeTitle');
const scoreElement = $('score'), levelElement = $('level'), linesElement = $('lines');
const nextPieceElement = $('nextPieceName');
const nextPieceElement2 = $('nextPieceName2');
const nextPieceElement3 = $('nextPieceName3');
const nextExtraContainer = $('nextExtraContainer');
const gameStatusElement = $('gameStatus');
const timerContainer = $('timerContainer'), timerValue = $('timerValue');
const timeElapsedItem = $('timeElapsedItem'), timeElapsed = $('timeElapsed');
const speedTimeoutItem = $('speedTimeoutItem'), speedTimeoutCount = $('speedTimeoutCount');
const speedBlockTimerContainer = $('speedBlockTimerContainer'), speedBlockTimerValue = $('speedBlockTimerValue');
const survivalTimerContainer = $('survivalTimerContainer'), survivalTimerValue = $('survivalTimerValue');
const pauseBtn = $('pauseBtn'), resetBtn = $('resetBtn');
const challengeMenuCard = $('challengeMenuCard');
const invisibleMask = $('invisibleMask'), invisibleDivider = $('invisibleDivider');
const sprintProgressContainer = $('sprintProgressContainer'), sprintProgressFill = $('sprintProgressFill'), sprintLinesLeft = $('sprintLinesLeft');
const marathonProgressContainer = $('marathonProgressContainer'), marathonProgressFill = $('marathonProgressFill');
const marathonTargetElement = $('marathonTarget'), marathonStageText = $('marathonStageText'), marathonNextCheck = $('marathonNextCheck');
const marathonTimerContainer = $('marathonTimerContainer'), marathonTimerValue = $('marathonTimerValue');
const topLeftControls = $('topLeftControls'), settingsBtn = $('settingsBtn'), settingsPanel = $('settingsPanel');
const closeSettingsBtn = document.querySelector('.close-settings');
const previewToggle = $('previewToggle'), heightlineToggle = $('heightlineToggle');
const extraPreviewToggle = $('extraPreviewToggle');
const bgmEnableToggle = $('bgmEnableToggle');
const musicVolumeSlider = $('musicVolumeSlider'), soundVolumeSlider = $('soundVolumeSlider');
const musicVolumeValue = $('musicVolumeValue'), soundVolumeValue = $('soundVolumeValue');
const leaderboardBtn = $('leaderboardBtn'), updatesBtn = $('updatesBtn');
const achievementsBtn = $('achievementsBtn');
const leaderboardPanel = $('leaderboardPanel'), updateNotice = $('updateNotice');
const achievementPanel = $('achievementPanel'), bgmPanel = $('bgmPanel');
const closeLeaderboardBtn = document.querySelector('.close-leaderboard');
const closeNoticeBtn = document.querySelector('.close-notice');
const closeAchievementsBtn = document.querySelector('.close-achievements');
const closeBgmBtn = document.querySelector('.close-bgm');
const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
const classicLeaderboard = $('classicLeaderboard'), challengeLeaderboard = $('challengeLeaderboard'), endlessLeaderboard = $('endlessLeaderboard');
const clearScoresBtn = $('clearScoresBtn');
const gameOverlay = $('gameOverlay'), countdownElement = $('countdown');
const startPrompt = document.querySelector('.start-prompt');
const menuCards = document.querySelectorAll('.menu-card');
const challengeCards = document.querySelectorAll('#challengeMenu .menu-card');
const versionSidebar = $('versionSidebar'), versionDetailContent = $('versionDetailContent');
const detailTitle = $('detailTitle'), detailSubtitle = $('detailSubtitle');
const customModal = $('customModal'), modalIcon = $('modalIcon'), modalTitle = $('modalTitle'), modalText = $('modalText');
const modalInput = $('modalInput'), modalScore = $('modalScore');
const modalCancelBtn = $('modalCancelBtn'), modalConfirmBtn = $('modalConfirmBtn');
const saveNotification = $('saveNotification');
const accountNameValue = $('accountNameValue'), accountCreatedDate = $('accountCreatedDate');
const accountNameInput = $('accountNameInput'), accountSaveBtn = $('accountSaveBtn');
const invisibleChoiceModal = $('invisibleChoiceModal');
const invisibleChoiceCancel = $('invisibleChoiceCancel');
const timedChoiceModal = $('timedChoiceModal');
const timedChoiceCancel = $('timedChoiceCancel');
const customTimeModal = $('customTimeModal');
const timeModalIcon = $('timeModalIcon'), timeModalTitle = $('timeModalTitle'), timeModalText = $('timeModalText');
const timeModalInput = $('timeModalInput'), timeModalHint = $('timeModalHint'), timeModalExtra = $('timeModalExtra');
const timeModalCancel = $('timeModalCancel'), timeModalConfirm = $('timeModalConfirm');
const extraInputGroup = $('extraInputGroup'), extraInputLabel = $('extraInputLabel'), extraModalInput = $('extraModalInput');
const gameMusicBtn = $('gameMusicBtn');

const musicPlayBtn = $('musicPlayBtn');
const musicProgress = $('musicProgress');
const musicCurTime = $('musicCurTime');
const musicTotalTime = $('musicTotalTime');
const musicNowTitle = $('musicNowTitle');
const musicNowSub = $('musicNowSub');
const musicImportBtn = $('musicImportBtn');
const musicExportAllBtn = $('musicExportAllBtn');
const musicFileInput = $('musicFileInput');
const musicPlaylistEl = $('musicPlaylist');
const musicPlaylistCount = $('musicPlaylistCount');

const bgmPlayBtn = $('bgmPlayBtn');
const bgmProgress = $('bgmProgress');
const bgmCurTime = $('bgmCurTime');
const bgmTotalTime = $('bgmTotalTime');
const bgmNowTitle = $('bgmNowTitle');
const bgmNowSub = $('bgmNowSub');
const bgmNowIcon = $('bgmNowIcon');
const bgmListEl = $('bgmList');
const bgmListCount = $('bgmListCount');

function getVersionList() {
    return VERSION_DATA[languageManager.currentLang] || VERSION_DATA['en-US'] || [];
}

function formatDuration(sec) {
    if (!sec || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function startTitleRoll(el, text) {
    if (!el) return;
    if (el._rollTimer) { clearTimeout(el._rollTimer); el._rollTimer = null; }
    el.classList.remove('rolling');
    el.style.removeProperty('--roll-distance');
    el.style.removeProperty('--roll-duration');
    el.textContent = text;
    requestAnimationFrame(() => {
        const containerWidth = el.clientWidth;
        const textWidth = el.scrollWidth;
        if (textWidth <= containerWidth) return;
        const distance = textWidth - containerWidth;
        const speed = 30;
        const duration = Math.max(4, distance / speed) + 's';
        el.innerHTML = `<span>${escapeHtml(text)}</span>`;
        el.style.setProperty('--roll-distance', distance + 'px');
        el.style.setProperty('--roll-duration', duration);
        el._rollTimer = setTimeout(() => {
            el._rollTimer = null;
            el.classList.add('rolling');
        }, 1000);
    });
}
function stopTitleRoll(el, text) {
    if (!el) return;
    if (el._rollTimer) { clearTimeout(el._rollTimer); el._rollTimer = null; }
    el.classList.remove('rolling');
    el.style.removeProperty('--roll-distance');
    el.style.removeProperty('--roll-duration');
    el.textContent = text;
}

let musicSearchQuery = '';
let bgmSearchQuery = '';
function filterTracksByQuery(tracks, query) {
    if (!query) return tracks;
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(t => {
        const name = (t.name || '').toLowerCase();
        const artist = (t.artist || '').toLowerCase();
        return name.includes(q) || artist.includes(q);
    });
}

function updateAccountDisplay() {
    if (!accountNameValue) return;
    if (hasAccount()) {
        accountNameValue.textContent = accountData.nickname;
        if (accountCreatedDate && accountData.createdAt) {
            const d = new Date(accountData.createdAt);
            accountCreatedDate.textContent = `📅 ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
        if (accountNameInput) accountNameInput.value = accountData.nickname;
    } else {
        accountNameValue.textContent = '—';
        if (accountCreatedDate) accountCreatedDate.textContent = '';
        if (accountNameInput) accountNameInput.value = '';
    }
    updateLevelDisplay();
}
function updateLevelDisplay() {
    const badge = document.getElementById('accountLevelBadge');
    const title = document.getElementById('accountLevelTitle');
    const expText = document.getElementById('accountExpText');
    const expFill = document.getElementById('accountExpFill');
    if (!badge) return;
    const p = levelManager.getProgress();
    badge.textContent = `${languageManager.getText('levelShort')}${p.level}`;
    title.textContent = levelManager.getTitle();
    expText.textContent = `${p.current} / ${p.need}`;
    expFill.style.width = p.pct + '%';
}
function resetCustomModalToDefault() {
    modalInput.value = '';
    modalInput.style.display = '';
    modalScore.style.display = '';
    modalCancelBtn.style.display = '';
    modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-primary';
    modalConfirmBtn.textContent = languageManager.getText('save');
}
function showAccountCreateModal() {
    resetCustomModalToDefault();
    modalIcon.textContent = '👤';
    modalTitle.textContent = languageManager.getText('accountCreateTitle');
    modalText.textContent = languageManager.getText('accountCreateText');
    modalScore.textContent = '';
    modalScore.style.display = 'none';
    modalInput.placeholder = languageManager.getText('accountNamePlaceholder');
    modalCancelBtn.style.display = 'none';
    showPanel(customModal);
    const original = modalConfirmBtn.onclick;
    modalConfirmBtn.onclick = () => {
        const name = modalInput.value.trim();
        if (!name) { showSaveNotification('❌ ' + languageManager.getText('accountInvalidName'), true); return; }
        createAccount(name);
        updateAccountDisplay();
        hidePanel(customModal);
        resetCustomModalToDefault();
        modalConfirmBtn.onclick = original;
        showSaveNotification(`✅ ${languageManager.getText('accountCreated')}`);
        audioSystem.playSound('click');
    };
    modalInput.onkeydown = (e) => { if (e.key === 'Enter') modalConfirmBtn.click(); };
    setTimeout(() => modalInput.focus(), 100);
}
function saveCurrentScore() {
    if (score <= 0) return;
    const playerName = hasAccount() ? accountData.nickname : languageManager.getText('accountDefaultName');
    addScoreToLeaderboard(currentMode, playerName, score, currentChallenge);
}

function formatPlaytime(s) {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}
function updateStatsDisplay() {
    const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    setText('statTotalGames', statsData.totalGames.toLocaleString());
    setText('statTotalPlaytime', formatPlaytime(statsData.totalPlaytime));
    setText('statTotalLines', statsData.totalLines.toLocaleString());
    setText('statTotalScore', statsData.totalScore.toLocaleString());
    setText('statHighestScore', statsData.highestScore.toLocaleString());
    setText('statHighestCombo', statsData.highestCombo);
    for (let i = 0; i < 7; i++) setText(`statPiece${i+1}`, statsData.pieces[i].toLocaleString());
}
function recordGameStats() {
    statsData.totalGames += 1;
    statsData.totalLines += lines;
    statsData.totalScore += score;
    if (score > statsData.highestScore) statsData.highestScore = score;
    if (currentCombo > statsData.highestCombo) statsData.highestCombo = currentCombo;
    if (currentGameStartTime > 0) statsData.totalPlaytime += Math.floor((Date.now() - currentGameStartTime) / 1000);
    saveStatsData();
    updateStatsDisplay();

    const baseCoinsGained = typeof shopManager !== 'undefined'
        ? Math.floor(score / 50)
        : 0;
    window._pendingBaseCoins = baseCoinsGained;
    window._pendingCoinsGained = 0;

    if (typeof achievementManager !== 'undefined') {
        achievementManager.onGameEnd({
            score, lines, maxCombo: maxComboThisGame,
            challenge: currentChallenge, mode: currentMode,
            elapsedTime, marathonStage, marathonCheckSuccessCount,
            pausedThisGame, level: levelManager.getLevel(),
            gameLevel: level,
            sprintCleared: sprintLinesCleared, sprintTarget: sprintTargetLines,
            endless: currentMode === GAME_MODES.ENDLESS, classic: currentMode === GAME_MODES.CLASSIC,
            timedLinesCleared, customTargetLines,
            speedTimeouts, marathonCheckFailed
        });
    }

    if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) {
        const playSec = currentGameStartTime > 0 ? Math.floor((Date.now() - currentGameStartTime) / 1000) : 0;
        dailyTaskManager.onGameEnd({
            score,
            lines,
            maxCombo: maxComboThisGame,
            pausedThisGame,
            playSeconds: playSec
        });
    }

    if (typeof battlePassManager !== 'undefined') {
        const bpExp = BattlePassManager.calcExpFromGame({ score, lines });
        if (bpExp > 0) battlePassManager.addExp(bpExp);
        const playSec = currentGameStartTime > 0 ? Math.floor((Date.now() - currentGameStartTime) / 1000) : 0;
        battlePassManager.onGameEnd({
            score,
            lines,
            maxCombo: maxComboThisGame,
            playSeconds: playSec,
            tetrisInc: currentTetrisCount
        });
    }

    const baseExpGained = levelManager.calcGameExp({ score, lines, challenge: currentChallenge });

    const hasDoubleExp = typeof shopManager !== 'undefined' && shopManager.getCount('double_exp') > 0;

    if (hasDoubleExp) {
        const panel = document.getElementById('doubleExpConfirmPanel');
        if (!panel) {
            checkDoubleCoinsCard(baseExpGained, false);
            return;
        }
        document.getElementById('doubleExpBase').textContent = `+${baseExpGained} EXP`;
        document.getElementById('doubleExpAfter').textContent = `+${baseExpGained * 2} EXP`;
        document.getElementById('doubleExpRemaining').textContent = `${shopManager.getCount('double_exp')} → ${shopManager.getCount('double_exp') - 1}`;
        showPanel(panel);

        const useBtn = document.getElementById('doubleExpUse');
        const skipBtn = document.getElementById('doubleExpSkip');
        const newUseBtn = useBtn.cloneNode(true);
        const newSkipBtn = skipBtn.cloneNode(true);
        useBtn.parentNode.replaceChild(newUseBtn, useBtn);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        newUseBtn.addEventListener('click', () => {
            hidePanel(panel);
            shopManager.useConsumable('double_exp');
            if (typeof updateShopBadge === 'function') updateShopBadge();
            audioSystem.playSound('targetIncrease');
            checkDoubleCoinsCard(baseExpGained * 2, true);
        });
        newSkipBtn.addEventListener('click', () => {
            hidePanel(panel);
            audioSystem.playSound('click');
            checkDoubleCoinsCard(baseExpGained, false);
        });
        return;
    }

    checkDoubleCoinsCard(baseExpGained, false);
}

function checkDoubleCoinsCard(expGained, usedDoubleExp) {
    const baseCoins = window._pendingBaseCoins || 0;
    const hasDoubleCoins = typeof shopManager !== 'undefined' && shopManager.getCount('double_coins') > 0;

    if (hasDoubleCoins && baseCoins > 0) {
        const panel = document.getElementById('doubleCoinsConfirmPanel');
        if (!panel) {
            console.warn('[shop] doubleCoinsConfirmPanel not found, skipping');
            if (baseCoins > 0 && typeof shopManager !== 'undefined') {
                shopManager.addCoins(baseCoins);
                window._pendingCoinsGained = baseCoins;
                if (typeof updateShopBadge === 'function') updateShopBadge();
            }
            finishGameStats(expGained, usedDoubleExp);
            return;
        }
        document.getElementById('doubleCoinsBase').textContent = `+${baseCoins} 💰`;
        document.getElementById('doubleCoinsAfter').textContent = `+${baseCoins * 2} 💰`;
        document.getElementById('doubleCoinsRemaining').textContent = `${shopManager.getCount('double_coins')} → ${shopManager.getCount('double_coins') - 1}`;
        showPanel(panel);

        const useBtn = document.getElementById('doubleCoinsUse');
        const skipBtn = document.getElementById('doubleCoinsSkip');
        const newUseBtn = useBtn.cloneNode(true);
        const newSkipBtn = skipBtn.cloneNode(true);
        useBtn.parentNode.replaceChild(newUseBtn, useBtn);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        newUseBtn.addEventListener('click', () => {
            hidePanel(panel);
            shopManager.useConsumable('double_coins');
            shopManager.addCoins(baseCoins * 2);
            window._pendingCoinsGained = baseCoins * 2;
            if (typeof updateShopBadge === 'function') updateShopBadge();
            audioSystem.playSound('targetIncrease');
            finishGameStats(expGained, usedDoubleExp);
        });
        newSkipBtn.addEventListener('click', () => {
            hidePanel(panel);
            shopManager.addCoins(baseCoins);
            window._pendingCoinsGained = baseCoins;
            if (typeof updateShopBadge === 'function') updateShopBadge();
            audioSystem.playSound('click');
            finishGameStats(expGained, usedDoubleExp);
        });
        return;
    }

    if (baseCoins > 0 && typeof shopManager !== 'undefined') {
        shopManager.addCoins(baseCoins);
        window._pendingCoinsGained = baseCoins;
        if (typeof updateShopBadge === 'function') updateShopBadge();
    }
    finishGameStats(expGained, usedDoubleExp);
}

function finishGameStats(expGained, usedDoubleExp) {
    const lvResult = levelManager.addExp(expGained);
    updateLevelDisplay();
    if (lvResult.leveledUp) showLevelUpToast(lvResult.newLevel);

    if (usedDoubleExp) {
        const msg = languageManager.getText('shopDoubleExpUsed') || '使用双倍经验卡';
        showSaveNotification(`🎫 ${msg} · +${expGained} EXP`);
    }

    const timeText = formatTime(elapsedTime);
    const sessionAchs = achievementManager.getSessionUnlocks();
    achievementManager.clearSessionUnlocks();

    showResultModal({
        mode: currentMode, challenge: currentChallenge,
        score, lines, timeText, levelResult: lvResult, achievements: sessionAchs,
        coinsGained: window._pendingCoinsGained || 0
    });
    window._pendingCoinsGained = 0;
}

function showResultModal(data) {
    const el = document.getElementById('resultModal');
    if (!el) return;
    const modeKey = data.challenge ? getChallengeName(data.challenge) : getModeName(data.mode);
    document.getElementById('resultModeName').textContent = modeKey;
    document.getElementById('resultScore').textContent = data.score.toLocaleString();
    document.getElementById('resultLines').textContent = data.lines;
    document.getElementById('resultTime').textContent = data.timeText;
    const coinsEl = document.getElementById('resultCoinsGained');
    if (coinsEl) coinsEl.textContent = `+${(data.coinsGained || 0).toLocaleString()}`;
    const lvInfo = data.levelResult || { gained: 0, oldLevel: levelManager.getLevel(), newLevel: levelManager.getLevel(), leveledUp: false };
    document.getElementById('resultExpGained').textContent = `+${lvInfo.gained} EXP`;
    const p = levelManager.getProgress();
    document.getElementById('resultLevelInfo').textContent = `${languageManager.getText('levelShort')}${p.level} · ${levelManager.getTitle()}`;
    const lvUp = document.getElementById('resultLevelUp');
    if (lvInfo.leveledUp) {
        lvUp.style.display = 'block';
        lvUp.textContent = `🎉 ${languageManager.getText('levelUp')} ${languageManager.getText('levelShort')}${lvInfo.newLevel}`;
    } else lvUp.style.display = 'none';
    const achSection = document.getElementById('resultAchSection');
    const achList = document.getElementById('resultAchList');
    const unlocked = data.achievements || [];
    if (unlocked.length > 0) {
        achSection.style.display = 'block';
        achList.innerHTML = unlocked.map(a => {
            const name = languageManager.getText(a.nameKey);
            const desc = languageManager.getText(a.descKey);
            return `<div class="result-ach-item"><div class="result-ach-icon">${a.icon}</div><div class="result-ach-info"><div class="result-ach-name">${name}</div><div class="result-ach-desc">${desc}</div></div></div>`;
        }).join('');
    } else achSection.style.display = 'none';
    gameOverlay.style.display = 'none';
    showPanel(el);
    if (enableBuiltinBGM && typeof bgmManager !== 'undefined' && bgmManager) {
        bgmManager.fadeOut(200);
        setTimeout(() => { bgmManager.play('result'); bgmManager.fadeIn(500); }, 250);
    }
}

function showLevelUpToast(newLevel) {
    const el = document.getElementById('levelUpToast');
    if (!el) return;
    if (el._animTimer) { clearTimeout(el._animTimer); el._animTimer = null; }
    if (el._hideTimer) { clearTimeout(el._hideTimer); el._hideTimer = null; }
    el.style.animation = 'none';
    el.style.display = 'none';
    void el.offsetWidth;
    const title = levelManager.getTitle();
    el.innerHTML = `<span>🎉 ${languageManager.getText('levelUp')} ${languageManager.getText('levelShort')}${newLevel} · ${title}</span>`;
    el.style.display = 'flex';
    el._animTimer = setTimeout(() => {
        el.style.animation = 'slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
        el._animTimer = null;
    }, 16);
    el._hideTimer = setTimeout(() => {
        el.style.display = 'none';
        el.style.animation = 'none';
        el._hideTimer = null;
    }, 3000);
}

function showImportingModal(total) {
    const el = document.getElementById('importingModal');
    if (!el) return;
    document.getElementById('importingText').textContent = languageManager.getText('musicImportingText');
    document.getElementById('importingProgressFill').style.width = '0%';
    document.getElementById('importingProgressText').textContent = `0 / ${total}`;
    showPanel(el);
}
function updateImportingProgress(current, total, extra) {
    const fill = document.getElementById('importingProgressFill');
    const text = document.getElementById('importingProgressText');
    if (fill) fill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
    if (text) {
        let s = `${current} / ${total}`;
        if (extra && extra.maxReached) {
            s += ` · ${languageManager.getText('musicMaxReached')}`;
        } else if (extra && extra.skipped) {
            s += ` · ${languageManager.getText('musicImportSkipped')}: ${extra.name || ''}`;
        }
        text.textContent = s;
    }
}
function hideImportingModal() {
    const el = document.getElementById('importingModal');
    if (el) hidePanel(el);
}

function showExportingModal(total) {
    const el = document.getElementById('exportingModal');
    if (!el) return;
    document.getElementById('exportingText').textContent = languageManager.getText('musicExportingText');
    document.getElementById('exportingProgressFill').style.width = '0%';
    document.getElementById('exportingProgressText').textContent = `0 / ${total}`;
    showPanel(el);
}
function updateExportingProgress(current, total, name) {
    const fill = document.getElementById('exportingProgressFill');
    const text = document.getElementById('exportingProgressText');
    if (fill) fill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
    if (text) {
        text.textContent = `${current} / ${total}`;
    }
}
function hideExportingModal() {
    const el = document.getElementById('exportingModal');
    if (el) hidePanel(el);
}

function locateCurrentTrack() {
    const idx = musicPlayer.currentIndex;
    if (idx < 0) return;

    const scrollAndFlash = (containerEl, selector) => {
        if (!containerEl) return;
        const el = containerEl.querySelector(`${selector}[data-index="${idx}"]`);
        if (!el) return;

        el.classList.remove('flash');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        let done = false;
        const triggerFlash = () => {
            if (done) return;
            done = true;
            containerEl.removeEventListener('scroll', onScroll);
            void el.offsetWidth;
            el.classList.add('flash');
            setTimeout(() => el.classList.remove('flash'), 1600);
        };
        let scrollEndTimer = null;
        const onScroll = () => {
            if (scrollEndTimer) clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(triggerFlash, 100);
        };
        containerEl.addEventListener('scroll', onScroll);
        setTimeout(triggerFlash, 800);
    };

    scrollAndFlash(musicPlaylistEl, '.music-track');
    scrollAndFlash(bgmListEl, '.bgm-track');
}

// ============================================================
// 商店购买确认弹窗
// ============================================================
let _pendingPurchaseId = null;

function showShopPurchaseConfirm(itemId) {
    const item = shopManager.getItem(itemId);
    if (!item) return;
    _pendingPurchaseId = itemId;

    const panel = document.getElementById('shopConfirmPanel');
    const iconEl = document.getElementById('shopConfirmIcon');
    const nameEl = document.getElementById('shopConfirmName');
    const descEl = document.getElementById('shopConfirmDesc');
    const priceEl = document.getElementById('shopConfirmPrice');
    const balanceEl = document.getElementById('shopConfirmBalance');
    const remainEl = document.getElementById('shopConfirmRemaining');

    iconEl.textContent = item.icon;
    nameEl.textContent = languageManager.getText(item.nameKey);
    descEl.textContent = languageManager.getText(item.descKey);
    priceEl.textContent = `${item.price.toLocaleString()} 💰`;
    balanceEl.textContent = `${shopManager.coins.toLocaleString()} 💰`;

    const remain = shopManager.coins - item.price;
    remainEl.textContent = `${remain.toLocaleString()} 💰`;
    remainEl.classList.toggle('red', remain < 0);
    remainEl.classList.toggle('green', remain >= 0);

    const okBtn = document.getElementById('shopConfirmOk');
    okBtn.disabled = remain < 0;

    showPanel(panel);
}

function hideShopPurchaseConfirm() {
    hidePanel(document.getElementById('shopConfirmPanel'));
    _pendingPurchaseId = null;
}

function initShopPurchaseConfirm() {
    const okBtn = document.getElementById('shopConfirmOk');
    const cancelBtn = document.getElementById('shopConfirmCancel');
    if (okBtn) okBtn.addEventListener('click', () => {
        const id = _pendingPurchaseId;
        hideShopPurchaseConfirm();
        if (id) handleBuy(id);
        audioSystem.playSound('click');
    });
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        hideShopPurchaseConfirm();
        audioSystem.playSound('click');
    });
}

// ============================================================
// 内置 BGM 开关
// ============================================================
function applyBGMEnabled() {
    if (typeof bgmManager === 'undefined' || !bgmManager) return;
    if (typeof bgmManager.setEnabled === 'function') {
        bgmManager.setEnabled(enableBuiltinBGM);
    }
    if (enableBuiltinBGM) {
        if (gameScreen.style.display !== 'none' && gameScreen.style.display !== '') {
            bgmManager.play('game');
        } else if (challengeMenu.style.display !== 'none' && challengeMenu.style.display !== '') {
            bgmManager.play('challenge_menu');
        } else {
            bgmManager.play('menu');
        }
    } else {
        if (typeof bgmManager.stop === 'function') bgmManager.stop();
    }
}

// ============================================================
// 初始化
// ============================================================
async function init() {
    languageManager.init();
    canvas = $('gameCanvas'); ctx = canvas.getContext('2d');
    nextCanvas = $('nextCanvas'); nextCtx = nextCanvas.getContext('2d');
    nextCanvas2 = $('nextCanvas2'); nextCtx2 = nextCanvas2.getContext('2d');
    nextCanvas3 = $('nextCanvas3'); nextCtx3 = nextCanvas3.getContext('2d');

    createBoard();
    currentPiece = createPiece();
    nextQueue = [createPiece(), createPiece(), createPiece()];
    nextPiece = nextQueue.shift();
    nextQueue.push(createPiece());

    // ★ 初始化画布尺寸（窗口自适应）—— 放到 piece 初始化之后
    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 200));

    updateNextPieceDisplay();

    bindEvents();

    // ★ 先让 UI 显示出来（同步操作，立刻生效，不用等异步初始化）
    updateSettingsButtonVisibility();
    updateUI();
    setGameState(GAME_STATE.WAITING);
    updatePauseButton();
    requestAnimationFrame(gameLoop);

    try { await audioSystem.init(); } catch (e) { console.warn('[init] audio failed:', e); }
    try { bgmManager.init(); } catch (e) { console.warn('[init] bgm failed:', e); }
    try { effectManager.init(document.querySelector('.game-board')); } catch (e) { console.warn('[init] effect failed:', e); }
    try { loadLeaderboardData(); } catch (e) { console.warn('[init] leaderboard failed:', e); }
    try { loadStatsData(); } catch (e) { console.warn('[init] stats failed:', e); }
    try { loadAccountData(); } catch (e) { console.warn('[init] account failed:', e); }
    try { levelManager.load(); } catch (e) { console.warn('[init] level failed:', e); }
    try { achievementManager.load(); } catch (e) { console.warn('[init] ach failed:', e); }
    try { dailyTaskManager.init(); } catch (e) { console.warn('[init] daily failed:', e); }
    try { updateTaskBadge(); } catch (e) { console.warn('[init] task badge failed:', e); }
    try { setInterval(updateTaskBadge, 30000); } catch (e) {}
    try { await initMusicPlayer(); } catch (e) { console.warn('[init] music failed:', e); }
    try { updateStatsDisplay(); } catch (e) { console.warn('[init] stats display failed:', e); }
    try { updateAccountDisplay(); } catch (e) { console.warn('[init] account display failed:', e); }
    try { updateLevelDisplay(); } catch (e) { console.warn('[init] level display failed:', e); }
    try { loadSettings(); } catch (e) { console.warn('[init] settings failed:', e); }
    try { initVersionList(); } catch (e) { console.warn('[init] version failed:', e); }
    try { initCustomModal(); } catch (e) { console.warn('[init] custom modal failed:', e); }
    try { initCustomTimeModal(); } catch (e) { console.warn('[init] time modal failed:', e); }
    try { initSaveDataPanel(); } catch (e) { console.warn('[init] savedata failed:', e); }
    try { initShop(); } catch (e) { console.warn('[init] shop failed:', e); }
    try { initShopPurchaseConfirm(); } catch (e) { console.warn('[init] shop confirm failed:', e); }
    try { if (typeof initCheckin === 'function') initCheckin(); } catch (e) { console.warn('[init] checkin failed:', e); }
    try { if (typeof initMonthlyCard === 'function') initMonthlyCard(); } catch (e) { console.warn('[init] monthlycard failed:', e); }
    try { if (typeof initBattlePass === 'function') initBattlePass(); } catch (e) { console.warn('[init] battlepass failed:', e); }
    
    languageManager.onLanguageChange(() => {
        try { updateNextPieceDisplay(); } catch (e) {}
        try { setGameState(gameState); } catch (e) {}
        try { if (currentChallenge === CHALLENGE_TYPES.MARATHON) updateMarathonDisplay(); } catch (e) {}
        try { updateStatsDisplay(); } catch (e) {}
        try { updateAccountDisplay(); } catch (e) {}
        try { updateLevelDisplay(); } catch (e) {}
        try { if (typeof renderAchievements === 'function') renderAchievements(); } catch (e) {}
        try { if (typeof renderMusicPlaylist === 'function') renderMusicPlaylist(); } catch (e) {}
        try { if (typeof updateMusicPlayerUI === 'function') updateMusicPlayerUI(); } catch (e) {}
        try { if (typeof renderBgmPanel === 'function') renderBgmPanel(); } catch (e) {}
        try { if (typeof updateBgmPanelUI === 'function') updateBgmPanelUI(); } catch (e) {}
        try { if (typeof updateGameMusicBtn === 'function') updateGameMusicBtn(); } catch (e) {}
        try { if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) dailyTaskManager.render(); } catch (e) {}
        try { if (typeof renderBattlePassPanel === 'function' && typeof battlePassPanel !== 'undefined' && battlePassPanel && battlePassPanel.style.display !== 'none') renderBattlePassPanel(); } catch (e) {}
    });
    setTimeout(() => {
        if (enableBuiltinBGM) {
            try { bgmManager.play('menu'); } catch (e) {}
        }
    }, 500);
    if (!hasAccount()) setTimeout(() => showAccountCreateModal(), 800);
}

function bindEvents() {
    document.addEventListener('keydown', handleKeyPress);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
    backBtn.addEventListener('click', handleBackButton);
    backToMainBtn.addEventListener('click', showMainMenu);
    settingsBtn.addEventListener('click', () => showPanel(settingsPanel));
    closeSettingsBtn.addEventListener('click', () => hidePanel(settingsPanel));
    previewToggle.addEventListener('change', function() { showPreview = this.checked; saveSettings(); });
    heightlineToggle.addEventListener('change', function() { showHeightLine = this.checked; saveSettings(); });
    extraPreviewToggle.addEventListener('change', function() {
        if (!shopManager.isOwned('unlock_extra_preview') && this.checked) {
            this.checked = false;
            showSaveNotification('🔒 ' + (languageManager.getText('shopUnlockRequired') || '需要先在商店解锁此功能'), true);
            return;
        }
        showExtraPreview = this.checked;
        saveSettings();
        updateNextPieceDisplay();
    });
    if (bgmEnableToggle) {
        bgmEnableToggle.addEventListener('change', function() {
            enableBuiltinBGM = this.checked;
            saveSettings();
            applyBGMEnabled();
            audioSystem.playSound('click');
        });
    }
    const saveSettingsDebounced = debounce(saveSettings, 300);
    musicVolumeSlider.addEventListener('input', function() {
        musicVolume = +this.value;
        musicVolumeValue.textContent = `${musicVolume}%`;
        if (typeof bgmManager !== 'undefined' && bgmManager) bgmManager.setVolume(musicVolume / 100);
        if (typeof musicPlayer !== 'undefined') musicPlayer.setVolume(musicVolume / 100);
        updateSliderFill(this);
        saveSettingsDebounced();
    });
    soundVolumeSlider.addEventListener('input', function() {
        soundVolume = +this.value;
        soundVolumeValue.textContent = `${soundVolume}%`;
        audioSystem.setSoundVolume(soundVolume);
        updateSliderFill(this);
        saveSettingsDebounced();
    });
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const panelName = this.getAttribute('data-panel');
            document.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = document.querySelector(`.settings-panel[data-panel="${panelName}"]`);
            if (targetPanel) targetPanel.classList.add('active');
            if (panelName === 'stats') updateStatsDisplay();
            if (panelName === 'account') updateAccountDisplay();
            if (panelName === 'music') { renderMusicPlaylist(); updateMusicPlayerUI(); }
            if (panelName === 'savedata') refreshSaveDataPanel();
            audioSystem.playSound('click');
        });
    });
    leaderboardBtn.addEventListener('click', () => { showPanel(leaderboardPanel); updateLeaderboardDisplay(); audioSystem.playSound('click'); });
    achievementsBtn.addEventListener('click', () => { showPanel(achievementPanel); renderAchievements(); audioSystem.playSound('click'); });
    updatesBtn.addEventListener('click', () => { showPanel(updateNotice); showVersionDetail(getVersionList()[currentVersionIndex] || getVersionList()[0]); audioSystem.playSound('click'); });
    closeLeaderboardBtn.addEventListener('click', () => { hidePanel(leaderboardPanel); audioSystem.playSound('click'); });
    closeNoticeBtn.addEventListener('click', () => { hidePanel(updateNotice); audioSystem.playSound('click'); });
    if (closeAchievementsBtn) closeAchievementsBtn.addEventListener('click', () => { hidePanel(achievementPanel); audioSystem.playSound('click'); });
    if (closeBgmBtn) closeBgmBtn.addEventListener('click', () => { hidePanel(bgmPanel); audioSystem.playSound('click'); });
    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', function() { switchLeaderboardTab(this.getAttribute('data-mode')); audioSystem.playSound('click'); });
    });
    clearScoresBtn.addEventListener('click', () => { showClearLeaderboardConfirm(); audioSystem.playSound('click'); });
    if (accountSaveBtn) {
        let _accountSaveLock = false;
        const doSaveAccount = () => {
            if (_accountSaveLock) return;
            _accountSaveLock = true;
            setTimeout(() => { _accountSaveLock = false; }, 500);
            const name = accountNameInput.value.trim();
            if (!name) { showSaveNotification('❌ ' + languageManager.getText('accountInvalidName'), true); return; }
            if (changeAccountName(name)) { updateAccountDisplay(); showSaveNotification(`✅ ${languageManager.getText('accountUpdated')}`); audioSystem.playSound('click'); }
        };
        accountSaveBtn.addEventListener('click', doSaveAccount);
        accountNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSaveAccount(); });
    }

    const resultRestartBtn = document.getElementById('resultRestartBtn');
    const resultBackBtn = document.getElementById('resultBackBtn');
    if (resultRestartBtn) {
        resultRestartBtn.addEventListener('click', () => {
            hidePanel(document.getElementById('resultModal'));
            if (enableBuiltinBGM) {
                bgmManager.fadeOut(200);
                setTimeout(() => { bgmManager.play('game'); bgmManager.fadeIn(500); }, 250);
            }
            resetGame();
            startCountdown();
            audioSystem.playSound('click');
        });
    }
    if (resultBackBtn) {
        resultBackBtn.addEventListener('click', () => {
            hidePanel(document.getElementById('resultModal'));
            handleBackButton();
            audioSystem.playSound('click');
        });
    }

    menuCards.forEach(card => {
        if (card.id !== 'challengeMenuCard') {
            card.addEventListener('click', function() {
                const mode = this.getAttribute('data-mode');
                if (mode === 'challenge') showChallengeMenu();
                else { cameFromChallengeMenu = false; startGameMode(mode); }
                audioSystem.playSound('click');
            });
        }
    });
    challengeMenuCard.addEventListener('click', () => { showChallengeMenu(); audioSystem.playSound('click'); });
    challengeCards.forEach(card => {
        card.addEventListener('click', function() {
            const type = this.getAttribute('data-challenge');
            if (type === 'invisible-group') { showPanel(invisibleChoiceModal); audioSystem.playSound('click'); }
            else if (type === 'timed-group') { timeElapsedItem.style.display = 'none'; showPanel(timedChoiceModal); audioSystem.playSound('click'); }
            else if (type === 'survival') { showCustomSurvivalModal(); audioSystem.playSound('click'); }
            else if (type === 'speed') { showSpeedSetupModal(); audioSystem.playSound('click'); }
            else { cameFromChallengeMenu = true; startChallengeMode(type); audioSystem.playSound('click'); }
        });
    });
    document.querySelectorAll('.invisible-choice-btn[data-invisible-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-invisible-type');
            hidePanel(invisibleChoiceModal);
            cameFromChallengeMenu = true;
            startChallengeMode(type);
            audioSystem.playSound('click');
        });
    });
    if (invisibleChoiceCancel) {
        invisibleChoiceCancel.addEventListener('click', () => {
            hidePanel(invisibleChoiceModal); showChallengeMenu(); audioSystem.playSound('click');
        });
    }
    document.querySelectorAll('#timedChoiceModal [data-timed-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-timed-type');
            hidePanel(timedChoiceModal);
            showCustomTimeModal(type);
            audioSystem.playSound('click');
        });
    });
    if (timedChoiceCancel) {
        timedChoiceCancel.addEventListener('click', () => {
            hidePanel(timedChoiceModal); showChallengeMenu(); audioSystem.playSound('click');
        });
    }
    const musicSearchInput = document.getElementById('musicSearchInput');
    const bgmSearchInput = document.getElementById('bgmSearchInput');
    if (musicSearchInput) {
        musicSearchInput.addEventListener('input', function() {
            musicSearchQuery = this.value;
            renderMusicPlaylist();
        });
    }
    if (bgmSearchInput) {
        bgmSearchInput.addEventListener('input', function() {
            bgmSearchQuery = this.value;
            renderBgmPanel();
        });
    }
    const musicLocateBtn = document.getElementById('musicLocateBtn');
    const bgmLocateBtn = document.getElementById('bgmLocateBtn');
    if (musicLocateBtn) {
        musicLocateBtn.addEventListener('click', () => { locateCurrentTrack(); audioSystem.playSound('click'); });
    }
    if (bgmLocateBtn) {
        bgmLocateBtn.addEventListener('click', () => { locateCurrentTrack(); audioSystem.playSound('click'); });
    }
    if (gameMusicBtn) {
        gameMusicBtn.addEventListener('click', () => {
            showPanel(bgmPanel);
            renderBgmPanel();
            updateBgmPanelUI();
            audioSystem.playSound('click');
        });
    }
    if (bgmPlayBtn) bgmPlayBtn.addEventListener('click', () => { musicPlayer.togglePlay(); });
    if (bgmProgress) {
        bgmProgress.addEventListener('input', () => {
            musicPlayer._seekDragging = true;
            const dur = musicPlayer.audio.duration || 0;
            const val = parseFloat(bgmProgress.value);
            if (dur > 0) bgmCurTime.textContent = formatDuration(val / 100 * dur);
            updateSliderFill(bgmProgress);
        });
        bgmProgress.addEventListener('change', () => {
            const dur = musicPlayer.audio.duration || 0;
            const val = parseFloat(bgmProgress.value);
            if (dur > 0) musicPlayer.seekTo(val / 100 * dur);
            musicPlayer._seekDragging = false;
        });
    }
}

function loadSettings() {
    const saved = localStorage.getItem('tetrisSettings');
    if (!saved) {
        if (typeof shopManager !== 'undefined' && !shopManager.isOwned('unlock_extra_preview')) {
            showExtraPreview = false;
            extraPreviewToggle.checked = false;
        }
        if (bgmEnableToggle) bgmEnableToggle.checked = enableBuiltinBGM;
        updateSliderFill(musicVolumeSlider);
        updateSliderFill(soundVolumeSlider);
        applyBGMEnabled();
        return;
    }
    try {
        const s = JSON.parse(saved);
        showPreview = s.showPreview !== undefined ? s.showPreview : true;
        showHeightLine = s.showHeightLine !== undefined ? s.showHeightLine : true;
        showExtraPreview = s.showExtraPreview !== undefined ? s.showExtraPreview : false;
        if (typeof shopManager !== 'undefined' && !shopManager.isOwned('unlock_extra_preview')) {
            showExtraPreview = false;
        }
        enableBuiltinBGM = s.enableBuiltinBGM !== undefined ? s.enableBuiltinBGM : true;
        if (bgmEnableToggle) bgmEnableToggle.checked = enableBuiltinBGM;
        musicVolume = s.musicVolume !== undefined ? s.musicVolume : 70;
        soundVolume = s.soundVolume !== undefined ? s.soundVolume : 80;
        previewToggle.checked = showPreview;
        heightlineToggle.checked = showHeightLine;
        extraPreviewToggle.checked = showExtraPreview;
        musicVolumeSlider.value = musicVolume;
        soundVolumeSlider.value = soundVolume;
        musicVolumeValue.textContent = `${musicVolume}%`;
        soundVolumeValue.textContent = `${soundVolume}%`;
        audioSystem.setSoundVolume(soundVolume);
        if (typeof bgmManager !== 'undefined' && bgmManager) bgmManager.setVolume(musicVolume / 100);
        if (typeof musicPlayer !== 'undefined') musicPlayer.setVolume(musicVolume / 100);
        updateSliderFill(musicVolumeSlider);
        updateSliderFill(soundVolumeSlider);
        applyBGMEnabled();
    } catch (e) {}
}
function saveSettings() {
    try {
        localStorage.setItem('tetrisSettings', JSON.stringify({
            showPreview, showHeightLine, showExtraPreview,
            musicVolume, soundVolume,
            enableBuiltinBGM
        }));
        return true;
    } catch (e) { return false; }
}
function updateSettingsButtonVisibility() {
    const isMainMenu = mainMenu.style.display !== 'none';
    settingsBtn.style.display = isMainMenu ? 'flex' : 'none';
    leaderboardBtn.style.display = isMainMenu ? 'flex' : 'none';
    achievementsBtn.style.display = isMainMenu ? 'flex' : 'none';
    updatesBtn.style.display = isMainMenu ? 'flex' : 'none';
    const dailyBtn = document.getElementById('dailyTasksBtn');
    if (dailyBtn) dailyBtn.style.display = isMainMenu ? 'flex' : 'none';
    const shopBtn = document.getElementById('shopBtnCorner');
    if (shopBtn) shopBtn.style.display = isMainMenu ? 'flex' : 'none';
    const battlePassBtn = document.getElementById('battlePassBtn');
    if (battlePassBtn) battlePassBtn.style.display = isMainMenu ? 'flex' : 'none';
    const checkinBtn = document.getElementById('checkinBtnTop');
    if (checkinBtn) checkinBtn.style.display = isMainMenu ? 'flex' : 'none';
    const monthlyCardBtn = document.getElementById('monthlyCardBtn');
    if (monthlyCardBtn) monthlyCardBtn.style.display = isMainMenu ? 'flex' : 'none';
    if (typeof updateShopBadge === 'function') updateShopBadge();
    if (typeof updateTaskBadge === 'function') updateTaskBadge();
    if (typeof updateCheckinBadge === 'function') updateCheckinBadge();
    if (typeof updateMonthlyCardBadge === 'function') updateMonthlyCardBadge();
    if (typeof updateBattlePassBadge === 'function') updateBattlePassBadge();
}
function updateGameMusicBtn() {
    if (!gameMusicBtn) return;
    const icon = document.getElementById('gameMusicIcon');
    if (musicPlayer.tracks.length === 0) {
        gameMusicBtn.disabled = true;
        gameMusicBtn.classList.remove('playing');
        if (icon) icon.textContent = '🎵';
        return;
    }
    gameMusicBtn.disabled = false;
    if (musicPlayer.isPlaying) {
        gameMusicBtn.classList.add('playing');
        if (icon) icon.textContent = '⏸';
    } else {
        gameMusicBtn.classList.remove('playing');
        if (icon) icon.textContent = '🎵';
    }
}

function updateShopBadge() {
    const btn = document.getElementById('shopBtnCorner');
    if (!btn) return;
    if (shopManager.hasAffordable()) {
        btn.classList.add('has-affordable');
    } else {
        btn.classList.remove('has-affordable');
    }
}

function updateTaskBadge() {
    const btn = document.getElementById('dailyTasksBtn');
    if (!btn) return;
    let hasClaimable = false;
    try {
        if (typeof taskSystem !== 'undefined') {
            hasClaimable = taskSystem.hasClaimable();
        }
    } catch (e) {}
    btn.classList.toggle('has-notification', hasClaimable);
}

function showChallengeMenu() {
    mainMenu.style.display = 'none';
    challengeMenu.style.display = 'block';
    gameScreen.style.display = 'none';
    cameFromChallengeMenu = false;
    if (enableBuiltinBGM) {
        bgmManager.fadeOut(300);
        setTimeout(() => { bgmManager.play('challenge_menu'); bgmManager.fadeIn(500); }, 350);
    }
    updateSettingsButtonVisibility();
    backToMainBtn.style.display = 'flex';
}
function showMainMenu() {
    cameFromChallengeMenu = false;
    loadSettings();
    mainMenu.style.display = 'flex';
    challengeMenu.style.display = 'none';
    gameScreen.style.display = 'none';
    if (enableBuiltinBGM) {
        bgmManager.fadeOut(300);
        setTimeout(() => { bgmManager.play('menu'); bgmManager.fadeIn(500); }, 350);
    }
    resetGame();
    updateSettingsButtonVisibility();
    backToMainBtn.style.display = 'none';
    if (typeof updateShopBadge === 'function') updateShopBadge();
    if (typeof updateTaskBadge === 'function') updateTaskBadge();
}

function startGameMode(mode) {
    currentMode = mode;
    currentChallenge = null;
    loadSettings();
    resetChallengeUI();
    backToMainBtn.style.display = 'none';
    if (mode === 'classic') gameModeTitle.textContent = languageManager.getText('classicTetris');
    else if (mode === 'endless') gameModeTitle.textContent = languageManager.getText('endlessMode');
    timeElapsedItem.style.display = 'flex';
    mainMenu.style.display = 'none';
    challengeMenu.style.display = 'none';
    gameScreen.style.display = 'block';
    if (enableBuiltinBGM) {
        bgmManager.fadeOut(300);
        setTimeout(() => { bgmManager.play('game'); bgmManager.fadeIn(500); }, 350);
    }
    resetGame();
    updateSettingsButtonVisibility();
    updateGameMusicBtn();
}

function startChallengeMode(type) {
    currentMode = GAME_MODES.CHALLENGE;
    currentChallenge = type;
    resetChallengeUI();
    backToMainBtn.style.display = 'none';
    timeElapsedItem.style.display = 'none';
    switch (type) {
        case CHALLENGE_TYPES.TIMED:
            gameModeTitle.textContent = languageManager.getText('timedChallenge');
            timerContainer.style.display = 'flex';
            timeLimit = 180;
            break;
        case CHALLENGE_TYPES.INVISIBLE:
            gameModeTitle.textContent = languageManager.getText('invisibleMode');
            invisibleMask.style.display = 'block';
            invisibleDivider.style.display = 'block';
            timeElapsedItem.style.display = 'flex';
            timeLimit = 0;
            showPreview = false; showHeightLine = false;
            previewToggle.checked = false; heightlineToggle.checked = false;
            break;
        case CHALLENGE_TYPES.INVISIBLE2:
            gameModeTitle.textContent = languageManager.getText('invisible2Mode');
            timeElapsedItem.style.display = 'flex';
            timeLimit = 0;
            showPreview = false; showHeightLine = false;
            previewToggle.checked = false; heightlineToggle.checked = false;
            break;
        case CHALLENGE_TYPES.SPRINT:
            gameModeTitle.textContent = languageManager.getText('sprint40');
            sprintProgressContainer.style.display = 'block';
            timeElapsedItem.style.display = 'flex';
            timeLimit = 0;
            break;
        case CHALLENGE_TYPES.SURVIVAL:
            gameModeTitle.textContent = languageManager.getText('survivalMode');
            survivalTimerContainer.style.display = 'flex';
            timeElapsedItem.style.display = 'flex';
            timeLimit = 0;
            survivalTimer = customSurvivalInterval;
            survivalTimerValue.textContent = `${customSurvivalInterval}${languageManager.getText('seconds')}`;
            break;
        case CHALLENGE_TYPES.MARATHON:
            gameModeTitle.textContent = languageManager.getText('marathonMode');
            marathonProgressContainer.style.display = 'block';
            marathonTimerContainer.style.display = 'flex';
            timeLimit = 0;
            marathonTarget = 10; marathonLinesCleared = 0;
            marathonIncreaseTimer = 75; marathonCheckTimer = 60;
            marathonStage = 1; marathonFailed = false; marathonCheckFailed = false;
            updateMarathonDisplay();
            break;
        case CHALLENGE_TYPES.TIMED_SCORE:
            gameModeTitle.textContent = languageManager.getText('timedScoreMode');
            timerContainer.style.display = 'flex';
            timeLimit = customInitialTime;
            timedScoreTime = customInitialTime;
            timerValue.textContent = formatTime(customInitialTime);
            timerValue.classList.remove('timer-warning');
            break;
        case CHALLENGE_TYPES.COUNTDOWN_SURVIVAL:
            gameModeTitle.textContent = languageManager.getText('countdownSurvivalMode');
            timerContainer.style.display = 'flex';
            timeLimit = customInitialTime;
            countdownTime = customInitialTime;
            timerValue.textContent = formatTime(customInitialTime);
            timerValue.classList.remove('timer-warning');
            break;
        case CHALLENGE_TYPES.TIMED_LINES:
            gameModeTitle.textContent = languageManager.getText('timedLinesMode');
            timerContainer.style.display = 'flex';
            sprintProgressContainer.style.display = 'block';
            timeLimit = customInitialTime;
            timedLinesTime = customInitialTime;
            timedLinesCleared = 0;
            sprintLinesLeft.textContent = customTargetLines;
            sprintProgressFill.style.width = '0%';
            timerValue.textContent = formatTime(customInitialTime);
            timerValue.classList.remove('timer-warning');
            break;
        case CHALLENGE_TYPES.SPEED:
            gameModeTitle.textContent = languageManager.getText('speedChallengeMode');
            speedTimeoutItem.style.display = 'flex';
            speedBlockTimerContainer.style.display = 'flex';
            timeElapsedItem.style.display = 'flex';
            timeLimit = 0;
            speedTimeouts = 0;
            speedTimeoutCount.textContent = `0 / ${speedMaxTimeouts}`;
            speedTimeoutCount.classList.remove('warning');
            speedBlockTimer = speedTimeLimit;
            speedBlockTimerValue.textContent = speedTimeLimit.toFixed(1) + 's';
            speedBlockTimerValue.classList.remove('timer-warning');
            break;
    }
    challengeMenu.style.display = 'none';
    gameScreen.style.display = 'block';
    if (enableBuiltinBGM) {
        bgmManager.fadeOut(300);
        setTimeout(() => { bgmManager.play('game'); bgmManager.fadeIn(500); }, 350);
    }
    resetGame();
    updateSettingsButtonVisibility();
    updateGameMusicBtn();
}

function resetChallengeUI() {
    timerContainer.style.display = 'none';
    invisibleMask.style.display = 'none';
    invisibleDivider.style.display = 'none';
    sprintProgressContainer.style.display = 'none';
    marathonProgressContainer.style.display = 'none';
    survivalTimerContainer.style.display = 'none';
    marathonTimerContainer.style.display = 'none';
    timeElapsedItem.style.display = 'none';
    speedTimeoutItem.style.display = 'none';
    speedBlockTimerContainer.style.display = 'none';
}

function createBoard() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
function createPiece() {
    const id = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[id];
    const piece = { shape, color: COLORS[id], id: id + 1, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0, _counted: false, _timedOut: false };
    return piece;
}
function drawBoard() {
    ctx.fillStyle = '#0f1123';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    const gridEndY = currentChallenge === CHALLENGE_TYPES.INVISIBLE ? (ROWS - invisibleRows) * BLOCK_SIZE : canvas.height;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, gridEndY); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) {
        if (currentChallenge === CHALLENGE_TYPES.INVISIBLE && y > ROWS - invisibleRows) continue;
        ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(canvas.width, y * BLOCK_SIZE); ctx.stroke();
    }
    for (let y = 0; y < ROWS; y++) {
        if (currentChallenge === CHALLENGE_TYPES.INVISIBLE && y > ROWS - invisibleRows) continue;
        if (currentChallenge === CHALLENGE_TYPES.INVISIBLE2) continue;
        for (let x = 0; x < COLS; x++) if (board[y][x]) drawBlock(ctx, x, y, COLORS[board[y][x] - 1]);
    }
    if (showPreview && currentPiece && gameStarted && !isPaused && !gameOver) {
        if (currentChallenge !== CHALLENGE_TYPES.INVISIBLE && currentChallenge !== CHALLENGE_TYPES.INVISIBLE2) {
            const preview = { ...currentPiece };
            while (!collision(preview, board, 0, 1)) preview.y++;
            for (let y = 0; y < preview.shape.length; y++)
                for (let x = 0; x < preview.shape[y].length; x++)
                    if (preview.shape[y][x]) drawPreviewBlock(ctx, preview.x + x, preview.y + y, preview.color);
        }
    }
    if (showHeightLine && gameStarted && !isPaused && !gameOver) {
        if (currentChallenge !== CHALLENGE_TYPES.INVISIBLE && currentChallenge !== CHALLENGE_TYPES.INVISIBLE2) {
            let topRow = -1;
            for (let y = 0; y < ROWS; y++) if (board[y].some(c => c !== 0)) { topRow = y; break; }
            if (topRow !== -1 && (ROWS - topRow) >= 2) drawHeightIndicatorLine(topRow, ROWS - topRow);
        }
    }
    if (currentChallenge === CHALLENGE_TYPES.INVISIBLE) {
        for (let y = 0; y < currentPiece.shape.length; y++)
            for (let x = 0; x < currentPiece.shape[y].length; x++)
                if (currentPiece.shape[y][x]) {
                    const by = currentPiece.y + y;
                    if (by <= ROWS - invisibleRows) drawBlock(ctx, currentPiece.x + x, by, currentPiece.color);
                }
    } else if (currentPiece) drawPiece(currentPiece);
    if (currentChallenge === CHALLENGE_TYPES.INVISIBLE) {
        const splitY = (ROWS - invisibleRows) * BLOCK_SIZE;
        invisibleDivider.style.top = `${splitY}px`;
        ctx.save();
        ctx.strokeStyle = '#9C27B0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, splitY); ctx.lineTo(canvas.width, splitY); ctx.stroke();
        ctx.restore();
    }
}
function drawPreviewBlock(c, x, y, color) {
    c.strokeStyle = color; c.lineWidth = 1.5; c.setLineDash([3, 3]);
    c.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    c.setLineDash([]);
}
function drawHeightIndicatorLine(lineY, stackHeight) {
    ctx.save();
    ctx.strokeStyle = '#2196F3'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(0, lineY * BLOCK_SIZE); ctx.lineTo(canvas.width, lineY * BLOCK_SIZE); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    ctx.save();
    ctx.fillStyle = '#2196F3'; ctx.font = '12px Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${languageManager.getText('heightIndicator')} ${stackHeight} ${languageManager.getText('rows')}`, 5, lineY * BLOCK_SIZE + 15);
    ctx.restore();
}
function drawPiece(piece) {
    for (let y = 0; y < piece.shape.length; y++)
        for (let x = 0; x < piece.shape[y].length; x++)
            if (piece.shape[y][x]) drawBlock(ctx, piece.x + x, piece.y + y, piece.color);
}
function drawBlock(c, x, y, color) {
    c.fillStyle = color;
    c.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    c.strokeStyle = '#fff'; c.lineWidth = 1;
    c.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, 8);
    c.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, 8, BLOCK_SIZE - 4);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + BLOCK_SIZE - 4, BLOCK_SIZE - 8, 4);
    c.fillRect(x * BLOCK_SIZE + BLOCK_SIZE - 4, y * BLOCK_SIZE + 8, 4, BLOCK_SIZE - 8);
}

// ============================================================
// 窗口自适应：根据可用空间动态缩放画布
// ============================================================
function resizeCanvas() {
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // 设计尺寸（游戏横排布局的原始大小）
    const DESIGN_W = 820;
    const DESIGN_H = 700;

    // 计算缩放比
    const scaleW = (window.innerWidth - 20) / DESIGN_W;
    const scaleH = (window.innerHeight - 80) / DESIGN_H;
    let scale = Math.min(scaleW, scaleH);
    scale = Math.max(scale, 0.35);
    scale = Math.min(scale, 1.4);

    // 应用缩放到包裹层
    const wrap = document.getElementById('gameScaleWrap');
    if (wrap) {
        wrap.style.transform = `scale(${scale})`;
        const origH = wrap.scrollHeight || DESIGN_H;
        const extra = origH * (1 - scale);
        wrap.style.marginBottom = extra > 0 ? `-${extra}px` : '0';
    }

    // 画布固定 300×600，靠 scale 缩放
    const baseW = 300;
    const baseH = 600;
    canvas.style.width = baseW + 'px';
    canvas.style.height = baseH + 'px';
    canvas.width = Math.round(baseW * dpr);
    canvas.height = Math.round(baseH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    BLOCK_SIZE = baseW / COLS;

    // nextCanvas 固定尺寸
    if (nextCanvas && nextCtx) {
        const s = 120;
        nextCanvas.style.width = s + 'px';
        nextCanvas.style.height = s + 'px';
        nextCanvas.width = Math.round(s * dpr);
        nextCanvas.height = Math.round(s * dpr);
        nextCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (nextCanvas2 && nextCtx2) {
        const s = 100;
        nextCanvas2.style.width = s + 'px';
        nextCanvas2.style.height = s + 'px';
        nextCanvas2.width = Math.round(s * dpr);
        nextCanvas2.height = Math.round(s * dpr);
        nextCtx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (nextCanvas3 && nextCtx3) {
        const s = 100;
        nextCanvas3.style.width = s + 'px';
        nextCanvas3.style.height = s + 'px';
        nextCanvas3.width = Math.round(s * dpr);
        nextCanvas3.height = Math.round(s * dpr);
        nextCtx3.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // 清掉之前给侧边栏设的内联尺寸
    const gameInfo = document.querySelector('.game-info');
    if (gameInfo) { gameInfo.style.width = ''; gameInfo.style.height = ''; }
    const nextContainer = document.querySelector('.next-piece-container');
    if (nextContainer) { nextContainer.style.minWidth = ''; }

    // 重绘
    if (typeof drawBoard === 'function') drawBoard();
    if (typeof drawNextPiece === 'function') drawNextPiece();
}

function drawPieceOnCanvas(context, canvasEl, piece, blockSize) {
    // 用 CSS 显示尺寸计算（因为 canvas.width 是 ×DPR 的像素数）
    const cssW = parseFloat(canvasEl.style.width) || canvasEl.width;
    const cssH = parseFloat(canvasEl.style.height) || canvasEl.height;

    context.fillStyle = '#0f1123';
    context.fillRect(0, 0, cssW, cssH);
    if (!piece) return;

    const offX = (cssW / blockSize - piece.shape[0].length) / 2;
    const offY = (cssH / blockSize - piece.shape.length) / 2;
    for (let y = 0; y < piece.shape.length; y++)
        for (let x = 0; x < piece.shape[y].length; x++)
            if (piece.shape[y][x]) {
                context.fillStyle = piece.color;
                context.fillRect((offX + x) * blockSize, (offY + y) * blockSize, blockSize, blockSize);
                context.strokeStyle = '#fff'; context.lineWidth = 1;
                context.strokeRect((offX + x) * blockSize, (offY + y) * blockSize, blockSize, blockSize);
                context.fillStyle = 'rgba(255,255,255,0.2)';
                context.fillRect((offX + x) * blockSize + 2, (offY + y) * blockSize + 2, blockSize - 4, 6);
                context.fillRect((offX + x) * blockSize + 2, (offY + y) * blockSize + 2, 6, blockSize - 4);
            }
}
function drawNextPiece() {
    drawPieceOnCanvas(nextCtx, nextCanvas, nextPiece, BLOCK_SIZE);
    if (showExtraPreview) {
        drawPieceOnCanvas(nextCtx2, nextCanvas2, nextQueue[0], BLOCK_SIZE);
        drawPieceOnCanvas(nextCtx3, nextCanvas3, nextQueue[1], BLOCK_SIZE);
    }
}
function collision(piece, b, dx = 0, dy = 0) {
    for (let y = 0; y < piece.shape.length; y++)
        for (let x = 0; x < piece.shape[y].length; x++)
            if (piece.shape[y][x]) {
                const nx = piece.x + x + dx, ny = piece.y + y + dy;
                if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && b[ny] && b[ny][nx])) return true;
            }
    return false;
}
function rotatePiece(piece) {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const orig = piece.shape;
    piece.shape = rotated;
    if (collision(piece, board)) { piece.shape = orig; return false; }
    if (typeof achievementManager !== 'undefined') {
        achievementManager.addProgress('rotate_count', 1);
        achievementManager.checkSimple();
    }
    if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) {
        dailyTaskManager.onProgress({ rotateInc: 1 });
    }
    return true;
}
function movePiece(dx, dy) {
    if (!collision(currentPiece, board, dx, dy)) {
        currentPiece.x += dx; currentPiece.y += dy;
        if (dx !== 0) audioSystem.playSound('move');
        else if (dy > 0) audioSystem.playSound('drop');
        return true;
    }
    if (dy > 0) lockPiece();
    return false;
}
function lockPiece() {
    if (!currentPiece._counted) {
        const idx = currentPiece.id - 1;
        if (idx >= 0 && idx < 7) statsData.pieces[idx] = (statsData.pieces[idx] || 0) + 1;
        currentPiece._counted = true;
    }
    for (let y = 0; y < currentPiece.shape.length; y++)
        for (let x = 0; x < currentPiece.shape[y].length; x++)
            if (currentPiece.shape[y][x]) {
                const by = currentPiece.y + y;
                if (by >= 0) {
                    board[by][currentPiece.x + x] = currentPiece.id;
                    if (currentChallenge === CHALLENGE_TYPES.INVISIBLE && by < ROWS - invisibleRows) { invisibleModeFail(); return; }
                }
            }
    if (currentPiece.y <= 0) {
        endGame(); return;
    }
    clearLines();
    currentPiece = nextPiece;
    currentPiece._counted = false;
    currentPiece._timedOut = false;
    nextPiece = nextQueue.shift();
    nextQueue.push(createPiece());
    updateNextPieceDisplay();
    if (currentChallenge === CHALLENGE_TYPES.SPEED && gameStarted && !gameOver) {
        speedBlockTimer = speedTimeLimit;
        speedBlockTimedOut = false;
        speedBlockTimerValue.textContent = speedTimeLimit.toFixed(1) + 's';
        speedBlockTimerValue.classList.remove('timer-warning');
    }
    if (collision(currentPiece, board)) {
        endGame();
    }
}
function invisibleModeFail() {
    gameOver = true; gameStarted = false;
    stopTimer(); stopMarathonTimer(); stopNewModeTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    startPrompt.innerHTML = `<h2>${languageManager.getText('invisibleMode')} ${languageManager.getText('failed')}</h2><p>${languageManager.getText('blockExceededLine10')}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function speedFail() {
    gameOver = true; gameStarted = false;
    stopTimer(); stopElapsedTimer(); stopSpeedTimer(); stopNewModeTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    startPrompt.innerHTML = `<h2>${languageManager.getText('speedFailed')}</h2><p>${languageManager.getText('timeUsed')}${formatTime(elapsedTime)}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(c => c !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++; y++;
            effectManager.createClearParticles(5, y, '#ff9966');
        }
    }
    if (linesCleared === 0) { currentCombo = 0; return; }
    if (linesCleared === 4) currentTetrisCount++;
    currentCombo++;
    if (currentCombo > maxComboThisGame) maxComboThisGame = currentCombo;
    if (currentCombo > statsData.highestCombo) statsData.highestCombo = currentCombo;
    if (typeof achievementManager !== 'undefined') achievementManager.onLineClear(linesCleared, currentCombo);
    audioSystem.playSound(`clear${linesCleared}`);
    const cx = canvas.offsetLeft + canvas.width / 2;
    const cy = canvas.offsetTop + canvas.height / 2;
    effectManager.createLineClearEffect(linesCleared, cx, cy);
    if (currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL && linesCleared > 0) {
        const addTime = linesCleared * timeAddPerLine;
        countdownTime += addTime;
        audioSystem.playSound('timeAdd');
        effectManager.createLineClearEffect(`+${addTime}s`, cx, cy - 60, '#4CAF50');
        const m = Math.floor(countdownTime / 60), s = countdownTime % 60;
        timerValue.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        timerValue.classList.toggle('timer-warning', countdownTime <= 30);
    }
    if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES && linesCleared > 0) {
        timedLinesCleared += linesCleared;
        sprintLinesLeft.textContent = Math.max(0, customTargetLines - timedLinesCleared);
        sprintProgressFill.style.width = `${Math.min(100, (timedLinesCleared / customTargetLines) * 100)}%`;
        if (timedLinesCleared >= customTargetLines) { endTimedLines(true); return; }
    }
    if (currentChallenge === CHALLENGE_TYPES.SPRINT) {
        sprintLinesCleared += linesCleared;
        sprintProgressFill.style.width = `${Math.min(100, (sprintLinesCleared / sprintTargetLines) * 100)}%`;
        sprintLinesLeft.textContent = sprintTargetLines - sprintLinesCleared;
        if (sprintLinesCleared >= sprintTargetLines) { sprintComplete(); return; }
    }
    if (currentChallenge === CHALLENGE_TYPES.MARATHON) {
        marathonLinesCleared += linesCleared;
        marathonProgressFill.style.width = `${Math.min(100, (marathonLinesCleared / marathonTarget) * 100)}%`;
        marathonStageText.textContent = `${languageManager.getText('marathonCleared')}: ${marathonLinesCleared}/${marathonTarget}`;
    }
    const oldScore = score;
    updateScore(linesCleared);
    const added = score - oldScore;
    if (added > 0) effectManager.createScoreAddEffect(added, canvas.offsetLeft + canvas.width - 100, canvas.offsetTop + 100);
    if (currentMode === GAME_MODES.CLASSIC) { lines += linesCleared; level = Math.floor(lines / 10) + 1; dropInterval = Math.max(100, 1000 - (level - 1) * 100); }
    else if (currentMode === GAME_MODES.ENDLESS) { lines += linesCleared; level = Math.floor(lines / 10) + 1; }
    else if (currentMode === GAME_MODES.CHALLENGE) {
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        if (currentChallenge === CHALLENGE_TYPES.SPEED) {
            dropInterval = speedDropInterval;
        } else if (currentChallenge === CHALLENGE_TYPES.TIMED) dropInterval = Math.max(300, 800 - (level - 1) * 50);
        else if (currentChallenge === CHALLENGE_TYPES.SPRINT) { level = Math.floor(lines / 5) + 1; dropInterval = Math.max(200, 800 - (level - 1) * 60); }
        else if (currentChallenge === CHALLENGE_TYPES.MARATHON) dropInterval = Math.max(300, 800 - (level - 1) * 30);
        else dropInterval = Math.max(300, 800 - (level - 1) * 30);
    }
    updateUI();

    if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) {
        dailyTaskManager.onProgress({
            lines,
            score,
            maxCombo: maxComboThisGame,
            tetrisInc: linesCleared === 4 ? 1 : 0
        });
    }
}
function sprintComplete() {
    gameOver = true; gameStarted = false;
    stopTimer(); stopElapsedTimer(); stopNewModeTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    const m = Math.floor(elapsedTime / 60), s = Math.floor(elapsedTime % 60);
    const timeText = `${m}:${s.toString().padStart(2, '0')}`;
    startPrompt.innerHTML = `<h2>${languageManager.getText('congratulations')}</h2><p>${languageManager.getText('timeUsed')} ${timeText}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function addGarbageLine() {
    board.shift();
    const holePos = Math.floor(Math.random() * COLS);
    const garbage = Array.from({ length: COLS }, (_, x) => x === holePos ? 0 : 8);
    board.push(garbage);
    if (board[0].some(c => c !== 0)) survivalFail();
}
function survivalFail() {
    gameOver = true; gameStarted = false;
    stopTimer(); stopElapsedTimer(); stopSurvivalTimer(); stopNewModeTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    const m = Math.floor(elapsedTime / 60), s = Math.floor(elapsedTime % 60);
    const timeText = `${m}:${s.toString().padStart(2, '0')}`;
    startPrompt.innerHTML = `<h2>${languageManager.getText('survivalFailed')}</h2><p>${languageManager.getText('survivalTime')} ${timeText}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function updateScore(linesCleared) {
    const linePoints = [0, 40, 100, 300, 1200];
    let base = linePoints[linesCleared] * level;
    if (currentMode === GAME_MODES.CHALLENGE) {
        if (currentChallenge === CHALLENGE_TYPES.INVISIBLE || currentChallenge === CHALLENGE_TYPES.INVISIBLE2) base *= 2.0;
        if (currentChallenge === CHALLENGE_TYPES.TIMED) score += base + Math.floor(gameTime) * 1;
        else if (currentChallenge === CHALLENGE_TYPES.SPRINT) score += base + Math.max(0, 300 - elapsedTime) * 1;
        else if (currentChallenge === CHALLENGE_TYPES.SURVIVAL) score += base + Math.floor(elapsedTime) * 1;
        else if (currentChallenge === CHALLENGE_TYPES.MARATHON) score += base + marathonStage * 30 + Math.floor(elapsedTime) * 1;
        else if (currentChallenge === CHALLENGE_TYPES.TIMED_SCORE) score += base;
        else if (currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) score += base + Math.floor(elapsedTime) * 2;
        else if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES) score += base;
        else if (currentChallenge === CHALLENGE_TYPES.SPEED) score += base + Math.floor(elapsedTime) * 1;
        else score += base;
    } else score += base;
}
function hardDrop() {
    while (movePiece(0, 1)) {}
    if (typeof achievementManager !== 'undefined') {
        achievementManager.addProgress('harddrop_count', 1);
        achievementManager.checkSimple();
    }
    if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) {
        dailyTaskManager.onProgress({ harddropInc: 1 });
    }
    currentHarddropCount++;
}

function startCountdown() {
    if (isCountingDown) return;
    isCountingDown = true;
    gameStarted = false; isPaused = false; gameOver = false;
    startPrompt.style.display = 'none';
    countdownElement.style.display = 'block';
    let count = 3;
    countdownElement.textContent = count;
    countdownTimer = setInterval(() => {
        count--;
        countdownElement.textContent = count;
        countdownElement.style.animation = 'none';
        setTimeout(() => countdownElement.style.animation = 'countdownPulse 0.5s ease', 10);
        if (count <= 0) { stopCountdown(); startGameplay(); }
    }, 1000);
}
function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    isCountingDown = false;
    countdownElement.style.display = 'none';
    startPrompt.style.display = 'block';
}
function startGameplay() {
    gameStarted = true; isPaused = false; gameOver = false;
    elapsedTime = 0; gameTime = 0;
    sprintLinesCleared = 0; survivalTimer = customSurvivalInterval;
    marathonLinesCleared = 0; marathonIncreaseTimer = 75; marathonCheckTimer = 60;
    marathonStage = 1; marathonFailed = false; marathonCheckFailed = false;
    timedLinesCleared = 0;
    pausedThisGame = false;
    marathonCheckSuccessCount = 0;
    currentGameStartTime = Date.now();
    currentCombo = 0;
    maxComboThisGame = 0;
    currentTetrisCount = 0;
    currentHarddropCount = 0;

    if (typeof dailyTaskManager !== 'undefined' && dailyTaskManager) {
        dailyTaskManager.onGameStart();
    }
    if (typeof battlePassManager !== 'undefined') {
        battlePassManager.onGameStart();
    }

    survivalTimerValue.textContent = `${customSurvivalInterval}${languageManager.getText('seconds')}`;
    sprintLinesLeft.textContent = '40';
    sprintProgressFill.style.width = '0%';
    updateMarathonDisplay();
    if (currentChallenge === CHALLENGE_TYPES.SPEED) {
        speedTimeouts = 0;
        speedTimeoutCount.textContent = `0 / ${speedMaxTimeouts}`;
        speedTimeoutCount.classList.remove('warning');
        speedBlockTimer = speedTimeLimit;
        speedBlockTimedOut = false;
        currentPiece._timedOut = false;
        speedBlockTimerValue.textContent = speedTimeLimit.toFixed(1) + 's';
        speedBlockTimerValue.classList.remove('timer-warning');
        startSpeedTimer();
    }
    gameOverlay.style.display = 'none';
    audioSystem.playSound('start');
    if (enableBuiltinBGM && bgmManager.enabled && !bgmManager.isPlaying) bgmManager.play('game');
    startElapsedTimer();
    if (currentMode === GAME_MODES.CLASSIC) dropInterval = 1000;
    else if (currentMode === GAME_MODES.ENDLESS) dropInterval = 800;
    else if (currentMode === GAME_MODES.CHALLENGE) {
        if (currentChallenge === CHALLENGE_TYPES.SPEED) {
            dropInterval = speedDropInterval;
        } else {
            dropInterval = 800;
        }
        if (currentChallenge === CHALLENGE_TYPES.TIMED) { gameTime = 0; startTimer(); timerValue.textContent = '03:00'; timerValue.classList.remove('timer-warning'); }
        else if (currentChallenge === CHALLENGE_TYPES.SPRINT) startElapsedTimer();
        else if (currentChallenge === CHALLENGE_TYPES.SURVIVAL) { startElapsedTimer(); startSurvivalTimer(); }
        else if (currentChallenge === CHALLENGE_TYPES.MARATHON) { startElapsedTimer(); startMarathonTimer(); }
        else if (currentChallenge === CHALLENGE_TYPES.TIMED_SCORE) { timedScoreTime = customInitialTime; startNewModeTimer('timedScore'); }
        else if (currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) { countdownTime = customInitialTime; startNewModeTimer('countdownSurvival'); }
        else if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES) { timedLinesTime = customInitialTime; timedLinesCleared = 0; startNewModeTimer('timedLines'); }
    }
    setGameState(GAME_STATE.PLAYING);
    updatePauseButton();
}

function startSpeedTimer() {
    if (speedTimerInterval) clearInterval(speedTimerInterval);
    speedTimerInterval = setInterval(() => {
        if (isPaused || gameOver || !gameStarted) return;
        if (currentChallenge !== CHALLENGE_TYPES.SPEED) return;
        if (currentPiece && currentPiece._timedOut) return;
        speedBlockTimer -= 0.1;
        if (speedBlockTimer < 0) speedBlockTimer = 0;
        speedBlockTimerValue.textContent = speedBlockTimer.toFixed(1) + 's';
        speedBlockTimerValue.classList.toggle('timer-warning', speedBlockTimer <= 1.5);
        if (speedBlockTimer <= 0 && currentPiece && !currentPiece._timedOut) {
            currentPiece._timedOut = true;
            speedTimeouts++;
            speedTimeoutCount.textContent = `${speedTimeouts} / ${speedMaxTimeouts}`;
            if (speedTimeouts >= speedMaxTimeouts) {
                speedTimeoutCount.classList.add('warning');
            }
            audioSystem.playSound('gameover');
            speedBlockTimerValue.textContent = '0.0s';
            if (speedTimeouts > speedMaxTimeouts) {
                speedFail();
            }
        }
    }, 100);
}
function stopSpeedTimer() {
    if (speedTimerInterval) { clearInterval(speedTimerInterval); speedTimerInterval = null; }
}

function startNewModeTimer(modeType) {
    if (newModeTimer) clearInterval(newModeTimer);
    newModeTimer = setInterval(() => {
        if (isPaused || gameOver || !gameStarted) return;
        let remaining = 0;
        if (modeType === 'timedScore') { timedScoreTime--; remaining = timedScoreTime; }
        else if (modeType === 'countdownSurvival') { countdownTime--; remaining = countdownTime; }
        else if (modeType === 'timedLines') { timedLinesTime--; remaining = timedLinesTime; }
        const m = Math.floor(remaining / 60), s = remaining % 60;
        timerValue.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        timerValue.classList.toggle('timer-warning', remaining <= 30);
        if (remaining <= 0) {
            clearInterval(newModeTimer); newModeTimer = null;
            if (modeType === 'timedScore') endTimedScore();
            else if (modeType === 'countdownSurvival') endCountdownSurvival();
            else if (modeType === 'timedLines') endTimedLines(false);
        }
    }, 1000);
}
function stopNewModeTimer() { if (newModeTimer) { clearInterval(newModeTimer); newModeTimer = null; } }

function formatTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function endTimedScore() {
    gameOver = true; gameStarted = false;
    stopNewModeTimer(); stopTimer(); stopElapsedTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    startPrompt.innerHTML = `<h2>${languageManager.getText('timedScoreEnd')}</h2><p style="font-size:1.8rem;color:#4dccbd">${score.toLocaleString()}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function endCountdownSurvival() {
    gameOver = true; gameStarted = false;
    stopNewModeTimer(); stopTimer(); stopElapsedTimer(); stopSurvivalTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    const m = Math.floor(elapsedTime / 60), s = elapsedTime % 60;
    const timeText = `${m}:${s.toString().padStart(2, '0')}`;
    startPrompt.innerHTML = `<h2>${languageManager.getText('survivalTimeUp')}</h2><p>${languageManager.getText('survivalTime')} ${timeText}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound('gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}
function endTimedLines(win) {
    gameOver = true; gameStarted = false;
    stopNewModeTimer(); stopTimer(); stopElapsedTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    if (win) {
        startPrompt.innerHTML = `<h2>${languageManager.getText('timedLinesWin')}</h2><p>${languageManager.getText('timeUsed')} ${formatTime(customInitialTime - timedLinesTime)}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    } else {
        startPrompt.innerHTML = `<h2>${languageManager.getText('timedLinesLose')}</h2><p>${languageManager.getText('linesProgress')}: ${timedLinesCleared}/${customTargetLines}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    }
    setGameState(GAME_STATE.GAMEOVER);
    audioSystem.playSound(win ? 'start' : 'gameover');
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        if (!isPaused && !gameOver && gameStarted) {
            gameTime += 1;
            const left = timeLimit - gameTime;
            const m = Math.floor(left / 60), s = left % 60;
            timerValue.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            timerValue.classList.toggle('timer-warning', left <= 30);
            if (left <= 0) endGame();
        }
    }, 1000);
}
function startElapsedTimer() {
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = setInterval(() => {
        if (!isPaused && !gameOver && gameStarted) {
            elapsedTime += 1;
            if (currentChallenge !== CHALLENGE_TYPES.MARATHON) {
                const m = Math.floor(elapsedTime / 60), s = elapsedTime % 60;
                timeElapsed.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}
function startSurvivalTimer() {
    if (survivalGarbageInterval) clearInterval(survivalGarbageInterval);
    survivalGarbageInterval = setInterval(() => {
        if (!isPaused && !gameOver && gameStarted) {
            survivalTimer -= 1;
            survivalTimerValue.textContent = `${survivalTimer}${languageManager.getText('seconds')}`;
            if (survivalTimer <= 0) {
                addGarbageLine();
                survivalTimer = customSurvivalInterval;
                survivalTimerValue.textContent = `${customSurvivalInterval}${languageManager.getText('seconds')}`;
            }
        }
    }, 1000);
}
function startMarathonTimer() {
    if (marathonIncreaseInterval) clearInterval(marathonIncreaseInterval);
    marathonIncreaseInterval = setInterval(() => {
        if (!isPaused && !gameOver && gameStarted) {
            marathonIncreaseTimer -= 1;
            updateMarathonTimerDisplay();
            if (marathonIncreaseTimer <= 0) { increaseMarathonTarget(); marathonIncreaseTimer = 75; updateMarathonTimerDisplay(); }
        }
    }, 1000);
    if (marathonCheckInterval) clearInterval(marathonCheckInterval);
    marathonCheckInterval = setInterval(() => {
        if (!isPaused && !gameOver && gameStarted) {
            marathonCheckTimer -= 1;
            marathonNextCheck.textContent = `${languageManager.getText('nextTargetCheck')}: ${marathonCheckTimer}${languageManager.getText('seconds')}`;
            if (marathonCheckTimer <= 0) {
                checkMarathonTarget();
                marathonCheckTimer = 60;
                marathonNextCheck.textContent = `${languageManager.getText('nextTargetCheck')}: ${marathonCheckTimer}${languageManager.getText('seconds')}`;
            }
        }
    }, 1000);
}
function stopMarathonTimer() {
    if (marathonIncreaseInterval) { clearInterval(marathonIncreaseInterval); marathonIncreaseInterval = null; }
    if (marathonCheckInterval) { clearInterval(marathonCheckInterval); marathonCheckInterval = null; }
}
function updateMarathonTimerDisplay() { marathonTimerValue.textContent = `${marathonIncreaseTimer}${languageManager.getText('seconds')}`; }
function updateMarathonDisplay() {
    marathonTargetElement.textContent = marathonTarget;
    marathonStageText.textContent = `${languageManager.getText('marathonCleared')}: ${marathonLinesCleared}/${marathonTarget}`;
    marathonProgressFill.style.width = `${Math.min(100, (marathonLinesCleared / marathonTarget) * 100)}%`;
    updateMarathonTimerDisplay();
    marathonNextCheck.textContent = `${languageManager.getText('nextTargetCheck')}: ${marathonCheckTimer}${languageManager.getText('seconds')}`;
}
function increaseMarathonTarget() {
    marathonTarget += 10;
    marathonStage++;
    audioSystem.playSound('targetIncrease');
    const cx = canvas.offsetLeft + canvas.width / 2, cy = canvas.offsetTop + canvas.height / 2;
    effectManager.createLineClearEffect(languageManager.getText('marathonTargetIncrease'), cx, cy, '#4CAF50');
    updateMarathonDisplay();
    const bonus = marathonStage * 50;
    score += bonus;
    effectManager.createScoreAddEffect(bonus, canvas.offsetLeft + canvas.width - 100, canvas.offsetTop + 150, '#4CAF50');
    updateUI();
}
function checkMarathonTarget() {
    audioSystem.playSound('targetCheck');
    if (marathonLinesCleared >= marathonTarget) {
        marathonCheckSuccessCount++;
        const cx = canvas.offsetLeft + canvas.width / 2, cy = canvas.offsetTop + canvas.height / 2;
        effectManager.createLineClearEffect(languageManager.getText('marathonTargetReached'), cx, cy, '#4CAF50');
        const bonus = marathonStage * 30;
        score += bonus;
        effectManager.createScoreAddEffect(bonus, canvas.offsetLeft + canvas.width - 100, canvas.offsetTop + 200, '#4CAF50');
        updateUI();
    } else { marathonCheckFailed = true; endGame(); }
}
function stopTimer() { if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } }
function stopElapsedTimer() { if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; } }
function stopSurvivalTimer() { if (survivalGarbageInterval) { clearInterval(survivalGarbageInterval); survivalGarbageInterval = null; } }

function endGame() {
    if (typeof shopManager !== 'undefined' && shopManager.getCount('revive') > 0 && !window._reviveUsedThisGame) {
        gameOver = true; gameStarted = false;
        stopTimer(); stopElapsedTimer(); stopSurvivalTimer(); stopMarathonTimer(); stopNewModeTimer(); stopSpeedTimer();
        document.querySelector('.game-board').classList.remove('paused');

        const panel = document.getElementById('reviveConfirmPanel');
        if (!panel) {
            doEndGame();
            return;
        }
        document.getElementById('reviveScore').textContent = score.toLocaleString();
        document.getElementById('reviveRemaining').textContent = `${shopManager.getCount('revive')} → ${shopManager.getCount('revive') - 1}`;
        showPanel(panel);

        const useBtn = document.getElementById('reviveUse');
        const skipBtn = document.getElementById('reviveSkip');
        const newUseBtn = useBtn.cloneNode(true);
        const newSkipBtn = skipBtn.cloneNode(true);
        useBtn.parentNode.replaceChild(newUseBtn, useBtn);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        newUseBtn.addEventListener('click', () => {
            hidePanel(panel);
            shopManager.useConsumable('revive');
            if (typeof updateShopBadge === 'function') updateShopBadge();
            window._reviveUsedThisGame = true;
            audioSystem.playSound('targetIncrease');
            doRevive();
        });
        newSkipBtn.addEventListener('click', () => {
            hidePanel(panel);
            audioSystem.playSound('click');
            doEndGame();
        });
        return;
    }
    doEndGame();
}

function doRevive() {
    for (let y = 0; y < ROWS; y++) {
        board[y] = Array(COLS).fill(0);
    }
    gameOver = false;
    gameStarted = true;
    isPaused = false;
    audioSystem.playSound('start');
    showSaveNotification(`❤️ ${languageManager.getText('shopReviveUsed') || '使用复活币'} · 棋盘已清空`);
    setGameState(GAME_STATE.PLAYING);
    startElapsedTimer();
    if (currentChallenge === CHALLENGE_TYPES.TIMED) startTimer();
    if (currentChallenge === CHALLENGE_TYPES.SURVIVAL) startSurvivalTimer();
    if (currentChallenge === CHALLENGE_TYPES.MARATHON) startMarathonTimer();
    if (currentChallenge === CHALLENGE_TYPES.TIMED_SCORE) startNewModeTimer('timedScore');
    if (currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) startNewModeTimer('countdownSurvival');
    if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES) startNewModeTimer('timedLines');
    if (currentChallenge === CHALLENGE_TYPES.SPEED) startSpeedTimer();
    updatePauseButton();
}

function doEndGame() {
    gameOver = true; gameStarted = false;
    stopTimer(); stopElapsedTimer(); stopSurvivalTimer(); stopMarathonTimer(); stopNewModeTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    audioSystem.playSound('gameover');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    let msg = '', stateKey = GAME_STATE.GAMEOVER;
    if (currentMode === GAME_MODES.CHALLENGE && currentChallenge === CHALLENGE_TYPES.TIMED) {
        if (gameTime >= timeLimit) { msg = `<h2>${languageManager.getText('timeup')}</h2><p>${languageManager.getText('challengeEnded')}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`; stateKey = GAME_STATE.TIMEUP; }
        else msg = `<h2>${languageManager.getText('challengeFailed')}</h2><p>${languageManager.getText('gameOver')}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    } else if (currentMode === GAME_MODES.CHALLENGE && currentChallenge === CHALLENGE_TYPES.MARATHON) {
        if (marathonCheckFailed) msg = `<h2>${languageManager.getText('targetNotReached')}</h2><p>${languageManager.getText('marathonFailed')}</p><p>${languageManager.getText('challengeFailed')}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
        else if (marathonFailed) msg = `<h2>${languageManager.getText('marathonFailed')}</h2><p>${languageManager.getText('challengeFailed')}</p><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
        else msg = `<h2>${languageManager.getText('gameOver')}</h2><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    } else {
        msg = `<h2>${languageManager.getText('gameOver')}</h2><p>${languageManager.getText('pressSpaceToRestart')}</p>`;
    }
    startPrompt.innerHTML = msg;
    setGameState(stateKey);
    recordGameStats();
    saveCurrentScore();
    updatePauseButton();
}

function gameLoop(time = 0) {
    const dt = time - lastTime;
    lastTime = time;
    if (gameStarted && !isPaused && !gameOver) {
        dropCounter += dt;
        if (dropCounter > dropInterval) { movePiece(0, 1); dropCounter = 0; }
    }
    drawBoard();
    drawNextPiece();
    requestAnimationFrame(gameLoop);
}
function handleKeyPress(e) {
    const gameKeys = [32, 37, 38, 39, 40, 80, 82];
    if (gameKeys.includes(e.keyCode)) e.preventDefault();
    if (e.keyCode === 32 && gameOver) { resetGame(); startCountdown(); return; }
    if (e.keyCode === 32 && !gameStarted && !isCountingDown && !gameOver) { startCountdown(); return; }
    if (e.keyCode === 80) { if (gameStarted && !gameOver) togglePause(); return; }
    if (e.keyCode === 82) { resetGame(); return; }
    if (!gameStarted || isPaused || gameOver) return;
    switch (e.keyCode) {
        case 37: movePiece(-1, 0); break;
        case 39: movePiece(1, 0); break;
        case 40: movePiece(0, 1); break;
        case 38: if (rotatePiece(currentPiece)) audioSystem.playSound('rotate'); break;
        case 32: hardDrop(); break;
    }
}
function togglePause() {
    if (!gameStarted || gameOver) return;
    pausedThisGame = true;
    isPaused = !isPaused;
    audioSystem.playSound('pause');
    const gameBoard = document.querySelector('.game-board');
    if (isPaused) {
        stopTimer(); stopElapsedTimer(); stopSurvivalTimer(); stopMarathonTimer(); stopNewModeTimer();
        setGameState(GAME_STATE.PAUSED);
        if (typeof bgmManager !== 'undefined' && bgmManager) bgmManager.pause();
        gameBoard.classList.add('paused');
    } else {
        if (currentChallenge === CHALLENGE_TYPES.TIMED && !gameOver) startTimer();
        if ([CHALLENGE_TYPES.SPRINT, CHALLENGE_TYPES.SURVIVAL, CHALLENGE_TYPES.MARATHON, CHALLENGE_TYPES.SPEED].includes(currentChallenge)) startElapsedTimer();
        if (currentChallenge === CHALLENGE_TYPES.SURVIVAL) startSurvivalTimer();
        if (currentChallenge === CHALLENGE_TYPES.MARATHON) startMarathonTimer();
        if (currentChallenge === CHALLENGE_TYPES.TIMED_SCORE) startNewModeTimer('timedScore');
        if (currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) startNewModeTimer('countdownSurvival');
        if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES) startNewModeTimer('timedLines');
        setGameState(GAME_STATE.PLAYING);
        if (enableBuiltinBGM && typeof bgmManager !== 'undefined' && bgmManager) bgmManager.resume();
        gameBoard.classList.remove('paused');
    }
    updatePauseButton();
}
function updatePauseButton() {
    if (!gameStarted || gameOver) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = `⏸ ${languageManager.getText('pauseGame')} (P)`;
        pauseBtn.classList.remove('continue-btn');
    } else if (isPaused) {
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = `▶ ${languageManager.getText('resume')} (P)`;
        pauseBtn.classList.add('continue-btn');
    } else {
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = `⏸ ${languageManager.getText('pauseGame')} (P)`;
        pauseBtn.classList.remove('continue-btn');
    }
    resetBtn.disabled = !gameStarted && !gameOver;
}
function resetGame() {
    window._reviveUsedThisGame = false;
    createBoard();
    currentPiece = createPiece();
    nextQueue = [createPiece(), createPiece(), createPiece()];
    nextPiece = nextQueue.shift();
    nextQueue.push(createPiece());
    updateNextPieceDisplay();
    score = 0; level = 1; lines = 0;
    gameTime = 0; elapsedTime = 0;
    sprintLinesCleared = 0; survivalTimer = customSurvivalInterval;
    marathonTarget = 10; marathonLinesCleared = 0;
    marathonIncreaseTimer = 75; marathonCheckTimer = 60;
    marathonStage = 1; marathonFailed = false; marathonCheckFailed = false;
    timedLinesCleared = 0;
    timedScoreTime = customInitialTime;
    countdownTime = customInitialTime;
    timedLinesTime = customInitialTime;
    speedTimeouts = 0; speedBlockTimer = speedTimeLimit; speedBlockTimedOut = false;
    maxComboThisGame = 0;
    currentTetrisCount = 0;
    currentHarddropCount = 0;
    if (currentMode === GAME_MODES.CLASSIC) dropInterval = 1000;
    else if (currentChallenge === CHALLENGE_TYPES.SPEED) dropInterval = speedDropInterval;
    else dropInterval = 800;
    gameOver = false; isPaused = false; gameStarted = false;
    stopTimer(); stopCountdown(); stopElapsedTimer(); stopSurvivalTimer(); stopMarathonTimer(); stopNewModeTimer(); stopSpeedTimer();
    document.querySelector('.game-board').classList.remove('paused');
    gameOverlay.style.display = 'flex';
    startPrompt.style.display = 'block';
    startPrompt.innerHTML = `<h2>${languageManager.getText('getReady')}</h2><p>${languageManager.getText('pressSpaceToStart')}</p>`;
    countdownElement.style.display = 'none';
    if (currentChallenge === CHALLENGE_TYPES.TIMED_SCORE || currentChallenge === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL || currentChallenge === CHALLENGE_TYPES.TIMED_LINES) {
        timerValue.textContent = formatTime(customInitialTime);
        timerValue.classList.remove('timer-warning');
    }
    if (currentChallenge === CHALLENGE_TYPES.TIMED_LINES) {
        sprintLinesLeft.textContent = customTargetLines;
        sprintProgressFill.style.width = '0%';
    }
    if (currentChallenge === CHALLENGE_TYPES.SPEED) {
        speedTimeoutCount.textContent = `0 / ${speedMaxTimeouts}`;
        speedTimeoutCount.classList.remove('warning');
        speedBlockTimerValue.textContent = speedTimeLimit.toFixed(1) + 's';
        speedBlockTimerValue.classList.remove('timer-warning');
    }
    updateUI();
    setGameState(GAME_STATE.WAITING);
    updatePauseButton();
}
function handleBackButton() {
    if (gameStarted && score > 0 && !gameOver) {
        const playerName = hasAccount() ? accountData.nickname : languageManager.getText('accountDefaultName');
        addScoreToLeaderboard(currentMode, playerName, score, currentChallenge);
    }
    continueToPreviousMenu();
}
function continueToPreviousMenu() {
    loadSettings();
    if (currentMode === GAME_MODES.CHALLENGE && cameFromChallengeMenu) {
        challengeMenu.style.display = 'block';
        gameScreen.style.display = 'none';
        mainMenu.style.display = 'none';
        if (enableBuiltinBGM) {
            bgmManager.fadeOut(300);
            setTimeout(() => { bgmManager.play('challenge_menu'); bgmManager.fadeIn(500); }, 350);
        }
        backToMainBtn.style.display = 'flex';
    } else {
        mainMenu.style.display = 'flex';
        challengeMenu.style.display = 'none';
        gameScreen.style.display = 'none';
        if (enableBuiltinBGM) {
            bgmManager.fadeOut(300);
            setTimeout(() => { bgmManager.play('menu'); bgmManager.fadeIn(500); }, 350);
        }
        backToMainBtn.style.display = 'none';
    }
    resetGame();
    updateSettingsButtonVisibility();
    updateGameMusicBtn();
}
function updateNextPieceDisplay() {
    if (nextPiece) nextPieceElement.textContent = languageManager.getText(`piece${nextPiece.id}`);
    if (nextExtraContainer) nextExtraContainer.style.display = showExtraPreview ? 'flex' : 'none';
    if (showExtraPreview) {
        if (nextQueue[0] && nextPieceElement2) nextPieceElement2.textContent = languageManager.getText(`piece${nextQueue[0].id}`);
        if (nextQueue[1] && nextPieceElement3) nextPieceElement3.textContent = languageManager.getText(`piece${nextQueue[1].id}`);
    }
    drawNextPiece();
}
function setGameState(state) {
    gameState = state;
    const map = {
        [GAME_STATE.WAITING]: { text: languageManager.getText('waitingToStart'), cls: 'status-ready' },
        [GAME_STATE.PLAYING]: { text: languageManager.getText('playing'), cls: 'status-playing' },
        [GAME_STATE.PAUSED]: { text: languageManager.getText('paused'), cls: 'status-paused' },
        [GAME_STATE.GAMEOVER]: { text: languageManager.getText('gameOver'), cls: 'status-gameover' },
        [GAME_STATE.TIMEUP]: { text: languageManager.getText('timeup'), cls: 'status-gameover' }
    };
    const info = map[state] || map[GAME_STATE.WAITING];
    gameStatusElement.textContent = info.text;
    gameStatusElement.className = `game-status ${info.cls}`;
}
function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    timeElapsed.textContent = '00:00';
}
function showPanel(p) { if (p) p.style.display = 'flex'; }
function hidePanel(p) { if (p) p.style.display = 'none'; }

function addScoreToLeaderboard(mode, name, score, challengeType = null) {
    if (!mode || !name || score === undefined || score === null) return false;
    if (!leaderboardData[mode]) leaderboardData[mode] = [];
    const newScore = { name: name.trim() || languageManager.getText('anonymousPlayer'), score: parseInt(score), date: new Date().toLocaleDateString(languageManager.currentLang), timestamp: Date.now(), challengeType };
    if (challengeType === CHALLENGE_TYPES.SPRINT) newScore.time = elapsedTime;
    if (challengeType === CHALLENGE_TYPES.SURVIVAL) newScore.survivalTime = elapsedTime;
    if (challengeType === CHALLENGE_TYPES.MARATHON) { newScore.marathonLines = marathonLinesCleared; newScore.marathonStages = marathonStage - 1; newScore.marathonCheckFailed = marathonCheckFailed; }
    if (challengeType === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) newScore.survivalTime = elapsedTime;
    if (challengeType === CHALLENGE_TYPES.TIMED_LINES) { newScore.timedLinesCleared = timedLinesCleared; newScore.timedLinesTarget = customTargetLines; newScore.timeUsed = customInitialTime - timedLinesTime; }
    if (challengeType === CHALLENGE_TYPES.TIMED_SCORE) newScore.initialTime = customInitialTime;
    if (isNaN(newScore.score) || newScore.score <= 0) return false;
    leaderboardData[mode].push(newScore);
    leaderboardData[mode].sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
    if (leaderboardData[mode].length > 10) leaderboardData[mode] = leaderboardData[mode].slice(0, 10);
    if (saveLeaderboardData()) {
        showSaveNotification(`🎯 ${languageManager.getText('scoreSaved')}`);
        updateLeaderboardDisplay();
        return true;
    }
    return false;
}
function updateLeaderboardDisplay() {
    updateLeaderboardList('classic', classicLeaderboard);
    updateLeaderboardList('challenge', challengeLeaderboard);
    updateLeaderboardList('endless', endlessLeaderboard);
}
function updateLeaderboardList(mode, listEl) {
    const scores = leaderboardData[mode] || [];
    if (scores.length === 0) {
        listEl.innerHTML = `<div class="no-scores"><div style="font-size:3rem;margin-bottom:10px">📊</div><div>${languageManager.getText('noScores')}</div><div style="font-size:.8rem;margin-top:10px;color:#666">${languageManager.getText('beTheFirst')}</div></div>`;
        return;
    }
    const myName = hasAccount() ? accountData.nickname : '';
    let html = '';
    scores.forEach((s, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        let challengeInfo = '';
        if (mode === 'challenge' && s.challengeType) {
            const name = getChallengeName(s.challengeType);
            if (s.challengeType === CHALLENGE_TYPES.SPRINT && s.time) {
                challengeInfo = `${name} · ${languageManager.getText('timeUsed')}${formatTime(s.time)} · ${s.date}`;
            } else if (s.challengeType === CHALLENGE_TYPES.SURVIVAL && s.survivalTime) {
                challengeInfo = `${name} · ${languageManager.getText('survivalTime')}${formatTime(s.survivalTime)} · ${s.date}`;
            } else if (s.challengeType === CHALLENGE_TYPES.MARATHON && s.marathonLines) {
                const status = s.marathonCheckFailed ? languageManager.getText('targetNotReached') : languageManager.getText('marathonComplete');
                challengeInfo = `${name} · ${status} · ${languageManager.getText('totalLines')}${s.marathonLines} · ${s.date}`;
            } else if (s.challengeType === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL && s.survivalTime) {
                challengeInfo = `${name} · ${languageManager.getText('survivalTime')}${formatTime(s.survivalTime)} · ${s.date}`;
            } else if (s.challengeType === CHALLENGE_TYPES.TIMED_LINES && s.timedLinesTarget) {
                challengeInfo = `${name} · ${s.timedLinesCleared}/${s.timedLinesTarget} · ${languageManager.getText('timeUsed')}${formatTime(s.timeUsed)} · ${s.date}`;
            } else if (s.challengeType === CHALLENGE_TYPES.TIMED_SCORE && s.initialTime) {
                challengeInfo = `${name} · ${s.initialTime}s · ${s.date}`;
            } else { challengeInfo = `${name} · ${s.date}`; }
        } else { challengeInfo = s.date; }
        const isMe = myName && s.name === myName;
        html += `<div class="leaderboard-item${isMe ? ' is-me' : ''}">
<div class="leaderboard-rank">${medal}</div>
<div class="leaderboard-info">
<div class="leaderboard-name-row">
<div class="leaderboard-name">${s.name}</div>
<div class="leaderboard-score">${languageManager.getText('score')}: ${s.score.toLocaleString(languageManager.currentLang)}</div>
</div>
<div class="leaderboard-date">${challengeInfo}</div>
</div>
</div>`;
    });
    listEl.innerHTML = html;
}
function getChallengeName(t) {
    const map = {
        [CHALLENGE_TYPES.TIMED]: 'timedChallenge',
        [CHALLENGE_TYPES.INVISIBLE]: 'invisibleMode',
        [CHALLENGE_TYPES.INVISIBLE2]: 'invisible2Mode',
        [CHALLENGE_TYPES.SPRINT]: 'sprint40',
        [CHALLENGE_TYPES.SURVIVAL]: 'survivalMode',
        [CHALLENGE_TYPES.MARATHON]: 'marathonMode',
        [CHALLENGE_TYPES.TIMED_SCORE]: 'timedScoreMode',
        [CHALLENGE_TYPES.COUNTDOWN_SURVIVAL]: 'countdownSurvivalMode',
        [CHALLENGE_TYPES.TIMED_LINES]: 'timedLinesMode',
        [CHALLENGE_TYPES.SPEED]: 'speedChallengeMode'
    };
    return languageManager.getText(map[t] || 'challengeMode');
}
function getModeName(mode) {
    const map = { classic:'classicMode', challenge:'challengeMode', endless:'endlessMode' };
    return languageManager.getText(map[mode] || 'unknownMode');
}
function switchLeaderboardTab(mode) {
    leaderboardTabs.forEach(tab => tab.classList.toggle('active', tab.getAttribute('data-mode') === mode));
    classicLeaderboard.style.display = mode === 'classic' ? 'block' : 'none';
    challengeLeaderboard.style.display = mode === 'challenge' ? 'block' : 'none';
    endlessLeaderboard.style.display = mode === 'endless' ? 'block' : 'none';
}

function initCustomModal() {
    modalCancelBtn.addEventListener('click', () => {
        hidePanel(customModal);
        resetCustomModalToDefault();
        audioSystem.playSound('click');
    });
    modalInput.addEventListener('keydown', e => { if (e.key === 'Enter') modalConfirmBtn.click(); });
}
function showClearLeaderboardConfirm() {
    resetCustomModalToDefault();
    const active = document.querySelector('.leaderboard-tab.active');
    const mode = active.getAttribute('data-mode');
    modalIcon.textContent = '🗑️';
    modalTitle.textContent = languageManager.getText('clearConfirmTitle');
    modalText.textContent = languageManager.getText('clearConfirmText');
    modalScore.textContent = '';
    modalInput.style.display = 'none';
    modalScore.style.display = 'none';
    modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-danger';
    modalConfirmBtn.textContent = languageManager.getText('delete');
    showPanel(customModal);
    const original = modalConfirmBtn.onclick;
    modalConfirmBtn.onclick = () => {
        resetLeaderboardData(mode);
        if (saveLeaderboardData()) {
            showSaveNotification(`✅ ${languageManager.getText('clearSuccess')}`);
            updateLeaderboardDisplay();
        } else {
            showSaveNotification('❌ ' + languageManager.getText('clearScores') + languageManager.getText('failed'), true);
        }
        hidePanel(customModal);
        resetCustomModalToDefault();
        modalConfirmBtn.onclick = original;
        audioSystem.playSound('click');
    };
    modalCancelBtn.onclick = () => {
        hidePanel(customModal);
        resetCustomModalToDefault();
        audioSystem.playSound('click');
    };
}
function showDeleteTrackConfirm(trackId) {
    resetCustomModalToDefault();
    modalIcon.textContent = '🗑️';
    modalTitle.textContent = languageManager.getText('musicConfirmDeleteTitle');
    modalText.textContent = languageManager.getText('musicConfirmDeleteText');
    modalScore.textContent = '';
    modalInput.style.display = 'none';
    modalScore.style.display = 'none';
    modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-danger';
    modalConfirmBtn.textContent = languageManager.getText('delete');
    showPanel(customModal);
    const original = modalConfirmBtn.onclick;
    modalConfirmBtn.onclick = async () => {
        await musicPlayer.removeTrack(trackId);
        hidePanel(customModal);
        resetCustomModalToDefault();
        modalConfirmBtn.onclick = original;
        audioSystem.playSound('click');
    };
    modalCancelBtn.onclick = () => {
        hidePanel(customModal);
        resetCustomModalToDefault();
        audioSystem.playSound('click');
    };
}
function showSaveNotification(msg, isError = false) {
    if (!saveNotification) return;
    if (saveNotification._animTimer) { clearTimeout(saveNotification._animTimer); saveNotification._animTimer = null; }
    if (saveNotification._hideTimer) { clearTimeout(saveNotification._hideTimer); saveNotification._hideTimer = null; }
    saveNotification.style.animation = 'none';
    saveNotification.style.display = 'none';
    void saveNotification.offsetWidth;
    saveNotification.innerHTML = `<span>${msg}</span>`;
    saveNotification.className = `save-notification ${isError ? 'error' : ''}`;
    saveNotification.style.display = 'flex';
    saveNotification._animTimer = setTimeout(() => {
        saveNotification.style.animation = 'slideDown 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
        saveNotification._animTimer = null;
    }, 16);
    saveNotification._hideTimer = setTimeout(() => {
        saveNotification.style.display = 'none';
        saveNotification.style.animation = 'none';
        saveNotification._hideTimer = null;
    }, 3000);
}

let currentAchCategory = 'all';
function renderAchievements() {
    const tabsEl = document.getElementById('achievementTabs');
    const listEl = document.getElementById('achievementList');
    if (!tabsEl || !listEl) return;
    const cats = ['all', ...ACH_CATEGORIES];
    tabsEl.innerHTML = cats.map(c => {
        const label = c === 'all' ? languageManager.getText('achCategoryAll') : languageManager.getText('achCategory_' + c);
        const active = c === currentAchCategory ? ' active' : '';
        return `<button class="leaderboard-tab${active}" data-cat="${c}">${label}</button>`;
    }).join('');
    tabsEl.querySelectorAll('.leaderboard-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            currentAchCategory = btn.getAttribute('data-cat');
            renderAchievements();
            audioSystem.playSound('click');
        });
    });
    const total = achievementManager.getTotalCount();
    const done = achievementManager.getUnlockedCount();
    const pct = total ? Math.round(done / total * 100) : 0;
    const pt = document.getElementById('achProgressText');
    const pf = document.getElementById('achProgressFill');
    if (pt) pt.textContent = `${done} / ${total}`;
    if (pf) pf.style.width = pct + '%';
    const list = ACHIEVEMENTS.filter(a => currentAchCategory === 'all' || a.category === currentAchCategory);
    listEl.innerHTML = list.map(a => {
        const unlocked = achievementManager.isUnlocked(a.id);
        const name = languageManager.getText(a.nameKey);
        const desc = languageManager.getText(a.descKey);
        const date = unlocked ? new Date(achievementManager.unlocked[a.id].unlockedAt) : null;
        const dateStr = date ? `📅 ${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : '';
        return `<div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
<div class="achievement-icon">${unlocked ? a.icon : '🔒'}</div>
<div class="achievement-info">
<div class="achievement-name">${name}</div>
<div class="achievement-desc">${desc}</div>
</div>
<div class="achievement-right">
${dateStr ? `<span class="achievement-date">${dateStr}</span>` : ''}
<span class="achievement-status">${unlocked ? '✓' : '—'}</span>
</div>
</div>`;
    }).join('');
}

async function initMusicPlayer() {
    const ok = await musicPlayer.init();
    if (!ok) {
        const panel = document.querySelector('.settings-panel[data-panel="music"] .music-player');
        if (panel) {
            panel.innerHTML = `<div class="music-unsupported">❌ ${languageManager.getText('musicNoSupport')}</div>`;
        }
        return;
    }
    musicPlayer.onTracksChange(() => {
        renderMusicPlaylist();
        renderBgmPanel();
        updateGameMusicBtn();
        if (musicExportAllBtn) musicExportAllBtn.disabled = musicPlayer.tracks.length === 0;
    });
    musicPlayer.onPlayStateChange(() => {
        updateMusicPlayerUI();
        updateBgmPanelUI();
        updateGameMusicBtn();
    });
    musicPlayer.onTimeUpdate((data) => {
        updateMusicProgress(data);
        updateBgmProgress(data);
    });
    musicPlayBtn.addEventListener('click', () => musicPlayer.togglePlay());
    musicImportBtn.addEventListener('click', () => musicFileInput.click());

    if (musicExportAllBtn) {
        musicExportAllBtn.addEventListener('click', async () => {
            if (musicPlayer.tracks.length === 0) {
                showSaveNotification('⚠️ ' + languageManager.getText('musicNoTrack'), true);
                return;
            }
            musicExportAllBtn.disabled = true;
            const total = musicPlayer.tracks.length;
            showExportingModal(total);
            const result = await exportAllTracksAsZip(musicPlayer.tracks, (cur, tot, name) => {
                updateExportingProgress(cur, tot, name);
            });
            hideExportingModal();
            musicExportAllBtn.disabled = false;
            if (result.failed > 0) {
                showSaveNotification(`⚠️ ${languageManager.getText('musicExportSuccess')} ${result.ok} / ${result.total}`, true);
            } else {
                showSaveNotification(`✅ ${languageManager.getText('musicExportSuccess')} (${result.ok})`);
            }
            audioSystem.playSound('click');
        });
    }

    musicFileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const allFiles = Array.from(files);
        const zipFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.zip'));
        const audioFiles = allFiles.filter(f => !f.name.toLowerCase().endsWith('.zip'));

        musicImportBtn.disabled = true;
        musicFileInput.value = '';

        let totalOk = 0, totalSkipped = 0, totalFailed = 0, totalTooBig = 0;
        let maxReached = false;

        for (const zf of zipFiles) {
            showImportingModal(1);
            const r = await importTracksFromZip(zf, (idx, tot, name) => {
                updateImportingProgress(idx, tot);
            });
            hideImportingModal();
            totalOk += (r.ok || 0);
            totalSkipped += (r.skipped || 0);
            totalFailed += (r.failed || 0);
            totalTooBig += (r.tooBig || 0);
            if (r.maxReached) maxReached = true;
        }

        if (audioFiles.length > 0) {
            showImportingModal(audioFiles.length);
            const result = await musicPlayer.importFiles(audioFiles, (idx, tot, extra) => {
                updateImportingProgress(idx, tot, extra);
            });
            hideImportingModal();
            totalOk += (result.ok || 0);
            totalSkipped += (result.skipped || 0);
            totalFailed += (result.failed || 0);
            totalTooBig += (result.tooBig || 0);
            if (result.maxReached) maxReached = true;
        }

        musicImportBtn.disabled = false;

        if (maxReached) {
            showSaveNotification(`⚠️ ${languageManager.getText('musicMaxReached')} (${MUSIC_MAX_COUNT})`, true);
        } else if (totalTooBig > 0) {
            showSaveNotification(`⚠️ ${languageManager.getText('musicFileTooBig')}`, true);
        } else if (totalOk > 0 && totalSkipped > 0) {
            showSaveNotification(`✅ ${languageManager.getText('musicImportSuccess')} (${totalOk}) · ${languageManager.getText('musicImportSkipped')} (${totalSkipped})`);
        } else if (totalOk > 0) {
            showSaveNotification(`✅ ${languageManager.getText('musicImportSuccess')} (${totalOk})`);
        } else if (totalSkipped > 0) {
            showSaveNotification(`ℹ️ ${languageManager.getText('musicImportSkipped')} (${totalSkipped})`, true);
        } else if (totalFailed > 0) {
            showSaveNotification(`❌ ${languageManager.getText('musicImportFailed')}`, true);
        }
    });
    const musicClearAllBtn = document.getElementById('musicClearAllBtn');
    if (musicClearAllBtn) {
        musicClearAllBtn.addEventListener('click', () => {
            if (musicPlayer.tracks.length === 0) {
                showSaveNotification('⚠️ ' + languageManager.getText('musicNoTrack'), true);
                return;
            }
            resetCustomModalToDefault();
            modalIcon.textContent = '🗑️';
            modalTitle.textContent = languageManager.getText('musicClearAllConfirmTitle');
            modalText.textContent = languageManager.getText('musicClearAllConfirmText');
            modalScore.textContent = '';
            modalInput.style.display = 'none';
            modalScore.style.display = 'none';
            modalConfirmBtn.className = 'custom-modal-btn custom-modal-btn-danger';
            modalConfirmBtn.textContent = languageManager.getText('delete');
            showPanel(customModal);
            const original = modalConfirmBtn.onclick;
            modalConfirmBtn.onclick = async () => {
                musicPlayer.stop();
                await musicPlayer.db.clear();
                musicPlayer.tracks = [];
                musicPlayer.currentIndex = -1;
                musicPlayer._notifyTracksChange();
                musicPlayer._notifyPlayState();
                showSaveNotification(`✅ ${languageManager.getText('musicClearAllSuccess')}`);
                hidePanel(customModal);
                resetCustomModalToDefault();
                modalConfirmBtn.onclick = original;
                audioSystem.playSound('click');
            };
            modalCancelBtn.onclick = () => {
                hidePanel(customModal);
                resetCustomModalToDefault();
                audioSystem.playSound('click');
            };
        });
    }
    musicProgress.addEventListener('input', () => {
        musicPlayer._seekDragging = true;
        const dur = musicPlayer.audio.duration || 0;
        const val = parseFloat(musicProgress.value);
        if (dur > 0) musicCurTime.textContent = formatDuration(val / 100 * dur);
        updateSliderFill(musicProgress);
    });
    musicProgress.addEventListener('change', () => {
        const dur = musicPlayer.audio.duration || 0;
        const val = parseFloat(musicProgress.value);
        if (dur > 0) musicPlayer.seekTo(val / 100 * dur);
        musicPlayer._seekDragging = false;
    });
    if (typeof musicPlayer !== 'undefined') musicPlayer.setVolume(musicVolume / 100);
    if (musicExportAllBtn) musicExportAllBtn.disabled = musicPlayer.tracks.length === 0;
    renderMusicPlaylist();
    updateMusicPlayerUI();
    renderBgmPanel();
    updateBgmPanelUI();
    updateGameMusicBtn();
}

function renderMusicPlaylist() {
    if (!musicPlaylistEl) return;
    const allTracks = musicPlayer.tracks;
    const isSearching = musicSearchQuery && musicSearchQuery.trim();
    if (isSearching) {
        const matched = filterTracksByQuery(allTracks, musicSearchQuery);
        musicPlaylistCount.textContent = `${matched.length} / ${allTracks.length}`;
    } else {
        musicPlaylistCount.textContent = `${allTracks.length} / ${MUSIC_MAX_COUNT}`;
    }
    if (allTracks.length === 0) {
        musicPlaylistEl.innerHTML = `<div class="music-empty">${languageManager.getText('musicNoTrack')}</div>`;
        return;
    }
    const tracks = filterTracksByQuery(allTracks, musicSearchQuery);
    if (tracks.length === 0) {
        musicPlaylistEl.innerHTML = `<div class="music-empty">${languageManager.getText('musicNoResults')}</div>`;
        return;
    }
    musicPlaylistEl.innerHTML = tracks.map((t) => {
        const i = allTracks.indexOf(t);
        const active = i === musicPlayer.currentIndex;
        return `<div class="music-track${active ? ' active' : ''}" data-index="${i}">
<div class="music-track-index">${active ? (musicPlayer.isPlaying ? '<span class="music-bars playing"><span></span><span></span><span></span></span>' : '<span class="music-bars paused">▶</span>') : (i + 1)}</div>
<div class="music-track-info">
<div class="music-track-name">${escapeHtml(t.name)}</div>
${t.artist ? `<div class="music-track-artist">${escapeHtml(t.artist)}</div>` : ''}
</div>
<div class="music-track-duration">${formatDuration(t.duration)}</div>
<button class="music-track-remove" data-remove-id="${t.id}" title="${languageManager.getText('musicDelete')}">×</button>
</div>`;
    }).join('');
    musicPlaylistEl.querySelectorAll('.music-track').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('music-track-remove')) return;
            const idx = parseInt(el.getAttribute('data-index'));
            musicPlayer.playIndex(idx);
        });
    });
    musicPlaylistEl.querySelectorAll('.music-track-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-remove-id');
            showDeleteTrackConfirm(id);
        });
    });
    if (!musicPlaylistEl._dragBound) {
        musicPlaylistEl._dragBound = true;
        attachDragSort(musicPlaylistEl, '.music-track', (from, to) => {
            musicPlayer.reorderTracks(from, to);
        });
    }
}

function updateMusicPlayerUI() {
    const track = musicPlayer.getCurrentTrack();
    const coverEl = document.getElementById('musicCoverIcon');
    if (track) {
        startTitleRoll(musicNowTitle, track.name);
        const sub = [];
        if (track.artist) sub.push(track.artist);
        if (track.album) sub.push(track.album);
        if (track.size) sub.push(formatFileSize(track.size));
        musicNowSub.textContent = sub.join(' · ');
        if (coverEl) {
            if (track.picture && track.picture.dataUrl) coverEl.innerHTML = `<img src="${track.picture.dataUrl}" alt="cover">`;
            else coverEl.innerHTML = '🎵';
        }
    } else {
        stopTitleRoll(musicNowTitle, languageManager.getText('musicNoTrack'));
        musicNowSub.textContent = '';
        if (coverEl) coverEl.innerHTML = '🎵';
    }
    musicPlayBtn.textContent = musicPlayer.isPlaying ? '⏸' : '▶';
    musicPlayBtn.disabled = musicPlayer.tracks.length === 0;
    const locateBtn = document.getElementById('musicLocateBtn');
    if (locateBtn) locateBtn.disabled = musicPlayer.currentIndex < 0;
    if (track) {
        if (musicPlayer.isPlaying) {
            startTitleRoll(musicNowTitle, track.name);
        } else {
            stopTitleRoll(musicNowTitle, track.name);
        }
    }
    musicPlaylistEl.querySelectorAll('.music-track').forEach((el, i) => {
        el.classList.toggle('active', i === musicPlayer.currentIndex);
        const idx = el.querySelector('.music-track-index');
        if (!idx) return;
        const realIdx = parseInt(el.getAttribute('data-index'));
        if (realIdx === musicPlayer.currentIndex) {
            idx.innerHTML = musicPlayer.isPlaying
                ? '<span class="music-bars playing"><span></span><span></span><span></span></span>'
                : '<span class="music-bars paused">▶</span>';
        } else {
            idx.textContent = realIdx + 1;
        }
    });
}

function updateMusicProgress(data) {
    if (!musicCurTime || !musicTotalTime) return;
    const cur = data.current || 0;
    const dur = data.duration || 0;
    musicCurTime.textContent = formatDuration(cur);
    musicTotalTime.textContent = formatDuration(dur);
    if (dur > 0) musicProgress.value = (cur / dur) * 100;
    else musicProgress.value = 0;
    updateSliderFill(musicProgress);
}

function renderBgmPanel() {
    if (!bgmListEl) return;
    const allTracks = musicPlayer.tracks;
    const isSearching = bgmSearchQuery && bgmSearchQuery.trim();
    if (isSearching) {
        const matched = filterTracksByQuery(allTracks, bgmSearchQuery);
        bgmListCount.textContent = `${matched.length} / ${allTracks.length}`;
    } else {
        bgmListCount.textContent = `${allTracks.length} / ${MUSIC_MAX_COUNT}`;
    }
    if (allTracks.length === 0) {
        bgmListEl.innerHTML = `<div class="bgm-empty">${languageManager.getText('musicNoTrack')}</div>`;
        return;
    }
    const tracks = filterTracksByQuery(allTracks, bgmSearchQuery);
    if (tracks.length === 0) {
        bgmListEl.innerHTML = `<div class="bgm-empty">${languageManager.getText('musicNoResults')}</div>`;
        return;
    }
    bgmListEl.innerHTML = tracks.map((t) => {
        const i = allTracks.indexOf(t);
        const active = i === musicPlayer.currentIndex;
        return `<div class="bgm-track${active ? ' active' : ''}" data-index="${i}">
<div class="bgm-track-index">${active ? (musicPlayer.isPlaying ? '<span class="music-bars playing"><span></span><span></span><span></span></span>' : '<span class="music-bars paused">▶</span>') : (i + 1)}</div>
<div class="bgm-track-info">
<div class="bgm-track-name">${escapeHtml(t.name)}</div>
${t.artist ? `<div class="bgm-track-artist">${escapeHtml(t.artist)}</div>` : ''}
</div>
<div class="bgm-track-duration">${formatDuration(t.duration)}</div>
</div>`;
    }).join('');
    bgmListEl.querySelectorAll('.bgm-track').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.getAttribute('data-index'));
            musicPlayer.playIndex(idx);
        });
    });
    if (!bgmListEl._dragBound) {
        bgmListEl._dragBound = true;
        attachDragSort(bgmListEl, '.bgm-track', (from, to) => {
            musicPlayer.reorderTracks(from, to);
        });
    }
}

function updateBgmPanelUI() {
    if (!bgmPlayBtn) return;
    const track = musicPlayer.getCurrentTrack();
    if (track) {
        startTitleRoll(bgmNowTitle, track.name);
        const sub = [];
        if (track.artist) sub.push(track.artist);
        if (track.album) sub.push(track.album);
        if (track.size) sub.push(formatFileSize(track.size));
        bgmNowSub.textContent = sub.join(' · ');
        if (bgmNowIcon) {
            if (track.picture && track.picture.dataUrl) bgmNowIcon.innerHTML = `<img src="${track.picture.dataUrl}" alt="cover">`;
            else bgmNowIcon.innerHTML = '🎵';
        }
    } else {
        stopTitleRoll(bgmNowTitle, languageManager.getText('musicNoTrack'));
        bgmNowSub.textContent = '';
        if (bgmNowIcon) bgmNowIcon.innerHTML = '🎵';
    }
    bgmPlayBtn.textContent = musicPlayer.isPlaying ? '⏸' : '▶';
    bgmPlayBtn.disabled = musicPlayer.tracks.length === 0;
    const bgmLocate = document.getElementById('bgmLocateBtn');
    if (bgmLocate) bgmLocate.disabled = musicPlayer.currentIndex < 0;
    if (track) {
        if (musicPlayer.isPlaying) {
            startTitleRoll(bgmNowTitle, track.name);
        } else {
            stopTitleRoll(bgmNowTitle, track.name);
        }
    }
    bgmListEl.querySelectorAll('.bgm-track').forEach((el, i) => {
        el.classList.toggle('active', i === musicPlayer.currentIndex);
        const idx = el.querySelector('.bgm-track-index');
        if (!idx) return;
        const realIdx = parseInt(el.getAttribute('data-index'));
        if (realIdx === musicPlayer.currentIndex) {
            idx.innerHTML = musicPlayer.isPlaying
                ? '<span class="music-bars playing"><span></span><span></span><span></span></span>'
                : '<span class="music-bars paused">▶</span>';
        } else {
            idx.textContent = realIdx + 1;
        }
    });
}

function updateBgmProgress(data) {
    const cur = data.current || 0;
    const dur = data.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    if (bgmCurTime && bgmTotalTime) {
        bgmCurTime.textContent = formatDuration(cur);
        bgmTotalTime.textContent = formatDuration(dur);
    }
    if (bgmProgress) {
        if (dur > 0) bgmProgress.value = pct;
        else bgmProgress.value = 0;
        updateSliderFill(bgmProgress);
    }
    const gameLine = document.getElementById('gameMusicProgress');
    if (gameLine) gameLine.style.width = pct + '%';
}

function showCustomTimeModal(type) {
    pendingChallengeType = type;
    timeElapsedItem.style.display = 'none';
    extraInputGroup.style.display = 'none';
    timeModalExtra.textContent = '';
    if (type === CHALLENGE_TYPES.TIMED_SCORE) {
        timeModalIcon.textContent = '🎯';
        timeModalTitle.textContent = languageManager.getText('customTimeTitle');
        timeModalText.textContent = languageManager.getText('customTimeText');
        timeModalHint.textContent = languageManager.getText('customTimeHint');
        timeModalInput.value = customInitialTime || 180;
        timeModalInput.min = 10; timeModalInput.max = 3600;
    } else if (type === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL) {
        timeModalIcon.textContent = '⏳';
        timeModalTitle.textContent = languageManager.getText('customTimeTitle');
        timeModalText.textContent = languageManager.getText('customTimeText');
        timeModalHint.textContent = languageManager.getText('customTimeHint');
        timeModalInput.value = customInitialTime || 60;
        timeModalInput.min = 10; timeModalInput.max = 3600;
        timeModalExtra.textContent = `${languageManager.getText('addTimePerLine')}: ${timeAddPerLine}s`;
    } else if (type === CHALLENGE_TYPES.TIMED_LINES) {
        timeModalIcon.textContent = '📊';
        timeModalTitle.textContent = languageManager.getText('customTimeTitle');
        timeModalText.textContent = languageManager.getText('customTimeText');
        timeModalHint.textContent = languageManager.getText('customTimeHint');
        timeModalInput.value = customInitialTime || 180;
        timeModalInput.min = 10; timeModalInput.max = 3600;
        extraInputGroup.style.display = 'block';
        extraInputLabel.textContent = languageManager.getText('customTargetLinesText');
        extraModalInput.value = customTargetLines || 40;
    }
    showPanel(customTimeModal);
    setTimeout(() => timeModalInput.focus(), 100);
}

function showCustomSurvivalModal() {
    pendingChallengeType = CHALLENGE_TYPES.SURVIVAL;
    timeModalIcon.textContent = '💀';
    timeModalTitle.textContent = languageManager.getText('survivalIntervalTitle');
    timeModalText.textContent = languageManager.getText('survivalIntervalText');
    timeModalHint.textContent = languageManager.getText('survivalIntervalHint');
    timeModalInput.value = customSurvivalInterval;
    timeModalInput.min = 10; timeModalInput.max = 60;
    timeModalExtra.textContent = '';
    extraInputGroup.style.display = 'none';
    showPanel(customTimeModal);
    setTimeout(() => timeModalInput.focus(), 100);
}

function showSpeedSetupModal() {
    pendingChallengeType = CHALLENGE_TYPES.SPEED;
    timeModalIcon.textContent = '⚡';
    timeModalTitle.textContent = languageManager.getText('speedSetupTitle');
    timeModalText.textContent = languageManager.getText('speedTimeLimitText');
    timeModalHint.textContent = languageManager.getText('speedTimeLimitHint');
    timeModalInput.value = speedTimeLimit || 5;
    timeModalInput.min = 1; timeModalInput.max = 30;
    extraInputGroup.style.display = 'block';
    extraInputLabel.textContent = languageManager.getText('speedMaxTimeoutsText');
    extraModalInput.value = speedMaxTimeouts || 3;
    extraModalInput.min = 1; extraModalInput.max = 10;
    timeModalExtra.textContent = languageManager.getText('speedMaxTimeoutsHint');
    showPanel(customTimeModal);
    setTimeout(() => timeModalInput.focus(), 100);
}

function initCustomTimeModal() {
    timeModalCancel.addEventListener('click', () => {
        hidePanel(customTimeModal);
        if (pendingChallengeType === CHALLENGE_TYPES.SURVIVAL) showChallengeMenu();
        else if (pendingChallengeType === CHALLENGE_TYPES.SPEED) showChallengeMenu();
        else if (pendingChallengeType === CHALLENGE_TYPES.TIMED_SCORE
            || pendingChallengeType === CHALLENGE_TYPES.COUNTDOWN_SURVIVAL
            || pendingChallengeType === CHALLENGE_TYPES.TIMED_LINES) showPanel(timedChoiceModal);
        else showChallengeMenu();
        audioSystem.playSound('click');
    });
    timeModalConfirm.addEventListener('click', () => {
        if (pendingChallengeType === CHALLENGE_TYPES.SPEED) {
            const secVal = parseFloat(timeModalInput.value);
            if (isNaN(secVal) || secVal < 1 || secVal > 30) {
                showSaveNotification('❌ ' + languageManager.getText('speedTimeLimitInvalid'), true);
                return;
            }
            const maxVal = parseInt(extraModalInput.value);
            if (isNaN(maxVal) || maxVal < 1 || maxVal > 10) {
                showSaveNotification('❌ ' + languageManager.getText('speedMaxTimeoutsInvalid'), true);
                return;
            }
            speedTimeLimit = secVal;
            speedMaxTimeouts = maxVal;
            hidePanel(customTimeModal);
            cameFromChallengeMenu = true;
            startChallengeMode(CHALLENGE_TYPES.SPEED);
            audioSystem.playSound('click');
            return;
        }
        const val = parseInt(timeModalInput.value);
        if (pendingChallengeType === CHALLENGE_TYPES.SURVIVAL) {
            if (isNaN(val) || val < 10 || val > 60) {
                showSaveNotification('❌ ' + languageManager.getText('survivalIntervalInvalid'), true);
                return;
            }
            customSurvivalInterval = val;
            hidePanel(customTimeModal);
            cameFromChallengeMenu = true;
            startChallengeMode(CHALLENGE_TYPES.SURVIVAL);
            audioSystem.playSound('click');
            return;
        }
        if (isNaN(val) || val < 10 || val > 3600) {
            showSaveNotification('❌ ' + languageManager.getText('customTimeInvalid'), true);
            return;
        }
        customInitialTime = val;
        if (pendingChallengeType === CHALLENGE_TYPES.TIMED_LINES) {
            const linesVal = parseInt(extraModalInput.value);
            if (isNaN(linesVal) || linesVal < 1 || linesVal > 500) {
                showSaveNotification('❌ ' + languageManager.getText('customLinesInvalid'), true);
                return;
            }
            customTargetLines = linesVal;
        }
        hidePanel(customTimeModal);
        cameFromChallengeMenu = true;
        startChallengeMode(pendingChallengeType);
        audioSystem.playSound('click');
    });
    timeModalInput.addEventListener('keydown', e => { if (e.key === 'Enter') timeModalConfirm.click(); });
    extraModalInput.addEventListener('keydown', e => { if (e.key === 'Enter') timeModalConfirm.click(); });
}

function refreshVersionList() {
    const list = getVersionList();
    versionSidebar.innerHTML = '';
    const currentLabel = languageManager.getText('currentVersionLabel') || '当前版本';
    list.forEach((v, i) => {
        const item = document.createElement('div');
        item.className = `version-item ${v.current ? 'current-version' : ''}`;
        if (i === currentVersionIndex) item.classList.add('active');
        item.setAttribute('data-current-label', currentLabel);
        item.innerHTML = `<div class="version-number">v${v.version}</div><div class="version-date-sidebar">${v.date}</div>`;
        item.addEventListener('click', () => {
            currentVersionIndex = i;
            document.querySelectorAll('.version-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            showVersionDetail(v);
            audioSystem.playSound('click');
        });
        versionSidebar.appendChild(item);
    });
    if (list.length) {
        if (currentVersionIndex >= list.length) currentVersionIndex = 0;
        showVersionDetail(list[currentVersionIndex]);
    }
}

function initVersionList() {
    currentVersionIndex = 0;
    refreshVersionList();
}
function showVersionDetail(v) {
    if (!v) return;
    detailTitle.textContent = v.title;
    detailSubtitle.textContent = `${languageManager.getText('version')} ${v.version} - ${v.date}`;
    versionDetailContent.innerHTML = `
<p class="version-description">${v.description}</p>
<ul class="version-features">${v.features.map(f => `<li>${f}</li>`).join('')}</ul>`;
    versionDetailContent.scrollTop = 0;
}

window.onload = init;