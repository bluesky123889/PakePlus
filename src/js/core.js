/* ============================================================
 * core.js —— 常量、工具、对话框、存储、全局状态、DOM 引用
 * 定义 window.VP 命名空间，供其他文件使用
 * ============================================================ */

window.VP = window.VP || {};

(function (VP) {
  'use strict';

  // ===== 常量 =====
  VP.DB_NAME = 'VideoPlayerDB';
  VP.DB_VERSION = 1;
  VP.STORE_NAME = 'videos';
  VP.PLAYLIST_KEY = 'playlist';
  VP.CURRENT_KEY = 'currentVideoId';
  VP.SETTINGS_KEY = 'playerSettings';
  VP.SHORTCUTS_KEY = 'playerShortcuts';
  VP.BADGES_KEY = 'playerShowBadges';
  VP.PROGRESS_KEY = 'playerVideoProgress';
  VP.VOLUME_KEY = 'playerVolume';
  VP.PLAYLIST_COLLAPSED_KEY = 'playerPlaylistCollapsed';
  VP.WATCHED_KEY = 'playerWatched';
  VP.RENAME_KEY = 'playerRenames';
  VP.TAGS_KEY = 'playerTags';
  VP.DENSITY_KEY = 'playerDensity';
  VP.SORT_KEY = 'playerSort';
  VP.SORT_DIR_KEY = 'playerSortDir';
  VP.CONFIG_VERSION = 1;
  VP.CONTROLS_HIDE_DELAY = 2500;
  VP.WATCH_THRESHOLD = 0.95;
  VP.LAST_DIR_KEY = 'playerLastVideoDir';
  VP.ROOT_DIRS_KEY = 'playerRootDirs';
  VP.DIR_NAMES_KEY = 'playerDirNames';
  VP.LAST_VIEW_KEY = 'playerLastView';
  VP.FILE_REF_PREFIX = 'fref:';
  VP.SUBTITLE_KEY = 'playerSubtitles';
  VP.SUBTITLE_STYLE_KEY = 'playerSubtitleStyle';
  VP.DIR_PREFIX = 'dir:';
  VP.SUBTITLE_RENDER_MODE_KEY = 'playerSubtitleRenderMode';
  VP.DANMAKU_KEY = 'playerDanmaku';
  VP.DANMAKU_SETTINGS_KEY = 'playerDanmakuSettings'; // 新增弹幕设置存储

  // ===== 字幕默认样式 =====
  VP.DEFAULT_SUBTITLE_STYLE = {
    fontSize: 24,
    color: '#ffffff',
    bgOpacity: 75,
    outline: 2,
    position: 'bottom'
  };

  // ===== 弹幕默认设置 =====
  VP.danmakuSettings = {
    enabled: true,
    fontSize: 25,
    opacity: 0.9,
    area: 75,
    speed: 144
  };

  // ===== 倍速档位 =====
  VP.SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // ===== 默认快捷键 =====
  VP.DEFAULT_SHORTCUTS = {
    playPause: { code: 'Space', label: 'Space', name: '播放 / 暂停', icon: '<path d="M8 5v14l11-7z"/>' },
    seekBack: { code: 'ArrowLeft', label: '←', name: '快退 5 秒', icon: '<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>' },
    seekForward: { code: 'ArrowRight', label: '→', name: '快进 5 秒', icon: '<path d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"/>' },
    volumeUp: { code: 'ArrowUp', label: '↑', name: '音量 +', icon: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>' },
    volumeDown: { code: 'ArrowDown', label: '↓', name: '音量 -', icon: '<path d="M3 9v6h4l5 5V4L7 9H3z"/>' },
    mute: { code: 'KeyM', label: 'M', name: '静音切换', icon: '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>' },
    fullscreen: { code: 'KeyF', label: 'F', name: '全屏切换', icon: '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>' },
    next: { code: 'KeyN', label: 'N', name: '下一个视频', icon: '<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>' },
    prev: { code: 'KeyP', label: 'P', name: '上一个视频', icon: '<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>' },
    settings: { code: 'KeyS', label: 'S', name: '打开 / 关闭设置', icon: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' },
    togglePlaylist: { code: 'KeyB', label: 'B', name: '显示 / 隐藏播放列表', icon: '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>' },
    lock: { code: 'KeyL', label: 'L', name: '锁定 / 解锁控制栏', icon: '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>' }
  };

  // ===== 图标 =====
  VP.ICONS = {
    volumeMute: '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>',
    volumeLow: '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>',
    volumeMid: '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5zm11-5.77v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
    volumeHigh: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
    info: '<path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    tag: '<path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>',
    arrowUp: '<path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>',
    arrowDown: '<path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/>',
    density: '<path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>',
    densityCompact: '<path d="M3 11h18v-2H3v2zm0 4h18v-2H3v2z"/>',
    check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
    first: '<path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/>',
    last: '<path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>',
    close: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
    warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
    folder: '<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>'
  };

  // ===== 全局可变状态 =====
  VP.shortcuts = {};
  VP.editingShortcut = null;
  VP.showKeyBadges = true;

  VP.isDraggingProgress = false;
  VP.currentObjectURL = null;
  VP.hasVideo = false;
  VP.playlist = [];
  VP.currentVideoId = null;
  VP.controlsHideTimer = null;
  VP.osdTimer = null;
  VP.progressSaveTimer = null;
  VP.selectionMode = false;
  VP.selectedIds = new Set();
  VP.settings = { speed: 1, ratio: 'contain', brightness: 100, contrast: 100, saturation: 100 };
  VP.subtitleStyle = { ...VP.DEFAULT_SUBTITLE_STYLE };
  VP.dbPromise = null;

  VP.searchQuery = '';
  VP.activeTag = null;
  VP.menuTargetId = null;

  VP.dragItemId = null;
  VP.dragOverItemId = null;
  VP.dragOverPosition = null;

  VP.previewVideo = null;
  VP.previewTimeout = null;
  VP.previewReady = false;
  VP.lastPreviewTime = -1;

  VP.watchedSet = new Set();
  VP.renameMap = {};
  VP.tagMap = {};
  VP.dirNames = {};
  VP.isCompact = false;
  VP.sortMode = 'manual';
  VP.sortDir = 'asc';

  VP.videoProgress = {};
  VP.volumeDragging = false;
  VP.isLocked = false;
  VP.currentPath = null;
  VP.rootDirs = [];

  VP.rootDragId = null;
  VP.rootDragPath = null;

  // ===== 外挂字幕状态 =====
  VP.currentSubtitles = [];
  VP.subtitleMap = {};
  VP.subtitleLines = [];
  VP.subtitleRenderMode = 'auto';

  // ===== DOM 引用 =====
  function $(id) { return document.getElementById(id); }

  VP.dom = {
    app: $('app'),
    video: $('videoPlayer'),
    playerArea: $('playerArea'),
    placeholder: $('placeholder'),
    dropOverlay: $('dropOverlay'),
    fileInput: $('fileInput'),
    importBtn: $('importBtn'),
    togglePlaylistBtn: $('togglePlaylistBtn'),
    playlistPanel: $('playlistPanel'),
    playlistItems: $('playlistItems'),
    playlistCount: $('playlistCount'),
    playlistDropOverlay: $('playlistDropOverlay'),
    playlistSearchInput: $('playlistSearchInput'),
    playlistSearchClear: $('playlistSearchClear'),
    playlistNoResult: $('playlistNoResult'),
    tagBar: $('tagBar'),
    sortSelect: $('sortSelect'),
    sortDirBtn: $('sortDirBtn'),
    sortDirIcon: $('sortDirIcon'),
    densityBtn: $('densityBtn'),
    densityIcon: $('densityIcon'),
    selectModeBtn: $('selectModeBtn'),
    playlistToolbar: $('playlistToolbar'),
    selectAllCheckbox: $('selectAllCheckbox'),
    selectAllLabel: $('selectAllLabel'),
    batchDeleteBtn: $('batchDeleteBtn'),
    cancelSelectBtn: $('cancelSelectBtn'),
    progressWrap: $('progressWrap'),
    progressTrack: $('progressTrack'),
    progressBuffered: $('progressBuffered'),
    progressPlayed: $('progressPlayed'),
    progressThumb: $('progressThumb'),
    progressHoverTime: $('progressHoverTime'),
    previewThumbnail: $('previewThumbnail'),
    previewCanvas: $('previewCanvas'),
    currentTimeDisplay: $('currentTimeDisplay'),
    durationDisplay: $('durationDisplay'),
    playPauseBtn: $('playPauseBtn'),
    playIcon: $('playIcon'),
    pauseIcon: $('pauseIcon'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    muteBtn: $('muteBtn'),
    volumeUpIcon: $('volumeUpIcon'),
    volumeMuteIcon: $('volumeMuteIcon'),
    fullscreenBtn: $('fullscreenBtn'),
    fullscreenIcon: $('fullscreenIcon'),
    exitFullscreenIcon: $('exitFullscreenIcon'),
    settingsBtn: $('settingsBtn'),
    lockBtn: $('lockBtn'),
    videoControls: $('videoControls'),
    volumePopupWrap: $('volumePopupWrap'),
    volumePopup: $('volumePopup'),
    volumePercent: $('volumePercent'),
    volumeVerticalSlider: $('volumeVerticalSlider'),
    volumeVerticalFill: $('volumeVerticalFill'),
    volumeVerticalThumb: $('volumeVerticalThumb'),
    centerPlayBtn: $('centerPlayBtn'),
    videoLoading: $('videoLoading'),
    osdToast: $('osdToast'),
    osdIcon: $('osdIcon'),
    osdText: $('osdText'),
    osdTime: $('osdTime'),
    resumeToast: $('resumeToast'),
    resumeTitle: $('resumeTitle'),
    resumeSubtitle: $('resumeSubtitle'),
    resumeContinueBtn: $('resumeContinueBtn'),
    resumeRestartBtn: $('resumeRestartBtn'),
    resumeCloseBtn: $('resumeCloseBtn'),
    settingsOverlay: $('settingsOverlay'),
    settingsPanel: $('settingsPanel'),
    settingsClose: $('settingsClose'),
    resetSettings: $('resetSettings'),
    shortcutList: $('shortcutList'),
    resetShortcuts: $('resetShortcuts'),
    toggleBadges: $('toggleBadges'),
    exportConfigBtn: $('exportConfigBtn'),
    importConfigBtn: $('importConfigBtn'),
    configInput: $('configInput'),
    storageBarFill: $('storageBarFill'),
    storageUsed: $('storageUsed'),
    storageQuota: $('storageQuota'),
    itemContextMenu: $('itemContextMenu'),
    menuOpenFolderBtn: $('menuOpenFolderBtn'),
    menuRenameDirBtn: $('menuRenameDirBtn'),
    menuRenameDirText: $('menuRenameDirText'),
    menuPlayBtn: $('menuPlayBtn'),
    menuInfoBtn: $('menuInfoBtn'),
    menuTagsBtn: $('menuTagsBtn'),
    menuRenameBtn: $('menuRenameBtn'),
    menuRenameText: $('menuRenameText'),
    menuDeleteBtn: $('menuDeleteBtn'),
    menuDeleteText: $('menuDeleteText'),
    loadingToast: $('loadingToast'),
    loadingText: $('loadingText'),
    dialogOverlay: $('dialogOverlay'),
    dialogBox: $('dialogBox'),
    dialogTitleText: $('dialogTitleText'),
    dialogMessage: $('dialogMessage'),
    dialogInput: $('dialogInput'),
    dialogCheckboxRow: $('dialogCheckboxRow'),
    dialogCheckbox: $('dialogCheckbox'),
    dialogCheckboxLabel: $('dialogCheckboxLabel'),
    dialogOkBtn: $('dialogOkBtn'),
    dialogCancelBtn: $('dialogCancelBtn'),
    dialogIconSvg: $('dialogIconSvg'),
    splash: $('splash'),
    aboutEnvValue: $('aboutEnvValue'),
    openFolderBtn: $('openFolderBtn'),
    checkFilesBtn: $('checkFilesBtn'),
    folderRefreshBtn: $('folderRefreshBtn'),
    folderPathBar: $('folderPathBar'),
    folderPathText: $('folderPathText'),
    folderPathBackBtn: $('folderPathBackBtn'),
    // 字幕
    subtitleOverlay: $('subtitleOverlay'),
    subtitleBtn: $('subtitleBtn'),
    subtitleInput: $('subtitleInput'),
    // 字幕设置 UI
    subtitleFontSizeSlider: $('subtitleFontSizeSlider'),
    subtitleFontSizeValue: $('subtitleFontSizeValue'),
    subtitleBgOpacitySlider: $('subtitleBgOpacitySlider'),
    subtitleBgOpacityValue: $('subtitleBgOpacityValue'),
    subtitleOutlineSlider: $('subtitleOutlineSlider'),
    subtitleOutlineValue: $('subtitleOutlineValue'),
    subtitlePositionControl: $('subtitlePositionControl'),
    subtitlePreviewBox: $('subtitlePreviewBox'),
    subtitlePreviewText: $('subtitlePreviewText'),
    resetSubtitleSettings: $('resetSubtitleSettings'),
    videoWrapper: $('videoWrapper'),
    // 字幕浮层
    subtitlePopupWrap: $('subtitlePopupWrap'),
    subtitlePopup: $('subtitlePopup'),
    subtitleOffsetValue: $('subtitleOffsetValue'),
    subOffsetMinus: $('subOffsetMinus'),
    subOffsetPlus: $('subOffsetPlus'),
    loadSubBtn: $('loadSubBtn'),
    // 倍速浮层
    speedPopupWrap: $('speedPopupWrap'),
    speedPopup: $('speedPopup'),
    speedBtn: $('speedBtn'),
    speedBtnLabel: $('speedBtnLabel'),
    speedControlPopup: $('speedControlPopup'),
    speedPopupValue: $('speedPopupValue'),
    // 弹幕浮层
    danmakuOverlay: $('danmakuOverlay'),
    danmakuBtn: $('danmakuBtn'),
    danmakuInput: $('danmakuInput'),
    danmakuPopupWrap: $('danmakuPopupWrap'),
    danmakuPopup: $('danmakuPopup'),
    toggleDanmaku: $('toggleDanmaku'),
    danmakuFontSizeSlider: $('danmakuFontSizeSlider'),
    danmakuFontSizeValue: $('danmakuFontSizeValue'),
    danmakuOpacitySlider: $('danmakuOpacitySlider'),
    danmakuOpacityValue: $('danmakuOpacityValue'),
    danmakuAreaSlider: $('danmakuAreaSlider'),
    danmakuAreaValue: $('danmakuAreaValue'),
    danmakuSpeedSlider: $('danmakuSpeedSlider'),
    danmakuSpeedValue: $('danmakuSpeedValue'),
    loadDanmakuBtn: $('loadDanmakuBtn'),
  };

  // ===== 工具函数 =====
  VP.formatTime = function (seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  VP.formatSize = function (bytes) {
    if (bytes === -1 || bytes === null || bytes === undefined) return '—';
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  VP.formatDate = function (timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  VP.escapeHtml = function (str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  };

  VP.escapeTextKeepBr = function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&lt;br&gt;/g, '<br>');
  };

  VP.showToast = function (text) {
    VP.dom.loadingText.textContent = text;
    VP.dom.loadingToast.classList.add('show');
  };
  VP.hideToast = function () { VP.dom.loadingToast.classList.remove('show'); };

  VP.showOSD = function (icon, text, timeInfo) {
    VP.dom.osdIcon.innerHTML = icon;
    VP.dom.osdText.textContent = text;
    if (timeInfo) {
      VP.dom.osdTime.textContent = timeInfo;
      VP.dom.osdTime.style.display = 'block';
    } else {
      VP.dom.osdTime.style.display = 'none';
    }
    VP.dom.osdToast.classList.add('show');
    if (VP.osdTimer) clearTimeout(VP.osdTimer);
    VP.osdTimer = setTimeout(() => VP.dom.osdToast.classList.remove('show'), 900);
  };

  VP.currentTimeInfo = function () {
    if (!VP.hasVideo || !VP.dom.video.duration || isNaN(VP.dom.video.duration)) return '';
    return `${VP.formatTime(VP.dom.video.currentTime)} / ${VP.formatTime(VP.dom.video.duration)}`;
  };

  // ===== 自定义对话框 =====
  VP.showDialog = function (options) {
    const dom = VP.dom;
    return new Promise((resolve) => {
      const type = options.type || 'alert';
      const title = options.title || (type === 'alert' ? '提示' : type === 'confirm' ? '确认' : '输入');
      const message = options.message || '';
      const defaultValue = options.defaultValue || '';
      const okText = options.okText || '确定';
      const cancelText = options.cancelText || '取消';
      const danger = !!options.danger;
      const customHTML = options.customHTML || null;
      const onOk = typeof options.onOk === 'function' ? options.onOk : null;
      const onOpen = typeof options.onOpen === 'function' ? options.onOpen : null;

      let iconPath = VP.ICONS.info;
      if (type === 'confirm' && danger) {
        iconPath = '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>';
      } else if (type === 'prompt') {
        iconPath = '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>';
      }
      dom.dialogIconSvg.innerHTML = iconPath;

      dom.dialogTitleText.textContent = title;
      if (customHTML) dom.dialogMessage.innerHTML = customHTML;
      else dom.dialogMessage.textContent = message;
      dom.dialogMessage.style.display = (message || customHTML) ? 'block' : 'none';

      dom.dialogOkBtn.textContent = okText;
      dom.dialogOkBtn.className = 'dialog-btn ' + (danger ? 'danger' : 'primary');
      dom.dialogCancelBtn.textContent = cancelText;

      if (type === 'prompt') {
        dom.dialogInput.style.display = 'block';
        dom.dialogInput.value = defaultValue;
        dom.dialogCancelBtn.style.display = 'block';
      } else if (type === 'confirm') {
        dom.dialogInput.style.display = 'none';
        dom.dialogCancelBtn.style.display = 'block';
      } else {
        dom.dialogInput.style.display = 'none';
        dom.dialogCancelBtn.style.display = 'none';
      }

      const cbOptions = options.checkbox;
      if (cbOptions && dom.dialogCheckboxRow) {
        dom.dialogCheckboxRow.style.display = 'flex';
        dom.dialogCheckboxLabel.textContent = cbOptions.label || '';
        dom.dialogCheckbox.checked = !!cbOptions.defaultChecked;
        dom.dialogCheckboxRow.classList.toggle('danger', !!cbOptions.danger);
      } else if (dom.dialogCheckboxRow) {
        dom.dialogCheckboxRow.style.display = 'none';
      }

      dom.dialogOverlay.classList.add('show');

      if (type === 'prompt') {
        setTimeout(() => {
          dom.dialogInput.focus();
          dom.dialogInput.select();
        }, 100);
      }

      if (onOpen) {
        setTimeout(() => { try { onOpen(); } catch (e) { console.error(e); } }, 60);
      }

      function cleanup() {
        dom.dialogOverlay.classList.remove('show');
        dom.dialogOkBtn.onclick = null;
        dom.dialogCancelBtn.onclick = null;
        dom.dialogInput.onkeydown = null;
        document.removeEventListener('keydown', keyHandler);
      }

      function keyHandler(e) {
        if (e.code === 'Escape') {
          e.preventDefault(); e.stopPropagation();
          cleanup();
          if (type === 'confirm') resolve(false);
          else if (type === 'prompt') resolve(null);
          else resolve(true);
        }
        if (e.code === 'Enter') {
          if (type === 'prompt' && document.activeElement === dom.dialogInput) {
            e.preventDefault();
            const val = dom.dialogInput.value;
            cleanup();
            resolve(val);
          }
        }
      }
      document.addEventListener('keydown', keyHandler, true);

      dom.dialogOkBtn.onclick = () => {
        let result;
        if (type === 'prompt') result = dom.dialogInput.value;
        else if (options.checkbox) result = { ok: true, checked: dom.dialogCheckbox.checked };
        else result = true;

        if (onOk) {
          let shouldClose = true;
          try { shouldClose = onOk(result); } catch (e) { console.error(e); }
          if (shouldClose === false) return;
        }

        cleanup();
        resolve(result);
      };

      dom.dialogCancelBtn.onclick = () => {
        cleanup();
        if (type === 'confirm') resolve(false);
        else if (type === 'prompt') resolve(null);
        else resolve(false);
      };
    });
  };

  VP.dlgAlert = (message, title) => VP.showDialog({ type: 'alert', message, title });
  VP.dlgConfirm = (message, title, opts) => VP.showDialog({ type: 'confirm', message, title, ...(opts || {}) });
  VP.dlgPrompt = (message, defaultValue, title) => VP.showDialog({ type: 'prompt', message, defaultValue, title });

  // ===== IndexedDB =====
  VP.openDB = function () {
    if (VP.dbPromise) return VP.dbPromise;
    VP.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(VP.DB_NAME, VP.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(VP.STORE_NAME)) {
          db.createObjectStore(VP.STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return VP.dbPromise;
  };

  VP.dbGetAll = async function () {
    const db = await VP.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VP.STORE_NAME, 'readonly');
      const req = tx.objectStore(VP.STORE_NAME).getAll();
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  };

  VP.dbGet = async function (id) {
    const db = await VP.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VP.STORE_NAME, 'readonly');
      const req = tx.objectStore(VP.STORE_NAME).get(id);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  };

  VP.dbPut = async function (record) {
    const db = await VP.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VP.STORE_NAME, 'readwrite');
      const req = tx.objectStore(VP.STORE_NAME).put(record);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  };

  VP.dbDelete = async function (id) {
    const db = await VP.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VP.STORE_NAME, 'readwrite');
      const req = tx.objectStore(VP.STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  };

  // ===== 文件夹 / 路径工具 =====
  VP.isDirNode = function (item) {
    return !!(item && item.type === 'dir');
  };

  VP.isRefOrDir = function (item) {
    return VP.isFileRef(item) || VP.isDirNode(item);
  };

  VP.getViewItems = function () {
    if (VP.searchQuery) {
      return {
        dirs: [],
        videos: VP.playlist.filter(v => !VP.isDirNode(v))
      };
    }

    if (VP.currentPath === null) {
      return {
        dirs: VP.playlist.filter(v => VP.isDirNode(v) && VP.rootDirs.includes(v.path)),
        videos: VP.playlist.filter(v => !VP.isDirNode(v) && !v.path)
      };
    }

    return {
      dirs: VP.playlist.filter(v => VP.isDirNode(v) && VP.dirname(v.path) === VP.currentPath),
      videos: VP.playlist.filter(v => !VP.isDirNode(v) && VP.dirname(v.path) === VP.currentPath)
    };
  };

  VP.getVisibleVideos = function () {
    return VP.getViewItems().videos;
  };

  VP.isRootVideo = function (item) {
    if (!item.path) return false;
    const parent = VP.dirname(item.path);
    return VP.rootDirs.includes(parent);
  };

  VP.splitPath = function (fullPath) {
    if (!fullPath) return [];
    const sep = fullPath.includes('\\') ? '\\' : '/';
    const parts = fullPath.split(sep);
    return parts.filter((p, i) => p !== '' || i === 0);
  };

})(window.VP);