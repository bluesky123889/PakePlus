(function () {
  'use strict';

  const DB_NAME = 'melodybox';
  const DB_VERSION = 1;
  const STORE_TRACKS = 'tracks';
  const STORE_AUDIO = 'audioFiles';

  const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%231f1b2e'/%3E%3Ccircle cx='200' cy='200' r='120' fill='%233d2e5c'/%3E%3Ccircle cx='200' cy='200' r='80' fill='%235b3f8c'/%3E%3Ccircle cx='200' cy='200' r='40' fill='%238b5cf6'/%3E%3Ctext x='200' y='215' font-family='Arial' font-size='24' fill='white' text-anchor='middle'%3E%E2%99%AA%3C/text%3E%3C/svg%3E";

  let playlist = [];
  let currentIndex = 0;
  let loopMode = 0;
  let lastCountedId = null;
  let currentLyricOffset = 0;
  let searchKeyword = '';

  const LOOP_LABELS = ['列表循环', '单曲循环', '顺序播放'];

  const BG_SETTINGS_KEY = 'melodybox_bg_settings';
  let bgSettings = {
    source: 'color',
    image: null,
    video: null,
    videoPath: null,
    color: '#1f1b2e',
    bright: 0.6,
    blur: 0,
    overlayOpacity: 0.4
  };

  const BG_GALLERY_KEY = 'melodybox_bg_gallery';
  let bgGallery = [];

  const BG_VIDEO_GALLERY_KEY = 'melodybox_bg_video_gallery';
  let bgVideoGallery = [];

  function loadBgGallery() {
    try {
      const raw = localStorage.getItem(BG_GALLERY_KEY);
      if (raw) bgGallery = JSON.parse(raw);
    } catch (e) {}

    if (bgSettings.image && !bgGallery.includes(bgSettings.image)) {
      bgGallery.unshift(bgSettings.image);
      try {
        localStorage.setItem(BG_GALLERY_KEY, JSON.stringify(bgGallery));
      } catch (e) {}
    }
  }

  function saveBgGallery(imgData) {
    if (!imgData) return;
    if (!bgGallery.includes(imgData)) {
      bgGallery.unshift(imgData);
      if (bgGallery.length > 10) bgGallery.pop();
      try {
        localStorage.setItem(BG_GALLERY_KEY, JSON.stringify(bgGallery));
      } catch (e) {}
    }
  }

  function loadBgVideoGallery() {
    try {
      const raw = localStorage.getItem(BG_VIDEO_GALLERY_KEY);
      if (raw) bgVideoGallery = JSON.parse(raw);
    } catch (e) {}

    if (bgSettings.video && !bgVideoGallery.includes(bgSettings.video)) {
      bgVideoGallery.unshift(bgSettings.video);
      try {
        localStorage.setItem(BG_VIDEO_GALLERY_KEY, JSON.stringify(bgVideoGallery));
      } catch (e) {}
    }
  }

  function saveBgVideoGallery(videoData) {
    if (!videoData) return;
    if (!bgVideoGallery.includes(videoData)) {
      bgVideoGallery.unshift(videoData);
      if (bgVideoGallery.length > 10) bgVideoGallery.pop();
      try {
        localStorage.setItem(BG_VIDEO_GALLERY_KEY, JSON.stringify(bgVideoGallery));
      } catch (e) {}
    }
  }

  function loadBgSettings() {
    try {
      const raw = localStorage.getItem(BG_SETTINGS_KEY);
      if (raw) Object.assign(bgSettings, JSON.parse(raw));
      if (bgSettings.source === 'cover') bgSettings.source = 'color';
      if (bgSettings.source === 'image' && !bgSettings.image) bgSettings.source = 'color';
      if (bgSettings.source === 'video' && !bgSettings.video) bgSettings.source = 'color';
    } catch (e) {
      console.warn('背景设置读取失败', e);
    }
  }
  function saveBgSettings() {
    try {
      localStorage.setItem(BG_SETTINGS_KEY, JSON.stringify(bgSettings));
    } catch (e) {
      console.warn('背景设置保存失败', e);
    }
  }

  const PLAY_SETTINGS_KEY = 'melodybox_play_settings';
  let playSettings = {
    defaultVolume: 1,
    defaultLoopMode: 0,
    rememberProgress: true,
    restoreLastTrack: true,
    autoPlayOnStart: false,
    defaultSortOrder: 'asc',
    showUiShortcuts: true
  };

  function loadPlaySettings() {
    try {
      const raw = localStorage.getItem(PLAY_SETTINGS_KEY);
      if (raw) Object.assign(playSettings, JSON.parse(raw));
    } catch (e) {
      console.warn('播放设置读取失败', e);
    }
  }
  function savePlaySettings() {
    try {
      localStorage.setItem(PLAY_SETTINGS_KEY, JSON.stringify(playSettings));
    } catch (e) {
      console.warn('播放设置保存失败', e);
    }
  }

  const LYRIC_SETTINGS_KEY = 'melodybox_lyric_settings';
  let lyricSettings = {
    scale: 1,
    spacing: 1.6,
    showBilingual: true,
    showSpectrum: true
  };

  function loadLyricSettings() {
    try {
      const raw = localStorage.getItem(LYRIC_SETTINGS_KEY);
      if (raw) Object.assign(lyricSettings, JSON.parse(raw));
    } catch (e) {}
  }
  function saveLyricSettings() {
    try {
      localStorage.setItem(LYRIC_SETTINGS_KEY, JSON.stringify(lyricSettings));
    } catch (e) {}
  }

  const LYRIC_OFFSETS_KEY = 'melodybox_lyric_offsets';
  let lyricOffsets = {};

  function loadLyricOffsets() {
    try {
      const raw = localStorage.getItem(LYRIC_OFFSETS_KEY);
      if (raw) lyricOffsets = JSON.parse(raw);
    } catch (e) {}
  }

  function saveCurrentOffset(trackId, offset) {
    if (!trackId) return;
    lyricOffsets[trackId] = offset;
    try {
      localStorage.setItem(LYRIC_OFFSETS_KEY, JSON.stringify(lyricOffsets));
    } catch (e) {}
  }

  const PROGRESS_KEY = 'melodybox_progress';
  const LAST_TRACK_KEY = 'melodybox_last_track';

  function saveProgress(trackId, time) {
    if (!playSettings.rememberProgress || !trackId) return;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        trackId,
        time,
        at: Date.now()
      }));
    } catch (e) {}
  }
  function loadProgress(trackId) {
    if (!playSettings.rememberProgress || !trackId) return 0;
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return 0;
      const p = JSON.parse(raw);
      if (p.trackId !== trackId) return 0;
      return (typeof p.time === 'number' && p.time > 0) ? p.time : 0;
    } catch (e) {
      return 0;
    }
  }
  function saveLastTrack(trackId) {
    try {
      localStorage.setItem(LAST_TRACK_KEY, trackId || '');
    } catch (e) {}
  }
  function loadLastTrack() {
    try {
      return localStorage.getItem(LAST_TRACK_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  const SHORTCUTS_KEY = 'melodybox_shortcuts';

  const DEFAULT_SHORTCUTS = {
    playPause:    { code: 'Space',      ctrl: false, shift: false, alt: false, meta: false },
    toggleLoopMode:{ code: 'KeyR',      ctrl: false, shift: false, alt: false, meta: false },
    seekForward:  { code: 'ArrowRight', ctrl: false, shift: false, alt: false, meta: false },
    seekBackward: { code: 'ArrowLeft',  ctrl: false, shift: false, alt: false, meta: false },
    volumeUp:     { code: 'ArrowUp',    ctrl: false, shift: false, alt: false, meta: false },
    volumeDown:   { code: 'ArrowDown',  ctrl: false, shift: false, alt: false, meta: false },
    nextTrack:    { code: 'KeyN',       ctrl: false, shift: false, alt: false, meta: false },
    prevTrack:    { code: 'KeyP',       ctrl: false, shift: false, alt: false, meta: false },
    mute:         { code: 'KeyM',       ctrl: false, shift: false, alt: false, meta: false },
    openSettings: { code: 'KeyS',       ctrl: true,  shift: false, alt: false, meta: false },
    openPlaylist: { code: 'KeyL',       ctrl: true,  shift: false, alt: false, meta: false },
    escape:       { code: 'Escape',     ctrl: false, shift: false, alt: false, meta: false }
  };

  const SHORTCUT_LABELS = {
    playPause: '播放 / 暂停',
    toggleLoopMode: '切换播放模式',
    seekForward: '快进 5 秒',
    seekBackward: '后退 5 秒',
    volumeUp: '音量 +',
    volumeDown: '音量 −',
    nextTrack: '下一首',
    prevTrack: '上一首',
    mute: '静音切换',
    openSettings: '打开设置',
    openPlaylist: '打开播放列表',
    escape: '关闭弹窗'
  };

  let shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));

  function loadShortcuts() {
    try {
      const raw = localStorage.getItem(SHORTCUTS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.keys(DEFAULT_SHORTCUTS).forEach(k => {
          if (saved[k] && saved[k].code) shortcuts[k] = saved[k];
        });
      }
    } catch (e) {
      console.warn('快捷键设置读取失败', e);
    }
  }
  function saveShortcuts() {
    try {
      localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
    } catch (e) {
      console.warn('快捷键设置保存失败', e);
    }
  }
  function resetShortcuts() {
    shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    saveShortcuts();
  }
  function formatShortcut(sc) {
    if (!sc || !sc.code) return '未绑定';
    const parts = [];
    if (sc.ctrl) parts.push('Ctrl');
    if (sc.shift) parts.push('Shift');
    if (sc.alt) parts.push('Alt');
    if (sc.meta) parts.push('Meta');
    let key = sc.code;
    if (key.startsWith('Key')) key = key.slice(3);
    else if (key.startsWith('Digit')) key = key.slice(5);
    else if (key.startsWith('Arrow')) key = key.slice(5);
    else if (key === 'Space') key = 'Space';
    else if (key === 'Escape') key = 'Esc';
    parts.push(key);
    return parts.join(' + ');
  }
  function matchShortcut(e, sc) {
    if (!sc || !sc.code) return false;
    return e.code === sc.code &&
      !!e.ctrlKey === !!sc.ctrl &&
      !!e.shiftKey === !!sc.shift &&
      !!e.altKey === !!sc.alt &&
      !!e.metaKey === !!sc.meta;
  }

  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_TRACKS)) db.createObjectStore(STORE_TRACKS, {
          keyPath: 'id'
        });
        if (!db.objectStoreNames.contains(STORE_AUDIO)) db.createObjectStore(STORE_AUDIO, {
          keyPath: 'id'
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  function tx(storeName, mode) {
    return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
  }
  function idbPut(storeName, value) {
    return tx(storeName, 'readwrite').then(store => new Promise((res, rej) => {
      const req = store.put(value);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
  }
  function idbGet(storeName, key) {
    return tx(storeName, 'readonly').then(store => new Promise((res, rej) => {
      const req = store.get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
  }
  function idbGetAll(storeName) {
    return tx(storeName, 'readonly').then(store => new Promise((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    }));
  }
  function idbDelete(storeName, key) {
    return tx(storeName, 'readwrite').then(store => new Promise((res, rej) => {
      const req = store.delete(key);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    }));
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60),
      s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB';
    if (mb < 1024) return mb.toFixed(2) + ' MB';
    return (mb / 1024).toFixed(2) + ' GB';
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    } [ch]));
  }
  function showToast(msg, isError) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('error', !!isError);
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }
  function titleFromFileName(name) {
    return name.replace(/\.[^.]+$/, '').trim() || name;
  }
  function parseArtistTitleFromName(name) {
    const base = name.replace(/\.[^.]+$/, '').trim();
    const m = base.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (m) return {
      artist: m[1].trim(),
      title: m[2].trim()
    };
    return {
      artist: null,
      title: base
    };
  }
  function readDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const probe = new Audio();
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        clearTimeout(probe._timeoutId);
        URL.revokeObjectURL(url);
        probe.src = '';
        resolve(v);
      };
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => finish(isFinite(probe.duration) ? probe.duration : 0);
      probe.onerror = () => finish(0);
      probe._timeoutId = setTimeout(() => finish(0), 8000);
      probe.src = url;
    });
  }

  function pictureToDataUrl(pic) {
    if (!pic || !pic.data) return null;
    try {
      const data = pic.data;
      let bytes;
      if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
      else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      else if (Array.isArray(data)) bytes = new Uint8Array(data);
      else return null;
      const CHUNK = 0x8000;
      let binary = '';
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      const format = pic.format || 'image/jpeg';
      return `data:${format};base64,${window.btoa(binary)}`;
    } catch (e) {
      console.warn('封面转换失败', e);
      return null;
    }
  }

  function extractLyrics(tags) {
    if (!tags) return null;
    const candidates = [];
    if (tags.lyrics) {
      if (typeof tags.lyrics === 'string') candidates.push(tags.lyrics);
      else if (typeof tags.lyrics === 'object') {
        if (typeof tags.lyrics.lyrics === 'string') candidates.push(tags.lyrics.lyrics);
        if (typeof tags.lyrics.data === 'string') candidates.push(tags.lyrics.data);
        if (typeof tags.lyrics.text === 'string') candidates.push(tags.lyrics.text);
      }
    }
    if (tags.USLT) {
      if (typeof tags.USLT === 'string') candidates.push(tags.USLT);
      else if (typeof tags.USLT === 'object') {
        if (typeof tags.USLT.lyrics === 'string') candidates.push(tags.USLT.lyrics);
        if (typeof tags.USLT.data === 'string') candidates.push(tags.USLT.data);
        if (typeof tags.USLT.text === 'string') candidates.push(tags.USLT.text);
      }
    }
    if (tags.TXXX && typeof tags.TXXX === 'object') {
      const t = tags.TXXX;
      if (typeof t.data === 'string' && /\[?\d{1,2}:\d{2}/.test(t.data)) candidates.push(t.data);
    }
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return null;
  }

  function parseTags(file) {
    return new Promise((resolve) => {
      if (typeof jsmediatags === 'undefined') {
        resolve(null);
        return;
      }
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        resolve(v);
      };
      const timeoutId = setTimeout(() => finish(null), 5000);
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          try {
            const tags = tag.tags || {};
            finish({
              title: tags.title || null,
              artist: tags.artist || null,
              album: tags.album || null,
              year: tags.year || null,
              genre: tags.genre || null,
              track: tags.track || null,
              lyrics: extractLyrics(tags),
              cover: pictureToDataUrl(tags.picture)
            });
          } catch (err) {
            finish(null);
          }
        },
        onError: () => finish(null)
      });
    });
  }

  // ===== 拼音工具 =====
  function hasChinese(text) {
    return /[\u4e00-\u9fa5]/.test(text);
  }

  function buildPinyinIndex(text) {
    if (!text || typeof text !== 'string') return { full: '', initials: '' };
    try {
      const lib = window.pinyinPro || window.PinyinPro || window.pinyin;
      if (!lib || typeof lib.pinyin !== 'function') {
        return { full: text.toLowerCase(), initials: text.toLowerCase() };
      }
      const arr = lib.pinyin(text, { toneType: 'none', type: 'array' });
      const full = arr.join('').toLowerCase().replace(/\s+/g, '');
      const initials = arr.map(p => p.charAt(0)).join('').toLowerCase();
      return { full, initials };
    } catch (e) {
      return { full: text.toLowerCase(), initials: text.toLowerCase() };
    }
  }

  function matchSearch(source, keyword, precomputed) {
    if (!source) return false;
    const kw = keyword.toLowerCase().trim();
    if (!kw) return true;
    if (source.toLowerCase().includes(kw)) return true;
    if (!hasChinese(source)) return false;
    const idx = precomputed || buildPinyinIndex(source);
    if (!idx.full && !idx.initials) return false;
    if (idx.full.includes(kw)) return true;
    if (idx.initials.includes(kw)) return true;
    return false;
  }

  // ===== 听歌统计引擎 =====
  const STATS_KEY = 'melodybox_listen_stats';
  let statsCache = null;

  function getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getMondayStr() {
    const d = new Date();
    const day = d.getDay() || 7; 
    d.setDate(d.getDate() - day + 1);
    return getLocalDateStr(d);
  }

  function loadStats() {
    if (statsCache) return statsCache;
    try {
      const raw = localStorage.getItem(STATS_KEY);
      statsCache = raw ? JSON.parse(raw) : {};
    } catch (e) {
      statsCache = {};
    }
    return statsCache;
  }

  function saveStats() {
    if (!statsCache) return;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(statsCache));
    } catch (e) {}
  }

  function addListenTime(seconds, count = 0) {
    if (seconds <= 0 && count <= 0) return;
    const stats = loadStats();
    const today = getLocalDateStr();
    
    if (!stats[today]) stats[today] = { seconds: 0, count: 0 };
    stats[today].seconds += seconds;
    stats[today].count += count;
    
    saveStats();
  }

  function getStats(period) {
    const stats = loadStats();
    const today = new Date();
    
    let totalSeconds = 0;
    let totalCount = 0;
    let title = '';
    let dateLabel = '';

    if (period === 'day') {
      const todayStr = getLocalDateStr(today);
      const data = stats[todayStr] || { seconds: 0, count: 0 };
      totalSeconds = data.seconds;
      totalCount = data.count;
      title = '今日听歌';
      dateLabel = todayStr;
    } 
    else if (period === 'week') {
      const mondayStr = getMondayStr();
      for (const dateStr in stats) {
        if (dateStr >= mondayStr) {
          totalSeconds += stats[dateStr].seconds;
          totalCount += stats[dateStr].count;
        }
      }
      title = '本周听歌';
      dateLabel = `从 ${mondayStr} 起`;
    } 
    else if (period === 'month') {
      const monthPrefix = getLocalDateStr(today).substring(0, 7);
      for (const dateStr in stats) {
        if (dateStr.startsWith(monthPrefix)) {
          totalSeconds += stats[dateStr].seconds;
          totalCount += stats[dateStr].count;
        }
      }
      title = '本月听歌';
      dateLabel = monthPrefix;
    }

    return { totalSeconds, totalCount, title, dateLabel };
  }

  window.MB = {
    DEFAULT_COVER,
    STORE_TRACKS,
    STORE_AUDIO,
    LOOP_LABELS,

    idbPut,
    idbGet,
    idbGetAll,
    idbDelete,

    formatTime,
    formatBytes,
    escapeHtml,
    showToast,
    titleFromFileName,
    parseArtistTitleFromName,
    readDuration,
    parseTags,

    buildPinyinIndex,
    matchSearch,
    hasChinese,

    loadBgSettings,
    saveBgSettings,
    loadBgGallery,
    saveBgGallery,
    loadBgVideoGallery,
    saveBgVideoGallery,
    loadPlaySettings,
    savePlaySettings,
    loadLyricSettings,
    saveLyricSettings,
    loadLyricOffsets,
    saveCurrentOffset,
    saveProgress,
    loadProgress,
    saveLastTrack,
    loadLastTrack,

    loadShortcuts,
    saveShortcuts,
    resetShortcuts,
    formatShortcut,
    matchShortcut,
    SHORTCUT_LABELS,

    addListenTime,
    getStats,

    get playlist() { return playlist; },
    set playlist(v) { playlist = v; },
    get currentIndex() { return currentIndex; },
    set currentIndex(v) { currentIndex = v; },
    get loopMode() { return loopMode; },
    set loopMode(v) { loopMode = v; },
    get lastCountedId() { return lastCountedId; },
    set lastCountedId(v) { lastCountedId = v; },
    get currentLyricOffset() { return currentLyricOffset; },
    set currentLyricOffset(v) { currentLyricOffset = v; },
    get searchKeyword() { return searchKeyword; },
    set searchKeyword(v) { searchKeyword = v; },
    get bgSettings() { return bgSettings; },
    get bgGallery() { return bgGallery; },
    set bgGallery(v) { bgGallery = v; },
    get bgVideoGallery() { return bgVideoGallery; },
    set bgVideoGallery(v) { bgVideoGallery = v; },
    get playSettings() { return playSettings; },
    get lyricSettings() { return lyricSettings; },
    get lyricOffsets() { return lyricOffsets; },
    get shortcuts() { return shortcuts; }
  };
})();