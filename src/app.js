(function() {
  window._ = function(key) {
    const p = window.LangPack && window.I18n && window.LangPack[window.I18n.currentLang];
    return (p && p[key]) || key;
  };

  window.showToast = function(msg, duration = 2000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  };

  const TAURI = window.__TAURI__ || null;
  const isTauri = !!(TAURI && TAURI.dialog && TAURI.fs);

  function toAssetUrl(absPath) {
    if (!isTauri) return absPath;
    if (window.__TAURI__?.core?.convertFileSrc) {
      return window.__TAURI__.core.convertFileSrc(absPath);
    }
    let p = String(absPath).replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    const isWindows = navigator.userAgent.includes('Windows');
    return isWindows ? `https://asset.localhost${p}` : `asset://localhost${p}`;
  }

  function baseName(p) { return String(p).replace(/\\/g, '/').split('/').pop(); }
  function joinPath(dir, name) { return String(dir).replace(/[\\/]+$/, '') + '/' + name; }

  const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mkv|avi|mov)$/i;
  const SUB_EXT_RE = /\.(ass|ssa|srt|txt)$/i;

  const NS = window.Auth ? window.Auth.namespace : 'guest_';
  const storage = {
    get: (key) => localStorage.getItem(NS + key),
    set: (key, val) => localStorage.setItem(NS + key, val),
    remove: (key) => localStorage.removeItem(NS + key)
  };

  const IDB_VERSION = 1;
  const IDB_STORE = 'files';
  let _idbPromise = null;

  function openIDB() {
    if (_idbPromise) return _idbPromise;
    _idbPromise = new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const DB_NAME = `video_player_db_${NS}`; 
      const req = indexedDB.open(DB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return _idbPromise;
  }

  async function idbPut(record) {
    const db = await openIDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  async function idbGetAll() {
    const db = await openIDB();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  }

  async function idbClear() {
    const db = await openIDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }

  const $ = (id) => document.getElementById(id);
  
// ===== 禁止播放器区域默认右键菜单（放行输入框） =====
  document.addEventListener('contextmenu', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      return;
    }
    e.preventDefault();
  }, { capture: true });

  const playerContainer = $('playerContainer');
  const mainArea = $('mainArea');
  const video = $('video');
  const placeholder = $('placeholder');
  const videoLoading = $('videoLoading');
  const importBtn = $('importBtn');
  const fileInput = $('fileInput');
  const controlsWrapper = $('controlsWrapper');

  const playPauseBtn = $('playPauseBtn');
  const playIcon = $('playIcon');
  const pauseIcon = $('pauseIcon');
  const prevBtn = $('prevBtn');
  const nextBtn = $('nextBtn');
  const timeDisplay = $('timeDisplay');

  const progressBarContainer = $('progressBarContainer');
  const progressBar = $('progressBar');
  const bufferedBar = $('bufferedBar');

  const previewTooltip = $('previewTooltip');
  const previewCanvas = $('previewCanvas');
  const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
  const previewTime = $('previewTime');
  const thumbVideo = document.createElement('video');
  thumbVideo.muted = true;
  thumbVideo.playsInline = true;

  const episodePopover = $('episodePopover');
  const episodeList = $('episodeList');
  const speedPopover = $('speedPopover');
  const volumePopover = $('volumePopover');
  const volumeUpIcon = $('volumeUpIcon');
  const volumeMuteIcon = $('volumeMuteIcon');
  const volumeSlider = $('volumeSlider');
  const volumePercent = $('volumePercent');
  const settingsPopover = $('settingsPopover');

  const fullscreenBtn = $('fullscreenBtn');
  const fullscreenEnterIcon = $('fullscreenEnterIcon');
  const fullscreenExitIcon = $('fullscreenExitIcon');
  const pipBtn = $('pipBtn');
  const toast = $('toast');

  const topTitle = $('topTitle');
  const topTime = $('topTime');
  const moreBtn = $('moreBtn');

  const modalBackdrop = $('modalBackdrop');
  const infoModal = $('infoModal');
  const closeInfoBtn = $('closeInfoBtn');
  const infoName = $('infoName');
  const infoSize = $('infoSize');
  const infoDuration = $('infoDuration');
  const infoResolution = $('infoResolution');
  const infoFormat = $('infoFormat');

  const confirmModal = $('confirmModal');
  const confirmTitle = $('confirmTitle');
  const confirmText = $('confirmText');
  const deleteSourceGroup = $('deleteSourceGroup');
  const deleteSourceCheck = $('deleteSourceCheck');
  const confirmCancelBtn = $('confirmCancelBtn');
  const confirmOkBtn = $('confirmOkBtn');

  const inputModal       = $('inputModal');
  const inputModalTitle  = $('inputModalTitle');
  const inputModalField  = $('inputModalField');
  const inputModalHint   = $('inputModalHint');
  const inputCancelBtn   = $('inputCancelBtn');
  const inputOkBtn       = $('inputOkBtn');

  const matchModal       = $('matchModal');
  const matchOldList     = $('matchOldList');
  const matchInputField  = $('matchInputField');
  const matchCancelBtn   = $('matchCancelBtn');
  const matchOkBtn       = $('matchOkBtn');

  const speedIndicator = $('speedIndicator');
  const volumeToast = $('volumeToast');
  const volumeToastText = $('volumeToastText');

  const seekOsd = $('seekOsd');
  const seekOsdText = $('seekOsdText');
  const seekOsdDir = $('seekOsdDir');

  const resumeTip = $('resumeTip');
  const resumeTipText = $('resumeTipText');
  const resumeRestartBtn = $('resumeRestartBtn');
  const resumeCloseBtn = $('resumeCloseBtn');

  const playlistPanel = $('playlistPanel');
  const togglePlaylistTab = $('togglePlaylistTab');
  const toggleIcon = $('toggleIcon');
  const playlistBody = $('playlistBody');
  const playlistEmpty = $('playlistEmpty');
  const playlistCount = $('playlistCount');
  const addVideoBtn = $('addVideoBtn');
  const addFolderBtn = $('addFolderBtn');
  const manageBtn = $('manageBtn');
  const searchInput = $('searchInput');
  const folderSelectorWrapper = $('folderSelectorWrapper');
  const folderSelect = $('folderSelect');
  const playlistFooter = $('playlistFooter');
  const batchDeleteBtn = $('batchDeleteBtn');
  const selectAllCheck = $('selectAllCheck');
  const selectedCount = $('selectedCount');

  const settingLoop = $('settingLoop');
  const settingAutoNext = $('settingAutoNext');
  const fitOptions = document.querySelectorAll('.fit-option');

  const sideDrawer = $('sideDrawer');
  const drawerBackdrop = $('drawerBackdrop');
  const drawerCloseBtn = $('drawerCloseBtn');
  
  const shortcutList = $('shortcutList');
  const resetShortcutBtn = $('resetShortcutBtn');

  const skipIntroBtn = $('skipIntroBtn');
  const skipHintText = $('skipHintText');

  const screenLockBtn = $('screenLockBtn');
  const screenUnlockBtn = $('screenUnlockBtn');
  const mainAreaEl = $('mainArea');
  let isScreenLocked = false;
  let isLockUiVisible = true;

  let showKbd = false;
  try { showKbd = JSON.parse(storage.get('video_shortcut_show')) || false; } catch(e) {}
  function toggleKbdDisplay(val) {
    showKbd = val;
    storage.set('video_shortcut_show', JSON.stringify(showKbd));
    document.body.classList.toggle('show-kbd', showKbd);
    const toggleEl = $('settingShowKbd');
    if (toggleEl) toggleEl.classList.toggle('active', showKbd);
  }

  let playlist = [];
  let currentVideoId = null;
  let idCounter = 0;
  let toastTimer = null;
  let volToastTimer = null;

  let isLoop = false;
  let isAutoNext = true;
  let currentFit = 'contain';
  let isDraggingProgress = false;
  let isManaging = false;
  let selectedIds = new Set();

  let isLongPressing = false;
  let longPressTimer = null;
  let originalPlaybackRate = 1.0;

  const speeds = [2.0, 1.5, 1.25, 1.0, 0.75, 0.5];
  let currentSpeed = 1.0;

  let isRestoring = true; 

  try {
    const savedState = JSON.parse(storage.get('video_player_state'));
    if (savedState) {
      isLoop = !!savedState.loop;
      isAutoNext = savedState.autoNext !== false;
      if (typeof savedState.speed === 'number' && speeds.includes(savedState.speed)) {
        currentSpeed = savedState.speed;
      }
    }
  } catch(e) {}

  function savePlayerState() {
    try {
      storage.set('video_player_state', JSON.stringify({
        loop: isLoop,
        autoNext: isAutoNext,
        speed: currentSpeed
      }));
    } catch(e) {}
  }

    // ================= 视频加载动画控制 =================
  let videoLoadingToken = 0;
  let videoLoadingTimer = null;

  function showVideoLoading() {
    if (!videoLoading) return;
    videoLoading.classList.add('show');
    clearTimeout(videoLoadingTimer);
    videoLoadingTimer = setTimeout(() => hideVideoLoading(), 10000);
  }

  function hideVideoLoading() {
    if (!videoLoading) return;
    videoLoading.classList.remove('show');
    clearTimeout(videoLoadingTimer);
    videoLoadingTimer = null;
  }
  // ======================================================

  let previewReqId = 0;
  const thumbCache = new Map();
  let lastThumbTime = 0;
  let uiTimeout = null;

  let targetLeft = 0;
  let currentLeft = 0;
  let isAnimatingPreview = false;

  const ALL_VIDEOS_KEY = '__ALL_VIDEOS__';
  const UNCATEGORIZED_KEY = '__UNCATEGORIZED__';

  function ALL_VIDEOS() { return ALL_VIDEOS_KEY; }

  function folderDisplayName(folder) {
    if (!folder || folder === UNCATEGORIZED_KEY) return _('uncategorized');
    if (folder === ALL_VIDEOS_KEY) return _('allVideos');
    return folder;
  }

  let activeFolderFilter = null;

  const PLAYLIST_META_KEY = 'video_playlist_meta';
  const LAST_PLAYED_KEY = 'video_last_played';

  async function savePlaylist() {
    try {
      const tauriItems = playlist
        .filter(p => p.isTauriPath && p.localPath)
        .map(p => ({
          name: p.name,
          size: p.file.size,
          path: p.localPath,
          folder: p.folder,
          subtitleRaw: p.subtitle?.rawText || null
        }));

      const browserItems = [];
      for (const p of playlist) {
        if (p.isTauriPath) continue;
        if (!(p.file instanceof File)) continue;
        const key = p.name + '_' + p.file.size;
        browserItems.push({
          key,
          name: p.name,
          size: p.file.size,
          folder: p.folder,
          subtitleRaw: p.subtitle?.rawText || null,
          file: p.file
        });
      }

      storage.set(PLAYLIST_META_KEY, JSON.stringify({
        tauri: tauriItems,
        browserKeys: browserItems.map(b => b.key)
      }));

      if (browserItems.length > 0) {
        await idbClear();
        for (const item of browserItems) {
          await idbPut(item);
        }
      } else {
        await idbClear();
      }

      const lastItem = playlist.find(p => p.id === currentVideoId);
      if (lastItem) {
        storage.set(LAST_PLAYED_KEY, JSON.stringify({
          name: lastItem.name,
          size: lastItem.file.size,
          isTauriPath: !!lastItem.isTauriPath,
          path: lastItem.localPath || null
        }));
      } else {
        storage.remove(LAST_PLAYED_KEY);
      }
    } catch (e) {
      console.warn('[Playlist] save failed', e);
    }
  }

  async function restorePlaylist() {
    let meta = null;
    try { meta = JSON.parse(storage.get(PLAYLIST_META_KEY)); } catch(e) {}
    if (!meta) return;

    const restored = [];

    if (isTauri && Array.isArray(meta.tauri)) {
      for (const s of meta.tauri) {
        try {
          const stat = await TAURI.fs.stat(s.path);
          restored.push({
            name: s.name,
            size: stat.size,
            path: s.path,
            folder: s.folder,
            _subtitleRaw: s.subtitleRaw || null,
            _source: 'tauri'
          });
        } catch (e) {
          console.warn('[Playlist] missing file, skip:', s.path);
        }
      }
    }

    const browserKeys = Array.isArray(meta.browserKeys) ? meta.browserKeys : [];
    if (browserKeys.length > 0) {
      const records = await idbGetAll();
      const byKey = new Map(records.map(r => [r.key, r]));
      for (const key of browserKeys) {
        const rec = byKey.get(key);
        if (!rec || !rec.file) continue;
        restored.push({
          name: rec.name,
          size: rec.size,
          file: rec.file,
          folder: rec.folder,
          _subtitleRaw: rec.subtitleRaw || null,
          _source: 'browser'
        });
      }
    }

    if (restored.length === 0) return;

    addVideos(restored, true);

    playlist.forEach(item => {
      let src = null;
      if (item.isTauriPath) {
        src = restored.find(r => r.path === item.localPath);
      } else {
        src = restored.find(r => r.name === item.name && r.size === item.file.size && r._source === 'browser');
      }
      if (src && src._subtitleRaw) {
        item.subtitle = { rawText: src._subtitleRaw };
        if (currentVideoId === item.id && window.Subtitle) {
          Subtitle.setCues(src._subtitleRaw, item);
        }
      }
    });

    let last = null;
    try { last = JSON.parse(storage.get(LAST_PLAYED_KEY)); } catch(e) {}
    if (last) {
      let target = null;
      if (last.isTauriPath && last.path) {
        target = playlist.find(p => p.localPath === last.path);
      } else {
        target = playlist.find(p => p.name === last.name && p.file.size === last.size);
      }
      if (target) {
        playVideoById(target.id);
      }
    }
  }

  function showPlaylistSkeleton() {
    if (playlistBody) {
      playlistBody.innerHTML = `
        <div class="playlist-empty" id="playlistSkeleton">
          <div class="skeleton-spinner"></div>
          <span style="margin-top: 12px; color: #666; font-size: 13px;">${_('loading') || '加载中...'}</span>
        </div>
      `;
    }
  }

  let shortcuts = {
    playPause: 'Space',
    prev: 'ArrowLeft',
    next: 'ArrowRight',
    mute: 'KeyM',
    volUp: 'ArrowUp',
    volDown: 'ArrowDown',
    fullscreen: 'KeyF',
    subtitle: 'KeyC',
    playlist: 'KeyL',
    lockScreen: 'KeyB',
    markIntroStart: 'KeyO',
    markIntroEnd: 'KeyP',
    markOutroStart: 'KeyE',
    markOutroEnd: 'KeyD'
  };

  try {
    const saved = JSON.parse(storage.get('video_shortcut_pref'));
    if (saved) Object.assign(shortcuts, saved);
  } catch(e) {}

  function saveShortcuts() { storage.set('video_shortcut_pref', JSON.stringify(shortcuts)); }

  function formatKeyName(code) {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Arrow')) return code.replace('Arrow', '');
    if (code === 'Space') return 'Space';
    if (code.startsWith('Digit')) return code.slice(5);
    const map = { Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
      BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=',
      Backquote: '`', Enter: 'Enter', Tab: 'Tab', Escape: 'Esc' };
    if (map[code]) return map[code];
    if (code.startsWith('F') && /^F\d+$/.test(code)) return code;
    return code;
  }

  function renderShortcuts() {
    if (!shortcutList) return;
    shortcutList.innerHTML = '';
    const actions = [
      { key: 'playPause', label: _('scPlayPause') },
      { key: 'prev', label: _('scPrev') },
      { key: 'next', label: _('scNext') },
      { key: 'mute', label: _('scMute') },
      { key: 'volUp', label: _('scVolUp') },
      { key: 'volDown', label: _('scVolDown') },
      { key: 'fullscreen', label: _('scFullscreen') },
      { key: 'subtitle', label: _('scSubtitle') },
      { key: 'playlist', label: _('scPlaylist') },
      { key: 'lockScreen', label: _('scLockScreen') },
      { key: 'markIntroStart', label: _('scMarkIntroStart') },
      { key: 'markIntroEnd', label: _('scMarkIntroEnd') },
      { key: 'markOutroStart', label: _('scMarkOutroStart') },
      { key: 'markOutroEnd', label: _('scMarkOutroEnd') }
    ];

    actions.forEach(act => {
      const div = document.createElement('div');
      div.className = 'shortcut-item';
      div.innerHTML = `<span>${act.label}</span><div class="shortcut-key" data-key="${act.key}">${formatKeyName(shortcuts[act.key])}</div>`;
      shortcutList.appendChild(div);
    });

    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'drawer-switch-row';
    toggleDiv.style.marginTop = '16px';
    toggleDiv.innerHTML = `<span>${_('shortcutShowKbd')}</span><div class="toggle-switch ${showKbd ? 'active' : ''}" id="settingShowKbd"></div>`;
    shortcutList.appendChild(toggleDiv);

    $('settingShowKbd')?.addEventListener('click', function() {
      toggleKbdDisplay(!showKbd);
      this.classList.toggle('active', showKbd);
    });

    let recordingKey = null;
    document.querySelectorAll('.shortcut-key').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (recordingKey) recordingKey.classList.remove('recording');
        el.classList.add('recording');
        el.textContent = _('pressKey');
        recordingKey = el;
      });
    });

    if (!window._keydownBound) {
      window._keydownBound = true;
      document.addEventListener('keydown', (e) => {
        const recordingEl = document.querySelector('.shortcut-key.recording');
        if (recordingEl) {
          e.preventDefault();
          e.stopPropagation();
          const code = e.code;
          const keyName = recordingEl.getAttribute('data-key');
          if (keyName) {
            shortcuts[keyName] = code;
            saveShortcuts();
            recordingEl.textContent = formatKeyName(code);
            recordingEl.classList.remove('recording');
            updateShortcutUI();
          }
          return;
        }

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || !video || !video.src) return;

        const code = e.code;
        if (code === shortcuts.playPause) { e.preventDefault(); togglePlay(); }
        else if (code === shortcuts.prev) { e.preventDefault(); seekTo(video.currentTime - 5); }
        else if (code === shortcuts.next) { e.preventDefault(); seekTo(video.currentTime + 5); }
        else if (code === shortcuts.mute) { e.preventDefault(); toggleMute(); }
        else if (code === shortcuts.volUp) { e.preventDefault(); adjustVolume(0.05); }
        else if (code === shortcuts.volDown) { e.preventDefault(); adjustVolume(-0.05); }
        else if (code === shortcuts.fullscreen) { e.preventDefault(); toggleFullscreen(); }
        else if (code === shortcuts.subtitle) { e.preventDefault(); if (window.Subtitle) Subtitle.toggle(); }
        else if (code === shortcuts.playlist) { e.preventDefault(); playlistPanel?.classList.toggle('collapsed'); updateTabUI(); showUI(); }
        else if (code === shortcuts.lockScreen) { e.preventDefault(); toggleScreenLock(!isScreenLocked); }
        else if (code === shortcuts.markIntroStart) { e.preventDefault(); markSkipTime('introStart'); }
        else if (code === shortcuts.markIntroEnd) { e.preventDefault(); markSkipTime('introEnd'); }
        else if (code === shortcuts.markOutroStart) { e.preventDefault(); markSkipTime('outroStart'); }
        else if (code === shortcuts.markOutroEnd) { e.preventDefault(); markSkipTime('outroEnd'); }
        else if (code === 'Escape') {
          if (sideDrawer?.classList.contains('show')) closeDrawer();
          else if (inputModal?.classList.contains('show')) closeInputModal();
          else if (infoModal?.classList.contains('show')) closeVideoInfo();
          else if (confirmModal?.classList.contains('show')) closeConfirm();
        }
      });
    }
  }

  window.renderShortcuts = renderShortcuts;

  function updateShortcutUI() {
    const bind = (el, key) => {
      if (!el) return;
      let hint = el.querySelector('.kbd-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'kbd-hint';
        el.appendChild(hint);
      }
      hint.textContent = formatKeyName(shortcuts[key]);
    };
    bind($('playPauseBtn'), 'playPause');
    bind($('prevBtn'), 'prev');
    bind($('nextBtn'), 'next');
    bind($('muteBtn'), 'mute');
    bind($('fullscreenBtn'), 'fullscreen');
    bind($('subtitleBtn'), 'subtitle');
    bind($('togglePlaylistTab'), 'playlist');
    bind($('screenLockBtn'), 'lockScreen');
    bind($('screenUnlockBtn'), 'lockScreen');
  }

  if (resetShortcutBtn) {
    resetShortcutBtn.addEventListener('click', () => {
      shortcuts = {
        playPause: 'Space',
        prev: 'ArrowLeft',
        next: 'ArrowRight',
        mute: 'KeyM',
        volUp: 'ArrowUp',
        volDown: 'ArrowDown',
        fullscreen: 'KeyF',
        subtitle: 'KeyC',
        playlist: 'KeyL',
        lockScreen: 'KeyB',
        markIntroStart: 'KeyO',
        markIntroEnd: 'KeyP',
        markOutroStart: 'KeyE',
        markOutroEnd: 'KeyD'
      };
      saveShortcuts();
      renderShortcuts();
      updateShortcutUI();
      showToast(_('resetShortcut'));
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '--:--';
    const totalSec = Math.floor(seconds);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function showToast(msg, duration = 2000) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    volumeToast?.classList.remove('show');
    speedIndicator?.classList.remove('show');
    if (seekOsd) seekOsd.classList.remove('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function showVolumeToast() {
    if (!volumeToast) return;
    volumeToast.classList.add('show');
    toast?.classList.remove('show');
    speedIndicator?.classList.remove('show');
    if (seekOsd) seekOsd.classList.remove('show');
    clearTimeout(volToastTimer);
    volToastTimer = setTimeout(() => volumeToast.classList.remove('show'), 1000);
  }

  let seekOsdTimer = null;
  function showSeekOsd(delta, targetTime, duration) {
    if (!seekOsd) return;
    const isFwd = delta >= 0;
    seekOsdDir.textContent = isFwd ? _('seekForward') : _('seekBackward');
    seekOsdDir.style.color = isFwd ? '#6c5ce7' : '#ff9f43';
    seekOsdText.textContent = `${formatTime(targetTime)} / ${formatTime(duration)}`;
    seekOsd.classList.add('show');
    toast?.classList.remove('show');
    volumeToast?.classList.remove('show');
    speedIndicator?.classList.remove('show');
    clearTimeout(seekOsdTimer);
    seekOsdTimer = setTimeout(() => seekOsd.classList.remove('show'), 900);
  }

  function seekTo(targetTime) {
    if (!video || !video.src || !video.duration) return;
    const clamped = Math.max(0, Math.min(video.duration, targetTime));
    const delta = clamped - video.currentTime;
    video.currentTime = clamped;
    if (Math.abs(delta) >= 0.5) showSeekOsd(delta, clamped, video.duration);
  }

  function adjustVolume(delta) {
    if (!video || !video.src) return;
    const newVol = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVol;
    video.muted = (newVol === 0);
    updateVolumeUI();
    showVolumeToast();
  }

  let resumeTipTimer = null;
  const RESUME_TIP_DURATION = 5000;

  function showResumeTip(time) {
    if (!resumeTip) return;
    resumeTipText.innerHTML = `<b>${formatTime(time)}</b>`;
    resumeTip.classList.add('show');
    clearTimeout(resumeTipTimer);
    resumeTipTimer = setTimeout(hideResumeTip, RESUME_TIP_DURATION);
  }

  function hideResumeTip() {
    if (!resumeTip) return;
    resumeTip.classList.remove('show');
    clearTimeout(resumeTipTimer);
    resumeTipTimer = null;
  }

  if (resumeRestartBtn) {
    resumeRestartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!video || !video.src) return;
      video.currentTime = 0;
      hideResumeTip();
      showToast(_('playFromStartTip'));
    });
  }

  if (resumeCloseBtn) {
    resumeCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideResumeTip();
    });
  }

  if (resumeTip) {
    resumeTip.addEventListener('mouseenter', () => {
      clearTimeout(resumeTipTimer);
      resumeTipTimer = null;
    });
    resumeTip.addEventListener('mouseleave', () => {
      clearTimeout(resumeTipTimer);
      resumeTipTimer = setTimeout(hideResumeTip, RESUME_TIP_DURATION);
    });
  }

  function setControlsEnabled(enabled) {
    document.querySelectorAll('.control-btn').forEach(btn => btn.disabled = !enabled);
    if (volumeSlider) volumeSlider.disabled = !enabled;
    if (controlsWrapper) controlsWrapper.classList.toggle('disabled', !enabled);
  }

  function updatePlayIcon() {
    if (!video) return;
    if (playIcon) playIcon.style.display = video.paused ? 'block' : 'none';
    if (pauseIcon) pauseIcon.style.display = video.paused ? 'none' : 'block';
  }

  function updateTimeDisplay() {
    if (!video) return;
    if (timeDisplay) timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    if (video.duration > 0 && !isDraggingProgress && progressBar) {
      progressBar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    }
  }

  function updateBuffered() {
    if (!video) return;
    if (video.buffered.length > 0 && video.duration > 0 && bufferedBar) {
      bufferedBar.style.width = `${(video.buffered.end(video.buffered.length - 1) / video.duration) * 100}%`;
    } else if (bufferedBar) {
      bufferedBar.style.width = '0%';
    }
  }

  function updateVolumeUI() {
    if (!video) return;
    const vol = video.muted ? 0 : video.volume;
    if (volumeSlider) volumeSlider.value = vol;
    if (volumePercent) volumePercent.textContent = Math.round(vol * 100) + '%';
    if (volumeUpIcon) volumeUpIcon.style.display = vol === 0 ? 'none' : 'block';
    if (volumeMuteIcon) volumeMuteIcon.style.display = vol === 0 ? 'block' : 'none';
    if (volumeToastText) volumeToastText.textContent = Math.round(vol * 100) + '%';
    if (volumeSlider) volumeSlider.style.setProperty('--vol-fill', (vol * 100) + '%');
  }

  function updateFullscreenIcon() {
    if (fullscreenEnterIcon) fullscreenEnterIcon.style.display = document.fullscreenElement ? 'none' : 'block';
    if (fullscreenExitIcon) fullscreenExitIcon.style.display = document.fullscreenElement ? 'block' : 'none';
  }

  function openDrawer() {
    sideDrawer?.classList.add('show');
    drawerBackdrop?.classList.add('show');
    clearTimeout(uiTimeout);
    mainArea?.classList.add('ui-visible');
  }

  function closeDrawer() {
    sideDrawer?.classList.remove('show');
    drawerBackdrop?.classList.remove('show');
    setTimeout(() => {
      document.querySelectorAll('.drawer-page').forEach(p => p.classList.remove('active'));
      $('drawerPage1')?.classList.add('active');
    }, 300);
    showUI();
  }

  if (moreBtn) moreBtn.addEventListener('click', (e) => { e.stopPropagation(); openDrawer(); });
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  // ================= 我的页面：自定义头像与昵称 =================
  const profileAvatar = $('profileAvatar');
  const defaultAvatarSvg = $('defaultAvatarSvg');
  const customAvatarImg = $('customAvatarImg');
  const avatarFileInput = $('avatarFileInput');
  
  const profileUsername = $('profileUsername');
  const profileNameInput = $('profileNameInput');

  function loadProfileData() {
    const savedNickname = localStorage.getItem(NS + 'video_custom_nickname');
    const savedAvatar = localStorage.getItem(NS + 'video_custom_avatar');
    
    if (profileUsername) {
      profileUsername.textContent = savedNickname || (window.Auth && window.Auth.currentUser ? window.Auth.currentUser : _('unknownUser'));
    }
    
    if (savedAvatar && customAvatarImg && defaultAvatarSvg) {
      customAvatarImg.src = savedAvatar;
      customAvatarImg.style.display = 'block';
      defaultAvatarSvg.style.display = 'none';
    }
  }

  if (profileAvatar && avatarFileInput) {
    profileAvatar.addEventListener('click', () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Img = event.target.result;
        localStorage.setItem(NS + 'video_custom_avatar', base64Img);
        
        if (customAvatarImg && defaultAvatarSvg) {
          customAvatarImg.src = base64Img;
          customAvatarImg.style.display = 'block';
          defaultAvatarSvg.style.display = 'none';
        }
        showToast(_('avatarUpdated'));
      };
      reader.readAsDataURL(file);
      avatarFileInput.value = '';
    });
  }

  if (profileUsername && profileNameInput) {
    profileUsername.addEventListener('click', () => {
      profileUsername.style.display = 'none';
      profileNameInput.style.display = 'block';
      profileNameInput.value = profileUsername.textContent;
      profileNameInput.focus();
      profileNameInput.select();
    });

    const saveNickname = () => {
      if (profileNameInput.style.display === 'none') return;
      
      const newName = profileNameInput.value.trim();
      if (newName) {
        localStorage.setItem(NS + 'video_custom_nickname', newName);
        profileUsername.textContent = newName;
        showToast(_('nicknameUpdated'));
      } else {
        profileNameInput.value = profileUsername.textContent;
      }
      
      profileNameInput.style.display = 'none';
      profileUsername.style.display = 'block';
    };

    profileNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveNickname();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // 👈 防止触发全局的 Esc 关闭抽屉
        profileNameInput.style.display = 'none';
        profileUsername.style.display = 'block';
      }
    });

    profileNameInput.addEventListener('blur', saveNickname);
  }
  // ================================================================

  document.querySelectorAll('.drawer-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      if (!targetId) return;
      
      if (targetId === 'drawerPageProfile') {
        loadProfileData(); // 👈 加载头像与昵称
        
        const statVideoCount = document.getElementById('statVideoCount');
        if (statVideoCount) statVideoCount.textContent = playlist.length;

        const statHistoryCount = document.getElementById('statHistoryCount');
        if (statHistoryCount) statHistoryCount.textContent = playHistory.length;

        const statDuration = document.getElementById('statDuration');
        if (statDuration) {
          let totalSec = 0;
          playlist.forEach(v => { if (v.duration) totalSec += v.duration; });
          const hrs = (totalSec / 3600).toFixed(1);
          statDuration.textContent = `${hrs}h`;
        }
      }

      document.querySelectorAll('.drawer-page').forEach(p => p.classList.remove('active'));
      const targetPage = $(targetId);
      if (targetPage) targetPage.classList.add('active');
    });
  });

  document.querySelectorAll('.drawer-back-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.drawer-page').forEach(p => p.classList.remove('active'));
      $('drawerPage1')?.classList.add('active');
    });
  });

  const changeSecurityCodeBtn = document.getElementById('changeSecurityCodeBtn');
  if (changeSecurityCodeBtn) {
    changeSecurityCodeBtn.addEventListener('click', () => {
      const dialog = document.getElementById('changeCodeDialog');
      const input = document.getElementById('newSecurityCode');
      const errorEl = document.getElementById('changeCodeError');
      
      if (dialog) dialog.classList.remove('hidden');
      if (input) { input.value = ''; input.focus(); }
      if (errorEl) errorEl.textContent = '';
    });
  }

  const changeCodeCancelBtn = document.getElementById('changeCodeCancelBtn');
  if (changeCodeCancelBtn) {
    changeCodeCancelBtn.addEventListener('click', () => {
      document.getElementById('changeCodeDialog').classList.add('hidden');
    });
  }

  const changeCodeConfirmBtn = document.getElementById('changeCodeConfirmBtn');
  if (changeCodeConfirmBtn) {
    changeCodeConfirmBtn.addEventListener('click', () => {
      const input = document.getElementById('newSecurityCode');
      const errorEl = document.getElementById('changeCodeError');
      const code = input ? input.value.trim() : '';

      if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
        if (errorEl) {
          errorEl.style.color = '#ff6b6b';
          errorEl.textContent = _('codeMustBe6');
        }
        return;
      }

      const u = window.Auth ? window.Auth.currentUser : null;
      if (!u) return;

      const users = window.Auth.getUsers();
      const userIndex = users.findIndex(user => user.username === u);

      if (userIndex !== -1) {
        users[userIndex].securityCode = code;
        localStorage.setItem('video_players_users', JSON.stringify(users));
        
        if (errorEl) {
          errorEl.style.color = '#6c5ce7';
          errorEl.textContent = _('codeSuccess');
        }
        
        setTimeout(() => {
          document.getElementById('changeCodeDialog').classList.add('hidden');
          showToast(_('codeUpdated'));
        }, 1000);
      }
    });
  }

  const clearCurrentDataBtn = document.getElementById('clearCurrentDataBtn');
  if (clearCurrentDataBtn) {
    clearCurrentDataBtn.addEventListener('click', async () => {
      showConfirm(_('clearData'), _('confirmClearData'), false, async () => {
        playlist = [];
        playHistory = [];
        currentVideoId = null;
        
        const ns = window.Auth ? window.Auth.namespace : 'guest_';
        localStorage.removeItem(ns + 'video_playlist_meta');
        localStorage.removeItem(ns + 'video_play_history');
        localStorage.removeItem(ns + 'video_last_played');
        
        await idbClear();
        
        renderFolderNav();
        renderPlaylist();
        resetPlayerUI();
        showToast(_('clearDataSuccess'));
        closeDrawer();
      });
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && window.Auth) {
    logoutBtn.addEventListener('click', () => {
      window.Auth.logout();
    });
  }

  const videoFilterState = { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, scale: 100, glassBlur: 24, glassAlpha: 55 };
  const FILTER_KEY = 'video_filter_pref';

  // ===== 画面调节滑块填充 =====
  function setDrawerFill(el) {
    if (!el) return;
    const min = parseFloat(el.min) || 0;
    const max = parseFloat(el.max) || 100;
    const val = parseFloat(el.value) || 0;
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    el.style.setProperty('--drawer-fill', pct + '%');
  }

  function applyVideoFilter() {
    if (!video) return;
    const s = videoFilterState;
    video.style.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) hue-rotate(${s.hue}deg) blur(${s.blur}px)`;
    video.style.transform = `scale(${s.scale / 100})`;
    video.style.transformOrigin = 'center center';

    document.documentElement.style.setProperty('--global-glass-blur', s.glassBlur + 'px');
    document.documentElement.style.setProperty('--global-glass-alpha', (s.glassAlpha / 100));
  }

  function saveVideoFilter() {
    storage.set(FILTER_KEY, JSON.stringify(videoFilterState));
  }

  const filterBindings = [
    ['adjBrightness', 'brightness', '%', 'adjBrightnessVal'],
    ['adjContrast', 'contrast', '%', 'adjContrastVal'],
    ['adjSaturate', 'saturate', '%', 'adjSaturateVal'],
    ['adjHue', 'hue', '°', 'adjHueVal'],
    ['adjBlur', 'blur', 'px', 'adjBlurVal'],
    ['adjScale', 'scale', '%', 'adjScaleVal'],
    ['adjGlassBlur', 'glassBlur', 'px', 'adjGlassBlurVal'],
    ['adjGlassAlpha', 'glassAlpha', '%', 'adjGlassAlphaVal'],
  ];

  filterBindings.forEach(([id, key, unit, valId]) => {
    const el = $(id);
    const valEl = $(valId);
    if (el) {
      el.addEventListener('input', () => {
        videoFilterState[key] = parseFloat(el.value);
        if (valEl) valEl.textContent = videoFilterState[key] + unit;
        applyVideoFilter();
        setDrawerFill(el);
      });
      el.addEventListener('change', saveVideoFilter);
    }
  });

  const adjResetBtn = $('adjResetBtn');
  if (adjResetBtn) {
    adjResetBtn.addEventListener('click', () => {
      Object.assign(videoFilterState, { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, scale: 100, glassBlur: 24, glassAlpha: 55 });
      filterBindings.forEach(([id, key, unit, valId]) => {
        const el = $(id);
        const valEl = $(valId);
        if (el) el.value = videoFilterState[key];
        if (valEl) valEl.textContent = videoFilterState[key] + unit;
        setDrawerFill(el);
      });
      applyVideoFilter(); saveVideoFilter();
      showToast(_('resetPicTip'));
    });
  }

  try {
    const savedFilter = JSON.parse(storage.get(FILTER_KEY));
    if (savedFilter) {
      Object.assign(videoFilterState, savedFilter);
      filterBindings.forEach(([id, key, unit, valId]) => {
        const el = $(id);
        const valEl = $(valId);
        if (el) el.value = videoFilterState[key];
        if (valEl) valEl.textContent = videoFilterState[key] + unit;
        setDrawerFill(el);
      });
      applyVideoFilter();
    }
  } catch(e) {}

// 无论是否有历史配置，都强制初始化一次所有滑块的填充和值
  filterBindings.forEach(([id, key, unit, valId]) => {
    const el = $(id);
    const valEl = $(valId);
    if (el) el.value = videoFilterState[key];
    if (valEl) valEl.textContent = videoFilterState[key] + unit;
    setDrawerFill(el);
  });

  const HISTORY_KEY = 'video_play_history';
  let playHistory = [];
  try { playHistory = JSON.parse(storage.get(HISTORY_KEY)) || []; } catch(e) {}

  function recordHistory(item, time) {
    if (!item) return;
    const key = item.name + '_' + item.file.size;
    const idx = playHistory.findIndex(h => h.key === key);
    const entry = {
      key, name: item.name, size: item.file.size,
      time: time, duration: video?.duration || 0,
      updatedAt: Date.now(),
    };
    if (idx >= 0) playHistory.splice(idx, 1);
    playHistory.unshift(entry);
    if (playHistory.length > 50) playHistory.length = 50;
    storage.set(HISTORY_KEY, JSON.stringify(playHistory));
    renderHistory();
  }

  function renderHistory() {
    const list = $('historyList');
    if (!list) return;
    if (!playHistory.length) {
      list.innerHTML = `<div class="history-empty" data-i18n="noHistory">${_('noHistory')}</div>`;
      return;
    }
    list.innerHTML = '';
    playHistory.forEach(h => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const pct = h.duration > 0 ? Math.min(100, (h.time / h.duration) * 100) : 0;
      div.innerHTML = `
        <span class="h-name" title="${h.name}">${h.name}</span>
        <span class="h-time">${formatTime(h.time)}</span>
        <div class="h-progress" style="width:${pct}%"></div>
      `;
      div.addEventListener('click', () => {
        const target = playlist.find(p => p.name === h.name && p.file.size === h.size);
        if (target) { playVideoById(target.id); closeDrawer(); }
        else showToast(_('existVideo'));
      });
      list.appendChild(div);
    });
  }

  const clearHistoryBtn = $('clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      playHistory = [];
      storage.remove(HISTORY_KEY);
      renderHistory();
      showToast(_('historyCleared'));
    });
  }

  renderHistory();

  // ================= 核心：跳过配置初始化 =================
  let skipPref = {
    intro: false,
    outro: false,
    showButton: true,
    autoSkip: false,
    videoConfig: {}
  };

  const SKIP_KEY = 'video_skip_pref_v5';
  try {
    const saved = JSON.parse(storage.get(SKIP_KEY));
    if (saved) Object.assign(skipPref, saved);
  } catch(e) {}

  function saveSkipPref() {
    storage.set(SKIP_KEY, JSON.stringify(skipPref));
  }

  const skipIntroToggle = $('skipIntroToggle');
  const skipOutroToggle = $('skipOutroToggle');
  const skipButtonToggle = $('skipButtonToggle');
  const skipAutoToggle = $('skipAutoToggle');
  const skipIntroStartVal = $('skipIntroStartVal');
  const skipIntroEndVal = $('skipIntroEndVal');
  const skipOutroStartVal = $('skipOutroStartVal');
  const skipOutroEndVal = $('skipOutroEndVal');

  function timeToSec(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number(timeStr) || 0;
  }

  function secToTime(sec) {
    if (!sec || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  window.adjustTime = function(inputId, delta) {
    const inputEl = typeof inputId === 'string' ? $(inputId) : inputId;
    if (!inputEl) return;
    let sec = timeToSec(inputEl.value);
    sec = Math.max(0, sec + delta);
    inputEl.value = secToTime(sec);
    saveCurrentSkipTimes();
  };

  window.bindArrowBtn = function(btn, inputEl, delta) {
    if (!btn || !inputEl) return;
    let timer = null;
    let interval = null;

    const startAction = (e) => {
      e.preventDefault();
      window.adjustTime(inputEl.id, delta);
      timer = setTimeout(() => {
        interval = setInterval(() => window.adjustTime(inputEl.id, delta), 80);
      }, 400);
    };

    const stopAction = () => {
      clearTimeout(timer);
      clearInterval(interval);
    };

    btn.addEventListener('mousedown', startAction);
    btn.addEventListener('mouseup', stopAction);
    btn.addEventListener('mouseleave', stopAction);
    btn.addEventListener('touchstart', startAction, {passive: false});
    btn.addEventListener('touchend', stopAction);
    btn.addEventListener('touchcancel', stopAction);
  };

  document.querySelectorAll('.skip-arrow-btn').forEach(btn => {
    const isUp = btn.classList.contains('up');
    const onclickStr = btn.getAttribute('onclick') || '';
    const match = onclickStr.match(/adjustTime\('([^']+)'/);
    if (match) {
      const inputId = match[1];
      const inputEl = $(inputId);
      btn.removeAttribute('onclick');
      window.bindArrowBtn(btn, inputEl, isUp ? 1 : -1);
    }
  });

  function getCurrentVideoKey() {
    if (!currentVideoId) return null;
    const item = playlist.find(p => p.id === currentVideoId);
    if (!item) return null;
    return item.name + '_' + item.file.size;
  }

  function markSkipTime(type) {
    if (!video || !video.src) return showToast(_('playSubTip'));
    if (!currentVideoId) return;

    const item = playlist.find(p => p.id === currentVideoId);
    if (!item) return;

    const t = video.currentTime;
    const videoKey = getCurrentVideoKey();
    if (!videoKey) return;

    if (!skipPref.videoConfig[videoKey]) {
      skipPref.videoConfig[videoKey] = { introStart: 0, introEnd: 90, outroStart: 0, outroEnd: video.duration || 0 };
    }
    const config = skipPref.videoConfig[videoKey];

    if (type === 'introStart') {
      config.introStart = t;
      if (config.introEnd <= config.introStart) config.introEnd = config.introStart + 5;
      if (skipIntroStartVal) skipIntroStartVal.value = secToTime(config.introStart);
      if (skipIntroEndVal) skipIntroEndVal.value = secToTime(config.introEnd);
    } else if (type === 'introEnd') {
      config.introEnd = t;
      if (config.introStart >= config.introEnd) config.introStart = Math.max(0, config.introEnd - 5);
      if (skipIntroStartVal) skipIntroStartVal.value = secToTime(config.introStart);
      if (skipIntroEndVal) skipIntroEndVal.value = secToTime(config.introEnd);
    } else if (type === 'outroStart') {
      config.outroStart = t;
      if (config.outroEnd <= config.outroStart) config.outroEnd = video.duration || config.outroStart + 5;
      if (skipOutroStartVal) skipOutroStartVal.value = secToTime(config.outroStart);
      if (skipOutroEndVal) skipOutroEndVal.value = secToTime(config.outroEnd);
    } else if (type === 'outroEnd') {
      config.outroEnd = t;
      if (config.outroStart >= config.outroEnd) config.outroStart = Math.max(0, config.outroEnd - 5);
      if (skipOutroStartVal) skipOutroStartVal.value = secToTime(config.outroStart);
      if (skipOutroEndVal) skipOutroEndVal.value = secToTime(config.outroEnd);
    }

    if (type.startsWith('intro') && !skipPref.intro) {
      skipPref.intro = true;
      if (skipIntroToggle) skipIntroToggle.classList.add('active');
    }
    if (type.startsWith('outro') && !skipPref.outro) {
      skipPref.outro = true;
      if (skipOutroToggle) skipOutroToggle.classList.add('active');
    }

    saveSkipPref();
    updateSkipButton();

    const cleanName = item.name.replace(/\.[^.]+$/, '');
    const prefix = _('osdPrefix').replace('{name}', cleanName);
    const timeStr = secToTime(t);
    
    let msgKey = '';
    if (type === 'introStart') msgKey = 'osdMarkIntroStart';
    else if (type === 'introEnd') msgKey = 'osdMarkIntroEnd';
    else if (type === 'outroStart') msgKey = 'osdMarkOutroStart';
    else if (type === 'outroEnd') msgKey = 'osdMarkOutroEnd';

    const msg = _(msgKey).replace('{time}', timeStr);

    showToast(`${prefix} ${msg}`, 3000);
  }

  const manualMatchBtn = $('manualMatchBtn');
  if (manualMatchBtn) {
    manualMatchBtn.addEventListener('click', () => {
      if (!currentVideoId) return showToast(_('playSubTip'));
      const oldKeys = Object.keys(skipPref.videoConfig);
      if (oldKeys.length === 0) return showToast(_('noHistory') || '暂无历史跳过配置可匹配');

      const oldNames = oldKeys.map(k => {
        const idx = k.lastIndexOf('_');
        return idx > 0 ? k.substring(0, idx) : k;
      });
      
      const uniqueNames = [...new Set(oldNames)];
      
      // 填充列表
      matchOldList.innerHTML = '';
      uniqueNames.forEach(name => {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = name;
        itemDiv.style.cssText = 'padding: 4px 8px; cursor: pointer; border-radius: 4px; transition: 0.2s;';
        itemDiv.addEventListener('click', () => {
          matchInputField.value = name;
          matchInputField.focus();
        });
        itemDiv.addEventListener('mouseenter', () => itemDiv.style.background = 'rgba(108,92,231,0.2)');
        itemDiv.addEventListener('mouseleave', () => itemDiv.style.background = 'transparent');
        matchOldList.appendChild(itemDiv);
      });

      matchInputField.value = '';
      if (modalBackdrop) modalBackdrop.classList.add('show');
      matchModal.classList.add('show');
    });
  }

  if (matchCancelBtn) {
    matchCancelBtn.addEventListener('click', () => {
      matchModal.classList.remove('show');
      if (modalBackdrop) modalBackdrop.classList.remove('show');
    });
  }

  if (matchOkBtn) {
    matchOkBtn.addEventListener('click', () => {
      const target = matchInputField.value.trim();
      if (!target) return showToast(_('renameEmpty'));

      const oldKeys = Object.keys(skipPref.videoConfig);
      const currentItem = playlist.find(p => p.id === currentVideoId);
      const newKey = currentItem.name + '_' + currentItem.file.size;
      
      const matchKey = oldKeys.find(k => k.includes(target));
      if (matchKey) {
        skipPref.videoConfig[newKey] = skipPref.videoConfig[matchKey];
        saveSkipPref();
        loadSkipConfigForCurrentVideo();
        showToast(_('matchSuccess'));
        matchModal.classList.remove('show');
        if (modalBackdrop) modalBackdrop.classList.remove('show');
      } else {
        showToast(_('matchFail'));
      }
    });
  }

  function loadSkipConfigForCurrentVideo() {
    if (skipIntroToggle) skipIntroToggle.classList.toggle('active', skipPref.intro);
    if (skipOutroToggle) skipOutroToggle.classList.toggle('active', skipPref.outro);
    if (skipButtonToggle) skipButtonToggle.classList.toggle('active', skipPref.showButton);
    if (skipAutoToggle) skipAutoToggle.classList.toggle('active', skipPref.autoSkip);

    const videoKey = getCurrentVideoKey();
    let config = null;

    if (videoKey && skipPref.videoConfig[videoKey]) {
      config = { ...skipPref.videoConfig[videoKey] };
    } else {
      const defaultOutroEnd = video?.duration ? Math.floor(video.duration) : 0;
      config = { introStart: 0, introEnd: 90, outroStart: 0, outroEnd: defaultOutroEnd };
    }

    if (!videoKey || !skipPref.videoConfig[videoKey]) {
      if (video?.duration && config.outroEnd < video.duration) {
        config.outroEnd = Math.floor(video.duration);
      }
    }

    if (skipIntroStartVal) skipIntroStartVal.value = secToTime(config.introStart);
    if (skipIntroEndVal) skipIntroEndVal.value = secToTime(config.introEnd);
    if (skipOutroStartVal) skipOutroStartVal.value = secToTime(config.outroStart);
    if (skipOutroEndVal) skipOutroEndVal.value = secToTime(config.outroEnd);
  }

  function saveCurrentSkipTimes() {
    const videoKey = getCurrentVideoKey();
    if (!videoKey) return;

    const introStart = timeToSec(skipIntroStartVal?.value);
    const introEnd = timeToSec(skipIntroEndVal?.value);
    const outroStart = timeToSec(skipOutroStartVal?.value);
    const outroEnd = timeToSec(skipOutroEndVal?.value);

    skipPref.videoConfig[videoKey] = { introStart, introEnd, outroStart, outroEnd };
    saveSkipPref();
    updateSkipButton();
  }

  const bindGetBtn = (btnId, inputEl) => {
    const btn = $(btnId);
    if (btn && inputEl) {
      btn.addEventListener('click', () => {
        inputEl.value = secToTime(video?.currentTime || 0);
        saveCurrentSkipTimes();
        showToast(`${inputEl.value}`);
      });
    }
  };
  bindGetBtn('skipIntroStartGet', skipIntroStartVal);
  bindGetBtn('skipIntroEndGet', skipIntroEndVal);
  bindGetBtn('skipOutroStartGet', skipOutroStartVal);
  bindGetBtn('skipOutroEndGet', skipOutroEndVal);

  [skipIntroStartVal, skipIntroEndVal, skipOutroStartVal, skipOutroEndVal].forEach(el => {
    if (el) el.addEventListener('change', saveCurrentSkipTimes);
  });

  if (skipIntroToggle) {
    skipIntroToggle.addEventListener('click', () => {
      skipPref.intro = !skipPref.intro;
      skipIntroToggle.classList.toggle('active', skipPref.intro);
      saveSkipPref(); updateSkipButton();
    });
    skipOutroToggle.addEventListener('click', () => {
      skipPref.outro = !skipPref.outro;
      skipOutroToggle.classList.toggle('active', skipPref.outro);
      saveSkipPref(); updateSkipButton();
    });
    
    if (skipButtonToggle) {
      skipButtonToggle.addEventListener('click', () => {
        skipPref.showButton = !skipPref.showButton;
        if (skipPref.showButton && skipPref.autoSkip) {
          skipPref.autoSkip = false;
          if (skipAutoToggle) skipAutoToggle.classList.remove('active');
        }
        skipButtonToggle.classList.toggle('active', skipPref.showButton);
        saveSkipPref(); updateSkipButton();
      });
    }

    if (skipAutoToggle) {
      skipAutoToggle.addEventListener('click', () => {
        skipPref.autoSkip = !skipPref.autoSkip;
        if (skipPref.autoSkip && skipPref.showButton) {
          skipPref.showButton = false;
          if (skipButtonToggle) skipButtonToggle.classList.remove('active');
        }
        skipAutoToggle.classList.toggle('active', skipPref.autoSkip);
        saveSkipPref(); updateSkipButton();
      });
    }
  }

  let lastSeekSource = 'user';
  let lastUserSeekTime = 0;

  if (video) {
    video.addEventListener('seeking', () => {
      if (lastSeekSource === 'user') {
        lastUserSeekTime = Date.now();
      }
    });
  }

  function updateSkipButton() {
    if (!video || !video.src) {
      if (skipIntroBtn) skipIntroBtn.classList.remove('show');
      return;
    }

    const t = video.currentTime;
    const videoKey = getCurrentVideoKey();
    const config = skipPref.videoConfig[videoKey] || { introStart: 0, introEnd: 90, outroStart: 0, outroEnd: 0 };

    const inIntro = skipPref.intro && t >= config.introStart && t < config.introEnd;
    const inOutro = skipPref.outro && t >= config.outroStart && t < config.outroEnd;

    if (inIntro || inOutro) {
      if (skipPref.autoSkip && Date.now() - lastUserSeekTime > 3000) {
        doSkip(inIntro, config);
      } else if (skipPref.showButton) {
        if (skipIntroBtn) {
          if (skipHintText) {
            let epName = '';
            if (currentVideoId) {
              const item = playlist.find(p => p.id === currentVideoId);
              if (item) epName = item.name.replace(/\.[^.]+$/, '');
              if (epName.length > 12) epName = epName.substring(0, 12) + '...';
            }
            const prefix = epName ? `[${epName}] ` : '';
            skipHintText.textContent = prefix + (inIntro ? _('skipStartHint') : _('skipEndHint'));
          }
          skipIntroBtn.classList.add('show');
        }
      }
    } else {
      if (skipIntroBtn) {
        skipIntroBtn.classList.remove('show');
      }
    }
  }

  function doSkip(isIntro, config) {
    if (skipIntroBtn) skipIntroBtn.classList.remove('show');
    
    lastSeekSource = 'program';
    if (isIntro) {
      video.currentTime = config.introEnd;
    } else {
      video.currentTime = video.duration ? video.duration - 0.5 : config.outroEnd;
    }
    setTimeout(() => { lastSeekSource = 'user'; }, 100);
  }

  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', () => {
      const videoKey = getCurrentVideoKey();
      const config = skipPref.videoConfig[videoKey] || { introStart: 0, introEnd: 90, outroStart: 0, outroEnd: 0 };
      const t = video.currentTime;

      if (skipPref.intro && t >= config.introStart && t < config.introEnd) {
        lastSeekSource = 'program';
        video.currentTime = config.introEnd;
      } else if (skipPref.outro && t >= config.outroStart && t < config.outroEnd) {
        lastSeekSource = 'program';
        video.currentTime = video.duration ? video.duration - 0.5 : config.outroEnd;
      }
      updateSkipButton();
      setTimeout(() => { lastSeekSource = 'user'; }, 100);
    });
  }

  function toggleScreenLock(locked) {
    isScreenLocked = locked;
    if (mainAreaEl) mainAreaEl.classList.toggle('locked', isScreenLocked);

    if (isScreenLocked) {
      isLockUiVisible = true;
      if (mainAreaEl) mainAreaEl.classList.add('lock-ui-visible');

      if (screenLockBtn) screenLockBtn.style.display = 'none';
      if (screenUnlockBtn) screenUnlockBtn.style.display = 'flex';

      let leftUnlockBtn = $('screenUnlockBtnLeft');
      if (!leftUnlockBtn && screenUnlockBtn) {
        leftUnlockBtn = screenUnlockBtn.cloneNode(true);
        leftUnlockBtn.id = 'screenUnlockBtnLeft';
        leftUnlockBtn.className = 'screen-lock-btn left';
        leftUnlockBtn.style.display = 'flex';
        leftUnlockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleScreenLock(false); });
        if (mainAreaEl) mainAreaEl.appendChild(leftUnlockBtn);
      }
      if (leftUnlockBtn) leftUnlockBtn.style.display = 'flex';

      showToast(_('lockedTip'));
    } else {
      if (mainAreaEl) mainAreaEl.classList.remove('lock-ui-visible');
      if (screenLockBtn) screenLockBtn.style.display = 'flex';
      if (screenUnlockBtn) screenUnlockBtn.style.display = 'none';

      const leftUnlockBtn = $('screenUnlockBtnLeft');
      if (leftUnlockBtn) leftUnlockBtn.style.display = 'none';

      showToast(_('unlockedTip'));
      showUI();
    }
  }

  if (screenLockBtn) {
    screenLockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleScreenLock(true); });
  }
  if (screenUnlockBtn) {
    screenUnlockBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleScreenLock(false); });
  }

  // ================= 核心：多语言星期显示 =================
  window.updateTopTime = function() {
    if (!topTime) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    
    const lang = window.I18n ? window.I18n.currentLang : 'zh';
    const dayIndex = now.getDay();

    // 内置多语言星期映射表（0=周日, 6=周六）
    const weekDays = {
      'zh': ['日', '一', '二', '三', '四', '五', '六'],
      'zh-TW': ['日', '一', '二', '三', '四', '五', '六'],
      'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      'ja': ['日', '月', '火', '水', '木', '金', '土'],
      'ko': ['일', '월', '화', '수', '목', '금', '토'],
      'de': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      'es': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      'fr': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      'ru': ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
      'pt': ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    };

    const days = weekDays[lang] || weekDays['en'];
    const dayName = days[dayIndex];

    if (lang === 'zh' || lang === 'zh-TW') {
      topTime.textContent = `${yyyy}-${mm}-${dd} 周${dayName} ${hh}:${min}:${ss}`;
    } else if (lang === 'ja' || lang === 'ko') {
      topTime.textContent = `${yyyy}-${mm}-${dd} (${dayName}) ${hh}:${min}:${ss}`;
    } else {
      topTime.textContent = `${yyyy}-${mm}-${dd} ${dayName} ${hh}:${min}:${ss}`;
    }
  };

  window.updateTopTime();
  setInterval(window.updateTopTime, 1000);

  function showUI() {
    if (!mainAreaEl || mainAreaEl.classList.contains('locked')) {
      return;
    }

    mainArea.classList.add('ui-visible');
    clearTimeout(uiTimeout);
    if (!video.paused) {
      uiTimeout = setTimeout(() => {
        if (sideDrawer?.classList.contains('show') || infoModal?.classList.contains('show') || confirmModal?.classList.contains('show') || inputModal?.classList.contains('show') || matchModal?.classList.contains('show')) {
          showUI(); return;
        }
        if (controlsWrapper?.matches(':hover') || playlistPanel?.matches(':hover') ||
            togglePlaylistTab?.matches(':hover') || $('subtitlePopover')?.matches(':hover') ||
            (resumeTip && resumeTip.matches(':hover'))) {
          showUI(); return;
        }
        mainArea.classList.remove('ui-visible');
      }, 2000);
    }
  }

  if (playerContainer) {
    playerContainer.addEventListener('mousemove', showUI);
    playerContainer.addEventListener('mouseenter', showUI);
    playerContainer.addEventListener('mouseleave', () => {
      if (!video.paused && !sideDrawer?.classList.contains('show') && !mainAreaEl?.classList.contains('locked')) {
        clearTimeout(uiTimeout);
        mainArea.classList.remove('ui-visible');
      }
    });
  }

  if (controlsWrapper) {
    controlsWrapper.addEventListener('mouseenter', () => {
      clearTimeout(uiTimeout);
      mainArea.classList.add('ui-visible');
    });
    controlsWrapper.addEventListener('mouseleave', showUI);
  }

  if (playlistPanel) {
    playlistPanel.addEventListener('mouseenter', () => {
      clearTimeout(uiTimeout);
      mainArea.classList.add('ui-visible');
    });
  }

  if (video) {
    video.addEventListener('play', showUI);
    video.addEventListener('pause', () => {
      clearTimeout(uiTimeout);
      mainArea.classList.add('ui-visible');
    });
  }

  function updateTabUI() {
    if (!playlistPanel || !togglePlaylistTab || !toggleIcon) return;
    if (playlistPanel.classList.contains('collapsed')) {
      togglePlaylistTab.classList.add('is-collapsed');
      toggleIcon.innerHTML = '<path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>';
    } else {
      togglePlaylistTab.classList.remove('is-collapsed');
      toggleIcon.innerHTML = '<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>';
    }
  }

  if (togglePlaylistTab) {
    togglePlaylistTab.addEventListener('click', () => {
      playlistPanel.classList.toggle('collapsed');
      updateTabUI();
    });
  }

  function showVideoInfo(item) {
    if (!item || !infoName) return;
    infoName.textContent = item.name;
    if (infoSize) infoSize.textContent = formatBytes(item.file.size);
    if (infoDuration) infoDuration.textContent = formatTime(video.duration);
    if (infoResolution) infoResolution.textContent = `${video.videoWidth} x ${video.videoHeight}`;
    if (infoFormat) infoFormat.textContent = (item.name.split('.').pop() || _('videoFormatUnknown')).toUpperCase();
    if (modalBackdrop) modalBackdrop.classList.add('show');
    if (infoModal) infoModal.classList.add('show');
  }

  function closeVideoInfo() {
    if (infoModal) infoModal.classList.remove('show');
    if (!confirmModal?.classList.contains('show') && !inputModal?.classList.contains('show') && !matchModal?.classList.contains('show')) {
      if (modalBackdrop) modalBackdrop.classList.remove('show');
    }
  }

  if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeVideoInfo);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      closeVideoInfo();
      closeConfirm();
      closeInputModal();
      if (matchModal) matchModal.classList.remove('show');
    });
  }

  let inputModalCallback = null;

  function showInputModal(title, defaultValue, opts = {}) {
    if (!inputModal) return;
    if (inputModalTitle) inputModalTitle.textContent = title;
    if (inputModalField) {
      inputModalField.value = defaultValue;
      inputModalField.classList.remove('invalid');
    }
    if (inputModalHint) {
      inputModalHint.textContent = opts.hint || _('renameHint');
      inputModalHint.classList.remove('error');
    }

    inputModalCallback = opts.onConfirm || null;
    inputModal._validate = opts.validate || null;

    if (modalBackdrop) modalBackdrop.classList.add('show');
    inputModal.classList.add('show');

    setTimeout(() => {
      if (inputModalField) {
        inputModalField.focus();
        inputModalField.select();
      }
    }, 30);
  }

  function closeInputModal() {
    if (inputModal) inputModal.classList.remove('show');
    if (!confirmModal?.classList.contains('show') && !infoModal?.classList.contains('show') && !matchModal?.classList.contains('show')) {
      if (modalBackdrop) modalBackdrop.classList.remove('show');
    }
    inputModalCallback = null;
    if (inputModal) inputModal._validate = null;
  }

  if (inputCancelBtn) inputCancelBtn.addEventListener('click', closeInputModal);

  if (inputOkBtn) {
    inputOkBtn.addEventListener('click', () => {
      if (!inputModalField) return;
      const raw = inputModalField.value.trim();
      if (!raw) {
        inputModalField.classList.add('invalid');
        if (inputModalHint) {
          inputModalHint.textContent = _('renameEmpty');
          inputModalHint.classList.add('error');
        }
        return;
      }

      let finalValue = raw;
      if (inputModal?._validate) {
        const res = inputModal._validate(raw);
        if (!res.ok) {
          inputModalField.classList.add('invalid');
          if (inputModalHint) {
            inputModalHint.textContent = res.msg;
            inputModalHint.classList.add('error');
          }
          return;
        }
        finalValue = res.value !== undefined ? res.value : raw;
      }

      const cb = inputModalCallback;
      closeInputModal();
      if (cb) cb(finalValue);
    });
  }

  if (inputModalField) {
    inputModalField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); inputOkBtn?.click(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeInputModal(); }
    });

    inputModalField.addEventListener('input', () => {
      inputModalField.classList.remove('invalid');
      if (inputModalHint) inputModalHint.classList.remove('error');
    });
  }

  function generateThumbnail(time) {
    return new Promise((resolve) => {
      if (!video || !video.src || time < 0 || time > video.duration || !previewCtx) return resolve(null);
      const cacheKey = Math.round(time * 2) / 2;
      if (thumbCache.has(cacheKey)) return resolve(thumbCache.get(cacheKey));
      thumbVideo.src = video.src;
      const onSeeked = () => {
        thumbVideo.removeEventListener('seeked', onSeeked);
        try {
          previewCtx.drawImage(thumbVideo, 0, 0, previewCanvas.width, previewCanvas.height);
          const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.6);
          thumbCache.set(cacheKey, dataUrl);
          resolve(dataUrl);
        } catch (e) {
          resolve(null);
        }
      };
      thumbVideo.addEventListener('seeked', onSeeked);
      thumbVideo.currentTime = time;
    });
  }

  function animatePreview() {
    if (!isAnimatingPreview || !previewTooltip) return;
    currentLeft += (targetLeft - currentLeft) * 0.2;
    previewTooltip.style.left = `${currentLeft}px`;
    if (Math.abs(targetLeft - currentLeft) > 0.5) {
      requestAnimationFrame(animatePreview);
    } else {
      previewTooltip.style.left = `${targetLeft}px`;
      isAnimatingPreview = false;
    }
  }

  async function updatePreview(e) {
    if (!video || !video.src || !video.duration || !previewTooltip) return;
    const reqId = ++previewReqId;
    const rect = progressBarContainer.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    const time = percent * video.duration;
    if (previewTime) previewTime.textContent = formatTime(time);
    const tooltipHalfWidth = 80;
    targetLeft = e.clientX - rect.left;
    if (targetLeft < tooltipHalfWidth) targetLeft = tooltipHalfWidth;
    if (targetLeft > rect.width - tooltipHalfWidth) targetLeft = rect.width - tooltipHalfWidth;
    if (!isAnimatingPreview) {
      isAnimatingPreview = true;
      if (Math.abs(targetLeft - currentLeft) > 100) currentLeft = targetLeft;
      requestAnimationFrame(animatePreview);
    }
    if (Math.abs(time - lastThumbTime) < 0.2) return;
    lastThumbTime = time;
    const thumbData = await generateThumbnail(time);
    if (reqId !== previewReqId) return;
    if (thumbData && previewCtx) {
      const img = new Image();
      img.src = thumbData;
      img.onload = () => previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
    }
  }

  function handleProgressStart(e) {
    if (!video || !video.src || !video.duration) return;
    cancelLongPress();
    isDraggingProgress = true;
    progressBarContainer?.classList.add('dragging');
    updateProgressFromEvent(e);
    document.addEventListener('mousemove', handleProgressMove);
    document.addEventListener('mouseup', handleProgressEnd);
    clearTimeout(uiTimeout);
    mainArea?.classList.add('ui-visible');
  }

  function handleProgressMove(e) {
    if (!isDraggingProgress) return;
    updateProgressFromEvent(e);
    updatePreview(e);
  }

  function handleProgressEnd() {
    if (!isDraggingProgress) return;
    isDraggingProgress = false;
    progressBarContainer?.classList.remove('dragging');
    document.removeEventListener('mousemove', handleProgressMove);
    document.removeEventListener('mouseup', handleProgressEnd);
    showUI();
  }

  function updateProgressFromEvent(e) {
    if (!progressBarContainer || !video) return;
    const rect = progressBarContainer.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    video.currentTime = percent * video.duration;
    if (progressBar) progressBar.style.width = `${percent * 100}%`;
    if (timeDisplay) timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    if (window.Subtitle) Subtitle.tick();
  }

  function handleProgressHover(e) {
    if (!isDraggingProgress) updatePreview(e);
  }

  if (mainArea) {
    mainArea.addEventListener('wheel', (e) => {
      if (!video || !video.src) return;
      if (e.target.closest('.controls-wrapper') || e.target.closest('.top-bar') ||
          e.target.closest('.info-modal') || e.target.closest('.popover') ||
          e.target.closest('.toggle-playlist-tab') || e.target.closest('.confirm-modal') ||
          e.target.closest('.input-modal') || e.target.closest('.seek-osd') ||
          e.target.closest('.resume-tip') ||
          e.target.closest('.side-drawer') || e.target.closest('.side-drawer-backdrop')) return;
      e.preventDefault();
      const step = 0.05;
      let newVol = video.volume;
      if (e.deltaY > 0) {
        newVol = Math.max(0, newVol - step);
      } else {
        newVol = Math.min(1, newVol + step);
      }
      video.volume = newVol;
      video.muted = (newVol === 0);
      updateVolumeUI();
      showVolumeToast();
    }, { passive: false });
  }

  function cancelLongPress() {
    if (!isLongPressing) return;
    clearTimeout(longPressTimer);
    if (video && video.playbackRate === 2.0 && originalPlaybackRate !== 2.0) {
      video.playbackRate = originalPlaybackRate;
      speedIndicator?.classList.remove('show');
    }
    isLongPressing = false;
  }

  if (mainArea) {
    mainArea.addEventListener('mousedown', (e) => {
      if (!video || !video.src || video.paused) return;
      if (e.target.closest('.controls-wrapper') || e.target.closest('.top-bar') ||
          e.target.closest('.info-modal') || e.target.closest('.toggle-playlist-tab') ||
          e.target.closest('.popover') || e.target.closest('.confirm-modal') ||
          e.target.closest('.input-modal') || e.target.closest('.seek-osd') ||
          e.target.closest('.resume-tip') ||
          e.target.closest('.side-drawer') || e.target.closest('.side-drawer-backdrop')) return;
      isLongPressing = true;
      longPressTimer = setTimeout(() => {
        if (isLongPressing && video) {
          originalPlaybackRate = video.playbackRate;
          video.playbackRate = 2.0;
          speedIndicator?.classList.add('show');
          toast?.classList.remove('show');
          volumeToast?.classList.remove('show');
        }
      }, 400);
    });
    mainArea.addEventListener('mouseup', cancelLongPress);
    mainArea.addEventListener('mouseleave', cancelLongPress);

    mainArea.addEventListener('click', (e) => {
      if (e.target.closest('.controls-wrapper') ||
          e.target.closest('.top-bar') ||
          e.target.closest('.side-drawer') ||
          e.target.closest('.popover') ||
          e.target.closest('.skip-intro-btn') ||
          e.target.closest('.input-modal') ||
          e.target.closest('.info-modal') ||
          e.target.closest('.confirm-modal') ||
          e.target.closest('.seek-osd') ||
          e.target.closest('.resume-tip') ||
          e.target.closest('.screen-lock-btn')) {
        return;
      }

      if (isScreenLocked) {
        isLockUiVisible = !isLockUiVisible;
        mainAreaEl.classList.toggle('lock-ui-visible', isLockUiVisible);
        return;
      }

      togglePlay();
    });
  }

  let lastSavedTime = 0;
  if (video) {
    video.addEventListener('timeupdate', () => {
      updateTimeDisplay();
      updateBuffered();
      if (window.Subtitle) Subtitle.tick();
      updateSkipButton();
      if (currentVideoId && video.currentTime > 0) {
        const now = Date.now();
        if (now - lastSavedTime > 5000) {
          lastSavedTime = now;
          const item = playlist.find(p => p.id === currentVideoId);
          if (item) {
            storage.set('video_play_progress_' + item.name + '_' + item.file.size, video.currentTime);
            recordHistory(item, video.currentTime);
          }
        }
      }
    });
  }

  function toggleManageMode(forceState = null) {
    isManaging = forceState !== null ? forceState : !isManaging;
    if (!isManaging) {
      selectedIds.clear();
      if (selectAllCheck) selectAllCheck.checked = false;
    }

    if (manageBtn) manageBtn.textContent = isManaging ? _('cancelManage') : _('manage');
    if (manageBtn) manageBtn.classList.toggle('active', isManaging);
    if (playlistFooter) playlistFooter.classList.toggle('managing', isManaging);
    updateBatchUI();
    renderPlaylist(searchInput?.value || '');
  }

  if (manageBtn) manageBtn.addEventListener('click', () => toggleManageMode());

  function updateBatchUI() {
    if (selectedCount) selectedCount.textContent = selectedIds.size;
    if (batchDeleteBtn) batchDeleteBtn.disabled = selectedIds.size === 0;
    let filtered = playlist.filter(item => {
      const matchFolder = activeFolderFilter === ALL_VIDEOS() || item.folder === activeFolderFilter;
      const matchSearch = item.name.toLowerCase().includes((searchInput?.value || '').toLowerCase());
      return matchFolder && matchSearch;
    });
    if (selectAllCheck) {
      if (filtered.length > 0 && selectedIds.size === filtered.length) {
        selectAllCheck.checked = true;
      } else {
        selectAllCheck.checked = false;
      }
    }
  }

  if (selectAllCheck) {
    selectAllCheck.addEventListener('change', (e) => {
      let filtered = playlist.filter(item => {
        const matchFolder = activeFolderFilter === ALL_VIDEOS() || item.folder === activeFolderFilter;
        const matchSearch = item.name.toLowerCase().includes((searchInput?.value || '').toLowerCase());
        return matchFolder && matchSearch;
      });
      if (e.target.checked) {
        filtered.forEach(item => selectedIds.add(item.id));
      } else {
        filtered.forEach(item => selectedIds.delete(item.id));
      }
      updateBatchUI();
      renderPlaylist(searchInput?.value || '');
    });
  }

  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', () => {
      if (selectedIds.size === 0) return;
      const toDelete = playlist.filter(p => selectedIds.has(p.id));
      if (toDelete.some(p => p.id === currentVideoId) && video) {
        video.pause();
      }
      showConfirm(_('batchDelete'), `${_('batchDeleteConfirm')} ${selectedIds.size} ${_('videosConfirm')}`, true, async () => {
        const deleteSource = deleteSourceCheck?.checked;
        const itemsToDelete = [...selectedIds];

        for (const id of itemsToDelete) {
          await removeVideo(id, deleteSource, true);
        }
        toggleManageMode(false);
        renderFolderNav();
        renderPlaylist(searchInput?.value || '');
        showToast(_('removedVideosTip'));
      });
    });
  }

  function renderFolderNav() {
    if (!folderSelectorWrapper || !folderSelect) return;
    folderSelectorWrapper.style.display = 'none';
    
    folderSelect.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = ALL_VIDEOS_KEY;
    allOpt.textContent = _('allVideos');
    folderSelect.appendChild(allOpt);
    
    const folders = new Set();
    playlist.forEach(item => {
      if (item.folder && item.folder !== UNCATEGORIZED_KEY && item.folder !== ALL_VIDEOS_KEY) {
        folders.add(item.folder);
      }
    });
    if (folders.size <= 1) return;
    folderSelectorWrapper.style.display = 'flex';
    Array.from(folders).sort().forEach(folderName => {
      const opt = document.createElement('option');
      opt.value = folderName;
      opt.textContent = folderName;
      folderSelect.appendChild(opt);
    });
    if (!activeFolderFilter) activeFolderFilter = ALL_VIDEOS_KEY;
    folderSelect.value = activeFolderFilter;
  }

  function renderPlaylist(filterText = '') {
    if (!playlistBody) return;
    if (playlistCount) playlistCount.textContent = playlist.length;
    playlistBody.innerHTML = '';

    if (!activeFolderFilter) activeFolderFilter = ALL_VIDEOS_KEY;

    let filteredPlaylist = playlist.filter(item => {
      const matchFolder = activeFolderFilter === ALL_VIDEOS_KEY || item.folder === activeFolderFilter;
      const searchLower = filterText.toLowerCase();
      const displayFolder = folderDisplayName(item.folder).toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchLower) ||
                          displayFolder.includes(searchLower);
      return matchFolder && matchSearch;
    });

    if (filteredPlaylist.length === 0) {
      if (isRestoring && playlist.length === 0) {
        return;
      }
      if (playlistEmpty) {
        playlistEmpty.style.display = 'flex';
        playlistBody.appendChild(playlistEmpty);
      }
      renderEpisodePopover();
      return;
    }

    filteredPlaylist.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'playlist-item' + (item.id === currentVideoId ? ' active' : '') + (isManaging ? ' managing' : '');
      div.dataset.id = item.id;

      const hasSub = item.subtitle && item.subtitle.rawText;
      const subBadge = hasSub ? `<span class="item-sub-badge">${_('subtitle')}</span>` : '';

      div.innerHTML = `
        <div class="item-checkbox ${selectedIds.has(item.id) ? 'checked' : ''}"></div>
        <span class="item-index">${index + 1}</span>
        <div class="item-info">
          <div class="item-name" title="${item.name}">${item.name}${subBadge}</div>
        </div>
        <div class="item-actions">
          <button class="item-more-btn" aria-label="更多">
            <svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
        </div>
      `;

      const checkbox = div.querySelector('.item-checkbox');
      const moreBtn2 = div.querySelector('.item-more-btn');

      div.addEventListener('click', (e) => {
        if (isManaging) {
          if (selectedIds.has(item.id)) selectedIds.delete(item.id);
          else selectedIds.add(item.id);
          if (checkbox) checkbox.classList.toggle('checked', selectedIds.has(item.id));
          updateBatchUI();
        } else if (!e.target.closest('.item-actions')) {
          if (currentVideoId !== item.id) playVideoById(item.id);
        }
      });

      if (moreBtn2) {
        moreBtn2.addEventListener('click', (e) => {
          e.stopPropagation();
          showItemContextMenu(item, div);
        });
      }

      playlistBody.appendChild(div);
    });
    updateBatchUI();
    renderEpisodePopover();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderPlaylist(e.target.value);
      updateBatchUI();
    });
  }

  if (folderSelect) {
    folderSelect.addEventListener('change', (e) => {
      activeFolderFilter = e.target.value;
      selectedIds.clear();
      renderPlaylist(searchInput?.value || '');
      updateBatchUI();
    });
  }

  let activeCtxMenu = null;
  function showItemContextMenu(item, targetDiv) {
    if (activeCtxMenu) {
      activeCtxMenu.remove();
      activeCtxMenu = null;
    }

    const menu = document.createElement('div');
    menu.className = 'item-context-menu show';
    menu.innerHTML = `
      <div class="ctx-menu-item" data-action="info"><svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>${_('videoDetails')}</div>
      <div class="ctx-menu-item" data-action="rename"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>${_('renameTitle')}</div>
      <div class="ctx-menu-item danger" data-action="delete"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>${_('deleteSelected')}</div>
    `;

    targetDiv.appendChild(menu);
    activeCtxMenu = menu;

    menu.addEventListener('click', (e) => {
      const action = e.target.closest('.ctx-menu-item')?.dataset.action;
      if (!action) return;

      menu.remove();
      activeCtxMenu = null;

      if (action === 'info') {
        showVideoInfo(item);
      } else if (action === 'rename') {
        const oldName = item.name;
        const dotIdx = oldName.lastIndexOf('.');
        const ext = dotIdx > 0 ? oldName.slice(dotIdx) : '';
        const base = dotIdx > 0 ? oldName.slice(0, dotIdx) : oldName;

        const hintMsg = ext
          ? _('renameExtHint').replace('{ext}', ext)
          : _('renameHint');

        showInputModal(_('renameTitle'), base, {
          hint: hintMsg,
          validate: (val) => {
            let finalName = val;
            if (ext) {
              if (val.toLowerCase().endsWith(ext.toLowerCase())) {
                finalName = val;
              } else {
                finalName = val + ext;
              }
            }
            if (playlist.some(p => p.id !== item.id && p.name === finalName)) {
              return { ok: false, msg: _('renameExist') };
            }
            return { ok: true, value: finalName };
          },
          onConfirm: (newName) => {
            if (newName === oldName) return;
            
            const oldKey = oldName + '_' + item.file.size;
            const newKey = newName + '_' + item.file.size;
            if (skipPref.videoConfig[oldKey]) {
              skipPref.videoConfig[newKey] = skipPref.videoConfig[oldKey];
              delete skipPref.videoConfig[oldKey];
              saveSkipPref();
            }

            item.name = newName;
            if (currentVideoId === item.id && topTitle) {
              topTitle.textContent = newName.replace(/\.[^.]+$/, '');
            }
            
            const skipVideoNameEl = $('skipCurrentVideoName');
            if (skipVideoNameEl && currentVideoId === item.id) {
              skipVideoNameEl.textContent = newName;
            }

            renderPlaylist(searchInput?.value || '');
            renderEpisodePopover();
            showToast(_('renamedTip'));
            savePlaylist();
          }
        });
      } else if (action === 'delete') {
        showConfirm(_('deleteVideoTitle'), `${_('deleteVideoConfirm')} "${item.name}" ?`, true, async () => {
          await removeVideo(item.id, deleteSourceCheck?.checked, true);
          renderFolderNav();
          renderPlaylist(searchInput?.value || '');
        });
      }
    });

    setTimeout(() => {
      const closeHandler = (ev) => {
        if (activeCtxMenu && !activeCtxMenu.contains(ev.target)) {
          activeCtxMenu.remove();
          activeCtxMenu = null;
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 10);
  }

  let confirmCallback = null;
  function showConfirm(title, text, showCheckbox, cb) {
    if (!confirmModal) return;
    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmText) confirmText.textContent = text;
    if (deleteSourceGroup) deleteSourceGroup.style.display = showCheckbox ? 'flex' : 'none';
    if (deleteSourceCheck) deleteSourceCheck.checked = false;
    confirmCallback = cb;
    if (modalBackdrop) modalBackdrop.classList.add('show');
    confirmModal.classList.add('show');
  }

  function closeConfirm() {
    if (confirmModal) confirmModal.classList.remove('show');
    confirmCallback = null;
    if (!infoModal?.classList.contains('show') && !inputModal?.classList.contains('show') && !matchModal?.classList.contains('show')) {
      if (modalBackdrop) modalBackdrop.classList.remove('show');
    }
  }

  if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeConfirm);
  if (confirmOkBtn) {
    confirmOkBtn.addEventListener('click', async () => {
      if (confirmCallback) await confirmCallback();
      closeConfirm();
    });
  }

  function renderEpisodePopover() {
    if (!episodeList) return;
    episodeList.innerHTML = '';
    let lastFolder = null;
    let filtered = playlist;
    if (activeFolderFilter && activeFolderFilter !== ALL_VIDEOS_KEY) {
      filtered = playlist.filter(p => p.folder === activeFolderFilter);
    }
    filtered.forEach((item, index) => {
      const displayFolder = folderDisplayName(item.folder);
      if (displayFolder && displayFolder !== lastFolder) {
        const header = document.createElement('div');
        header.className = 'episode-folder-header';
        header.textContent = displayFolder;
        episodeList.appendChild(header);
        lastFolder = displayFolder;
      }
      const div = document.createElement('div');
      div.className = 'episode-item' + (item.id === currentVideoId ? ' active' : '');
      div.innerHTML = `<span class="ep-num">${index + 1}</span><span class="ep-name">${item.name}</span>`;
      div.addEventListener('click', () => playVideoById(item.id));
      episodeList.appendChild(div);
    });
  }

  function renderSpeedPopover() {
    if (!speedPopover) return;
    speedPopover.innerHTML = '';
    speeds.forEach(speed => {
      const div = document.createElement('div');
      div.className = 'speed-item' + (currentSpeed === speed ? ' active' : '');
      div.textContent = speed === 1.0 ? '1.0x' : speed + 'x';
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        currentSpeed = speed;
        if (video) video.playbackRate = speed;
        const sBtn = $('speedBtn');
        if (sBtn) sBtn.textContent = speed === 1.0 ? _('speed') : speed + 'x';
        renderSpeedPopover();
        savePlayerState();
        showToast(`${_('speedTipMsg')}: ${speed}x`);
      });
      speedPopover.appendChild(div);
    });
  }

  function addVideos(inputs, skipRefresh = false) {
    const items = Array.from(inputs);
    const accepted = items.filter(it => {
      if (it instanceof File) return it.type.startsWith('video/') || VIDEO_EXT_RE.test(it.name);
      return it.path && VIDEO_EXT_RE.test(it.name);
    });
    if (accepted.length === 0) return showToast(_('invalidVideo'));

    let addedCount = 0;
    let firstAddedId = null;

    accepted.forEach(it => {
      const name = it.name;
      const size = it instanceof File ? it.size : (it.size || 0);
      if (playlist.some(p => p.name === name && p.file.size === size)) return;

      const id = ++idCounter;
      let url, fileMeta, isTauriPath = false;

      if (it instanceof File) {
        url = URL.createObjectURL(it);
        fileMeta = it;
      } else {
        url = toAssetUrl(it.path);
        fileMeta = { name, size, path: it.path };
        isTauriPath = true;
      }

      let normalizedFolder = it.folder;
      if (!normalizedFolder || normalizedFolder === 'uncategorized' || normalizedFolder === _('uncategorized') || normalizedFolder === '未分类') {
        normalizedFolder = UNCATEGORIZED_KEY;
      }

      const newItem = {
        id, file: fileMeta, name, url, duration: null, thumbnail: null, subtitle: null,
        isTauriPath, localPath: isTauriPath ? it.path : null,
        localDir: isTauriPath ? it.path.replace(/[\\/][^\\/]+$/, '') : null,
        folder: normalizedFolder
      };

      // ================= 【核心升级】智能重连配置逻辑 =================
      const oldVideoKey = name + '_' + size;
      
      // 1. 优先匹配：完全同名同大小
      if (skipPref.videoConfig[oldVideoKey]) {
        console.log(`[配置重连] 完全匹配: ${name}`);
      } else {
        // 2. 模糊匹配：去垃圾字符 + 大小近似
        const cleanName = name.replace(/\[.*?\]|\(.*?\)|\..*$|\_x264|_1080p|_720p|_HEVC/ig, '').trim();
        for (const configKey of Object.keys(skipPref.videoConfig)) {
          if (configKey === oldVideoKey) continue;
          const [configName, configSizeStr] = configKey.split('_');
          const configSize = parseInt(configSizeStr, 10);
          const cleanConfigName = configName.replace(/\[.*?\]|\(.*?\)|\..*$|\_x264|_1080p|_720p|_HEVC/ig, '').trim();
          if (cleanName === cleanConfigName && Math.abs(configSize - size) / size < 0.05) {
            console.log(`[配置重连] 模糊匹配成功: ${configName} -> ${name}`);
            skipPref.videoConfig[oldVideoKey] = skipPref.videoConfig[configKey];
            saveSkipPref();
            break;
          }
        }
        
        // 3. 时长指纹匹配
        newItem._needFingerprintMatch = true;
        newItem._cleanName = cleanName;
      }
      // ================================================================

      playlist.push(newItem);
      addedCount++;
      if (firstAddedId === null) firstAddedId = id;
      loadVideoMeta(newItem);
    });

    if (addedCount === 0) return showToast(_('existVideo'));

    playlist.sort((a, b) => {
      if (a.folder !== b.folder) return (a.folder || '').localeCompare(b.folder || '', undefined, { numeric: true });
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    if (!skipRefresh) {
      if (playlistPanel) {
        playlistPanel.classList.remove('collapsed');
        updateTabUI();
      }
      
      activeFolderFilter = ALL_VIDEOS_KEY;
      
      renderFolderNav();
      
      requestAnimationFrame(() => {
        renderPlaylist(searchInput?.value || '');
        renderEpisodePopover();
        if (!currentVideoId && firstAddedId) playVideoById(firstAddedId);
      });

      showToast(`${_('addedVideo')} ${addedCount} ${_('addedVideoCount')}`);
      savePlaylist();
    }
  }

  function loadVideoMeta(item) {
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.muted = true;
    tempVideo.src = item.url;

    tempVideo.addEventListener('loadedmetadata', () => {
      item.duration = tempVideo.duration;
      
      if (item._needFingerprintMatch) {
        const newKey = item.name + '_' + item.file.size;
        for (const configKey of Object.keys(skipPref.videoConfig)) {
          const [configName] = configKey.split('_');
          const cleanConfigName = configName.replace(/\[.*?\]|\(.*?\)|\..*$|\_x264|_1080p|_720p|_HEVC/ig, '').trim();
          if (item._cleanName === cleanConfigName) {
            console.log(`[配置重连] 指纹校验通过: ${configName} -> ${item.name}`);
            skipPref.videoConfig[newKey] = skipPref.videoConfig[configKey];
            saveSkipPref();
            break;
          }
        }
        delete item._needFingerprintMatch;
      }

      try {
        tempVideo.currentTime = Math.min(1, tempVideo.duration * 0.1);
      } catch (e) {}
    });
    tempVideo.addEventListener('seeked', () => {
      tempVideo.removeAttribute('src');
      tempVideo.load();
    });
    tempVideo.addEventListener('error', () => {
      item.duration = null;
      tempVideo.removeAttribute('src');
      tempVideo.load();
    });
  }

  async function removeVideo(id, deleteSource = false, skipRefresh = false) {
    const index = playlist.findIndex(item => item.id === id);
    if (index === -1) return;
    const item = playlist[index];

    storage.remove('video_play_progress_' + item.name + '_' + item.file.size);

    if (deleteSource && item.isTauriPath && isTauri) {
      try {
        await TAURI.fs.remove(item.localPath);
      } catch (e) {
        console.error(_('deleteSourceTip') || '物理删除失败', e);
      }
    }

    if (id === currentVideoId) {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      hideVideoLoading();
      videoLoadingToken++;
      
      if (!item.isTauriPath) URL.revokeObjectURL(item.url);
      currentVideoId = null;
      playlist.splice(index, 1);

      if (window.Subtitle) Subtitle.setCues('');

      if (playlist.length > 0) {
        playVideoById(playlist[0].id);
      } else {
        resetPlayerUI();
      }
    } else {
      if (!item.isTauriPath) URL.revokeObjectURL(item.url);
      playlist.splice(index, 1);
    }

    if (!skipRefresh) {
      renderFolderNav();
      renderPlaylist(searchInput?.value || '');
    }
    savePlaylist();
  }

  function resetPlayerUI() {
    hideResumeTip();
    hideVideoLoading();
    videoLoadingToken++;
    if (window.Subtitle) Subtitle.setCues('');
    if (placeholder) placeholder.classList.remove('hidden');
    setControlsEnabled(false);
    updatePlayIcon();
    if (timeDisplay) timeDisplay.textContent = '0:00 / 0:00';
    if (progressBar) progressBar.style.width = '0%';
    if (bufferedBar) bufferedBar.style.width = '0%';
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';
    thumbCache.clear();
    if (topTitle) topTitle.textContent = _('noVideoPlay');
    window.isPlayingVideo = false;

    const skipVideoNameEl = $('skipCurrentVideoName');
    const skipVideoHintEl = $('skipCurrentVideoHint');
    if (skipVideoNameEl) skipVideoNameEl.textContent = _('noVideoPlay');
    if (skipVideoHintEl) skipVideoHintEl.classList.add('empty');

    const subSliderTrackEl = $('subSliderTrack');
    if (subSliderTrackEl) subSliderTrackEl.classList.remove('show-advanced');
    clearTimeout(uiTimeout);
    if (mainArea) mainArea.classList.add('ui-visible');
    if (skipIntroBtn) skipIntroBtn.classList.remove('show');
    loadSkipConfigForCurrentVideo();
    if (isScreenLocked) toggleScreenLock(false);
  }

    function playVideoById(id) {
    const item = playlist.find(p => p.id === id);
    if (!item || !video) return;

    hideResumeTip();

    // —— 显示加载动画 + 生成 token 防竞态 ——
    const myToken = ++videoLoadingToken;
    showVideoLoading();

    video.pause();
    video.src = item.url;
    video.load();
    currentVideoId = id;
    if (placeholder) placeholder.classList.add('hidden');
    setControlsEnabled(true);

    // —— 加载结束/失败时隐藏动画 ——
    const onReady = () => {
      if (myToken !== videoLoadingToken) return;
      hideVideoLoading();
    };
    video.addEventListener('canplay', onReady, { once: true });
    video.addEventListener('error', onReady, { once: true });

    if (topTitle) topTitle.textContent = item.name.replace(/\.[^.]+$/, '');
    window.isPlayingVideo = true;

    const skipVideoNameEl = $('skipCurrentVideoName');
    const skipVideoHintEl = $('skipCurrentVideoHint');
    if (skipVideoNameEl) skipVideoNameEl.textContent = item.name;
    if (skipVideoHintEl) skipVideoHintEl.classList.remove('empty');

    video.playbackRate = currentSpeed;
    const key = 'video_play_progress_' + item.name + '_' + item.file.size;
    const savedTime = storage.get(key);

    const onLoadedMetadata = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (time > 0 && time < video.duration - 3) {
          video.currentTime = time;
          showResumeTip(time);
        }
      }
      video.play().catch(e => console.log(_('autoplayBlocked') || '自动播放被阻止:', e));
      savePlaylist();
    };
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('loadedmetadata', loadSkipConfigForCurrentVideo, { once: true });

    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    thumbCache.clear();
    thumbVideo.removeAttribute('src');
    thumbVideo.load();
    thumbVideo.src = item.url;

    if (window.Subtitle) {
      if (item.subtitle && item.subtitle.rawText) {
        Subtitle.setCues(item.subtitle.rawText, item);
      } else {
        Subtitle.setCues('', null);
      }
    }

    updateVolumeUI();
    loadSkipConfigForCurrentVideo();
    updateSkipButton();

    renderPlaylist(searchInput?.value || '');

    setTimeout(() => {
      const activeItem = playlistBody?.querySelector('.playlist-item.active');
      if (activeItem) activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function playPrev() {
    if (!currentVideoId || playlist.length <= 1) return;
    const index = playlist.findIndex(p => p.id === currentVideoId);
    if (index > 0) playVideoById(playlist[index - 1].id);
    else showToast(_('firstVideoTip'));
  }

  function playNext() {
    if (!currentVideoId || playlist.length <= 1) return;
    const index = playlist.findIndex(p => p.id === currentVideoId);
    if (index < playlist.length - 1) playVideoById(playlist[index + 1].id);
    else showToast(_('lastVideoTip'));
  }

  function togglePlay() {
    if (!video || !video.src) return;
    if (video.paused) video.play().catch(e => console.log(e));
    else video.pause();
  }

  function toggleMute() {
    if (!video || !video.src) return;
    video.muted = !video.muted;
    updateVolumeUI();
  }

  function handleVolumeChange() {
    if (!video || !video.src || !volumeSlider) return;
    const val = parseFloat(volumeSlider.value);
    video.volume = val;
    video.muted = (val === 0);
    updateVolumeUI();
  }

  function toggleFullscreen() {
    if (!video || !video.src) return;
    if (!document.fullscreenElement) {
      if (playerContainer) playerContainer.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  }

  function togglePiP() {
    if (!video || !video.src) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else video.requestPictureInPicture().catch(err => console.log(err));
  }

  async function pickVideoFiles() {
    if (!isTauri) { fileInput?.click(); return; }
    try {
      const picked = await TAURI.dialog.open({
        multiple: true, title: _('selectFileTitle') || '选择视频文件',
        filters: [{ name: _('videoFilterName') || '视频', extensions: ['mp4','webm','ogg','mkv','avi','mov'] }]
      });
      if (!picked) return;
      const paths = Array.isArray(picked) ? picked : [picked];
      const items = [];
      for (const p of paths) {
        let size = 0;
        try { size = (await TAURI.fs.stat(p)).size; } catch(e) {}
        items.push({ name: baseName(p), size, path: p, folder: UNCATEGORIZED_KEY });
      }
      addVideos(items);
    } catch (err) {
      console.error(err);
      showToast(_('fileSelectFail'));
    }
  }

  async function pickVideoFolder() {
    if (!isTauri) return showToast(_('folderSelectFail'));
    try {
      const dir = await TAURI.dialog.open({ 
        directory: true, 
        multiple: false, 
        title: _('selectFolderTitle') || '选择视频文件夹' 
      });
      if (!dir) return;
      const videoItems = [];

      async function scan(path, currentFolder = '') {
        let entries;
        try {
          entries = await TAURI.fs.readDir(path);
        } catch (e) {
          return;
        }
        for (const entry of entries) {
          const full = joinPath(path, entry.name);
          if (entry.isDirectory) {
            const nextFolder = currentFolder ? `${currentFolder}/${entry.name}` : entry.name;
            await scan(full, nextFolder);
          } else if (VIDEO_EXT_RE.test(entry.name)) {
            let size = 0;
            try { size = (await TAURI.fs.stat(full)).size; } catch(e) {}
            videoItems.push({
              name: entry.name,
              size,
              path: full,
              folder: currentFolder || UNCATEGORIZED_KEY
            });
          }
        }
      }

      await scan(dir);
      if (videoItems.length === 0) return showToast(_('noVideoInFolder'));
      addVideos(videoItems);
      showToast(`${_('importFolderTip')} ${videoItems.length} ${_('importFolderCount')}`, 2600);
    } catch (err) {
      console.error(err);
      showToast(_('folderSelectFail'));
    }
  }

  if (importBtn) importBtn.addEventListener('click', pickVideoFolder);
  if (addFolderBtn) addFolderBtn.addEventListener('click', pickVideoFolder);
  if (addVideoBtn) addVideoBtn.addEventListener('click', pickVideoFiles);

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) addVideos(e.target.files);
      fileInput.value = '';
    });
  }

  if (playerContainer) {
    playerContainer.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    playerContainer.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); });

    playerContainer.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
      const subFiles = files.filter(f => SUB_EXT_RE.test(f.name));
      const videoFiles = files.filter(f => f.type.startsWith('video/') || VIDEO_EXT_RE.test(f.name));

      if (videoFiles.length > 0) {
        videoFiles.forEach(f => f.folder = UNCATEGORIZED_KEY);
        addVideos(videoFiles);
      }

      if (subFiles.length > 0) {
        if (!currentVideoId) {
          showToast(_('dragVideoFirst'));
        } else {
          const item = playlist.find(p => p.id === currentVideoId);
          if (window.Subtitle) Subtitle.loadSubtitleFile(subFiles[0], item);
          renderPlaylist(searchInput?.value || '');
          savePlaylist();
        }
      }

      if (subFiles.length === 0 && videoFiles.length === 0) showToast(_('dragHint'));
    });
  }

  if (video) {
    video.addEventListener('dragover', e => e.preventDefault());
    video.addEventListener('drop', e => e.preventDefault());
  }

  const importSubtitleBtn = $('importSubtitleBtn');
  if (importSubtitleBtn) {
    importSubtitleBtn.addEventListener('click', () => {
      if (!currentVideoId) return showToast(_('dragSubFirst'));
      const item = playlist.find(p => p.id === currentVideoId);
      const subInput = $('subtitleInput');
      if (subInput) {
        subInput.onchange = (e) => {
          if (e.target.files[0] && window.Subtitle) {
            Subtitle.loadSubtitleFile(e.target.files[0], item);
            savePlaylist();
          }
          subInput.value = '';
        };
        subInput.click();
      }
    });
  }

  const removeSubtitleBtn = $('removeSubtitleBtn');
  if (removeSubtitleBtn) {
    removeSubtitleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = playlist.find(p => p.id === currentVideoId);
      if (window.Subtitle) Subtitle.setCues('', item);
      showToast(_('removedSubTip'));
      renderPlaylist(searchInput?.value || '');
      savePlaylist();
    });
  }

  const showAdvancedBtn = $('showAdvancedBtn');
  if (showAdvancedBtn) {
    showAdvancedBtn.addEventListener('click', () => {
      $('subSliderTrack')?.classList.add('show-advanced');
    });
  }
  const backToBasicBtn = $('backToBasicBtn');
  if (backToBasicBtn) {
    backToBasicBtn.addEventListener('click', () => {
      $('subSliderTrack')?.classList.remove('show-advanced');
    });
  }

  if (video) {
    video.addEventListener('play', updatePlayIcon);
    video.addEventListener('pause', updatePlayIcon);
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('durationchange', () => {
      updateTimeDisplay();
      updateBuffered();
      updateSkipButton();
    });
    video.addEventListener('volumechange', updateVolumeUI);
    video.addEventListener('seeked', () => {
      if (window.Subtitle) Subtitle.tick();
      updateSkipButton();
    });

    video.addEventListener('ended', () => {
      if (currentVideoId) {
        const item = playlist.find(p => p.id === currentVideoId);
        if (item) storage.remove('video_play_progress_' + item.name + '_' + item.file.size);
      }
      if (isLoop) {
        video.currentTime = 0;
        video.play();
      } else if (isAutoNext) {
        const index = playlist.findIndex(p => p.id === currentVideoId);
        if (index !== -1 && index < playlist.length - 1) {
          playNext();
        } else {
          updatePlayIcon();
        }
      } else {
        updatePlayIcon();
      }
    });
  }

  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', playPrev);
  if (nextBtn) nextBtn.addEventListener('click', playNext);
  const muteBtn = $('muteBtn');
  if (muteBtn) muteBtn.addEventListener('click', toggleMute);
  if (volumeSlider) volumeSlider.addEventListener('input', handleVolumeChange);
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
  if (pipBtn) pipBtn.addEventListener('click', togglePiP);

  if (progressBarContainer) {
    progressBarContainer.addEventListener('mousedown', handleProgressStart);
    progressBarContainer.addEventListener('mousemove', handleProgressHover);
    progressBarContainer.addEventListener('mouseleave', () => {
      if (!isDraggingProgress && previewTooltip) previewTooltip.style.opacity = '0';
    });
    progressBarContainer.addEventListener('mouseenter', () => {
      if (!isDraggingProgress && previewTooltip) previewTooltip.style.opacity = '1';
    });
  }
  document.addEventListener('mouseup', () => {
    if (isDraggingProgress) handleProgressEnd();
  });
  document.addEventListener('fullscreenchange', updateFullscreenIcon);

  if (settingLoop) {
    settingLoop.addEventListener('click', () => {
      isLoop = !isLoop;
      settingLoop.classList.toggle('active', isLoop);
      savePlayerState();
      showToast(isLoop ? _('loopOnTip') : _('loopOffTip'));
    });
  }

  if (settingAutoNext) {
    settingAutoNext.addEventListener('click', () => {
      isAutoNext = !isAutoNext;
      settingAutoNext.classList.toggle('active', isAutoNext);
      savePlayerState();
      showToast(isAutoNext ? _('autoNextOnTip') : _('autoNextOffTip'));
    });
  }

  fitOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      fitOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      currentFit = opt.dataset.fit;
      if (video) video.className = 'fit-' + currentFit;
      showToast(`${_('fitTip')}: ${opt.textContent}`);
    });
  });

  if (document.pictureInPictureEnabled && video && video.requestPictureInPicture) {
    if (pipBtn) pipBtn.style.display = 'flex';
  }

  setControlsEnabled(false);
  updatePlayIcon();
  updateVolumeUI();
  updateTimeDisplay();
  updateBuffered();
  renderFolderNav();
  
  setTimeout(() => {
    renderFolderNav();
    renderPlaylist();
    renderEpisodePopover();
  }, 50);
  
  renderSpeedPopover();
  updateTabUI();
  showUI();
  if (window.Subtitle) Subtitle.init();

  renderShortcuts();
  updateShortcutUI();
  toggleKbdDisplay(showKbd);
  applyVideoFilter();

  if (window.I18n) {
    window.I18n.init();
  }

  if (settingLoop) settingLoop.classList.toggle('active', isLoop);
  if (settingAutoNext) settingAutoNext.classList.toggle('active', isAutoNext);
  if (video) video.playbackRate = currentSpeed;
  if (currentSpeed !== 1.0) {
    const sBtn = $('speedBtn');
    if (sBtn) sBtn.textContent = currentSpeed + 'x';
  }

  window.refreshManageBtnText = function() {
    if (manageBtn) manageBtn.textContent = isManaging ? _('cancelManage') : _('manage');
  };

  window.addEventListener('beforeunload', () => { savePlaylist(); });

  window.onAuthReady = async function(username, namespace) {
    const hasMeta = storage.get('video_playlist_meta');
    if (hasMeta) {
      showPlaylistSkeleton();
    } else {
      isRestoring = false;
    }

    try {
      await restorePlaylist();
    } catch (e) {
      console.warn('[Playlist] restore failed', e);
    } finally {
      isRestoring = false; 
      activeFolderFilter = ALL_VIDEOS_KEY;
      if (searchInput) searchInput.value = '';
      
      renderFolderNav();
      renderPlaylist();
      updateTabUI();
      
      if (playlist.length > 0 && !currentVideoId) {
        playVideoById(playlist[0].id);
      }
    }
  };

  // ================= 配置导出与导入 (完整列表版) =================
  function getFullConfigData() {
    const data = {};
    // 1. 收集所有设置项
    const keysToExport = [
      'video_shortcut_pref',
      'video_shortcut_show',
      'video_skip_pref_v5',
      'video_player_state',
      'video_filter_pref',
      'sub_style_pref',
      'video_playlist_meta',
      'video_play_history',
      'video_last_played',
      'video_custom_nickname',
      'video_custom_avatar'
    ];

    keysToExport.forEach(key => {
      const val = localStorage.getItem(NS + key);
      if (val) data[key] = val;
    });

    // 2. 收集所有视频的播放进度 (以 video_play_progress_ 开头)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NS + 'video_play_progress_')) {
        const cleanKey = key.replace(NS, '');
        data[cleanKey] = localStorage.getItem(key);
      }
    }
    return data;
  }

  const exportConfigBtn = $('exportConfigBtn');
  const importConfigBtn = $('importConfigBtn');
  const configFileInput = $('configFileInput');

  if (exportConfigBtn) {
    exportConfigBtn.addEventListener('click', () => {
      const configData = {
        _version: '1.6.2',
        _exportAt: new Date().toISOString(),
        data: getFullConfigData()
      };

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_player_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(_('exportSuccess')); // 👈 走 i18n
    });
  }

  if (importConfigBtn) {
    importConfigBtn.addEventListener('click', () => {
      if (configFileInput) configFileInput.click();
    });
  }

  if (configFileInput) {
    configFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          if (!json.data) throw new Error('Missing data field');

          // 清空旧的进度
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith(NS + 'video_play_progress_')) localStorage.removeItem(k);
          });

          // 写入新数据
          Object.keys(json.data).forEach(key => {
            localStorage.setItem(NS + key, json.data[key]);
          });

          showToast(_('importSuccess')); // 👈 走 i18n
          setTimeout(() => { location.reload(); }, 1500);

        } catch (err) {
          console.error('[配置导入失败]', err);
          showToast(_('importFail')); // 👈 走 i18n
          configFileInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }
  // ================================================================

  if (window.Auth) {
    window.Auth.init();
  }

  if (!isTauri) {
    console.warn('[播放器] 未检测到 Tauri 环境，文件夹引用不可用，将回退到文件选择。');
  }
})();