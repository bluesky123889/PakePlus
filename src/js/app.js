/**
 * app.js
 * 业务逻辑：状态、DOM、渲染、事件、登录、设置、ZIP、锁定、导出保存位置、缩略图。
 */
(function () {
  'use strict';

  // ==================== 常量 ====================
  const REMEMBER_KEY = 'lingyu_remember';
  const CURRENT_USER_KEY = 'lingyu_current_user';
  const CURRENT_WALLPAPER_KEY = 'lingyu_current_wallpaper';
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
  const AVATAR_SIZE = 200;
  const ZIP_MANIFEST_VERSION = 1;
  const THUMB_MAX_W = 300;
  const THUMB_MAX_H = 200;
  const MAX_CURSOR_IMAGE_SIZE = 2 * 1024 * 1024;
  const MAX_NOTE_IMAGE_SIZE = 10 * 1024 * 1024;

  // ==================== 从 Utils / DB 取出常用函数 ====================
  const {
    generateId, formatTime, formatBytes, escapeHtml,
    extFromMime, generateVideoThumbnail, getCaretCoordinates,
    hashPassword, isValidUsername, generateRecoveryKey,
    eventToShortcut, matchShortcut, isValidShortcut,
    renderMarkdown
  } = window.Utils;

  const { bgDB, getUsers, saveUsers } = window.DB;

  // ==================== 全局状态 ====================
  let notes = [];
  let activeNoteId = null;
  let searchKeyword = '';
  let activeCategory = 'all';
  let sidebarHidden = false;
  let currentUser = null;
  let currentWallpaperId = null;
  let mainVideoObjectUrl = null;

  let settings = window.DB.defaultSettings();

  let pickerMode = 'bg';

  // ==================== DOM 引用 ====================
  const bgLayer = document.getElementById('bgLayer');
  const mainWallpaperVideo = document.getElementById('mainWallpaperVideo');
  const appContainer = document.getElementById('appContainer');

  const sidebarEl = document.getElementById('sidebar');
  const noteCountEl = document.getElementById('noteCount');
  const notesListEl = document.getElementById('notesList');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const searchInput = document.getElementById('searchInput');
  const categoryTabs = document.getElementById('categoryTabs');
  const emptyStateEl = document.getElementById('emptyState');
  const editorWrapperEl = document.getElementById('editorWrapper');
  const editorAreaEl = document.getElementById('editorArea');
  const noteTitleInput = document.getElementById('noteTitleInput');
  const noteContentInput = document.getElementById('noteContentInput');
  const notePreviewEl = document.getElementById('notePreview');
  const deleteNoteBtn = document.getElementById('deleteNoteBtn');
  const toggleModeBtn = document.getElementById('toggleModeBtn');
  const toggleModeIcon = document.getElementById('toggleModeIcon');
  const toggleModeText = document.getElementById('toggleModeText');
  const saveBtn = document.getElementById('saveBtn');
  const editorStatsEl = document.getElementById('editorStats');

  const lockBtn = document.getElementById('lockBtn');
  const lockBtnIcon = document.getElementById('lockBtnIcon');
  const lockBtnText = document.getElementById('lockBtnText');
  const lockOverlay = document.getElementById('lockOverlay');
  const lockInput = document.getElementById('lockInput');
  const lockUnlockBtn = document.getElementById('lockUnlockBtn');
  const lockError = document.getElementById('lockError');

  const settingsBtn = document.getElementById('settingsBtn');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsOverlay = document.getElementById('shortcutsOverlay');
  const shortcutsList = document.getElementById('shortcutsList');
  const shortcutsCloseBtn = document.getElementById('shortcutsCloseBtn');

  const settingsOverlay = document.getElementById('settingsOverlay');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.settings-page');

  const darkModeSwitch = document.getElementById('darkModeSwitch');
  const animationSwitch = document.getElementById('animationSwitch');
  const customCursorSwitch = document.getElementById('customCursorSwitch');
  const customCursorImageRow = document.getElementById('customCursorImageRow');

  const openCursorPanelBtn = document.getElementById('openCursorPanelBtn');
  const cursorOverlay = document.getElementById('cursorOverlay');
  const cursorCloseBtn = document.getElementById('cursorCloseBtn');
  const cursorPreviewThumb = document.getElementById('cursorPreviewThumb');
  const uploadCursorBtn = document.getElementById('uploadCursorBtn');
  const resetCursorBtn = document.getElementById('resetCursorBtn');
  const cursorImageInput = document.getElementById('cursorImageInput');
  const cursorTextPreviewThumb = document.getElementById('cursorTextPreviewThumb');
  const uploadCursorTextBtn = document.getElementById('uploadCursorTextBtn');
  const resetCursorTextBtn = document.getElementById('resetCursorTextBtn');
  const cursorTextImageInput = document.getElementById('cursorTextImageInput');
  const cursorPointerPreviewThumb = document.getElementById('cursorPointerPreviewThumb');
  const uploadCursorPointerBtn = document.getElementById('uploadCursorPointerBtn');
  const resetCursorPointerBtn = document.getElementById('resetCursorPointerBtn');
  const cursorPointerImageInput = document.getElementById('cursorPointerImageInput');

  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const galleryUrlInput = document.getElementById('galleryUrlInput');
  const galleryAddUrlBtn = document.getElementById('galleryAddUrlBtn');
  const galleryAddFileBtn = document.getElementById('galleryAddFileBtn');
  const galleryFileInput = document.getElementById('galleryFileInput');
  const blurSlider = document.getElementById('blurSlider');
  const blurValue = document.getElementById('blurValue');
  const sortSelect = document.getElementById('sortSelect');
  const trashRetentionSelect = document.getElementById('trashRetentionSelect');
  const defaultPreviewSelect = document.getElementById('defaultPreviewSelect');
  const sidebarDefaultSelect = document.getElementById('sidebarDefaultSelect');
  const autoSaveSelect = document.getElementById('autoSaveSelect');
  const mainWallpaperSwitch = document.getElementById('mainWallpaperSwitch');
  const exportBtn = document.getElementById('exportBtn');
  const exportZipBtn = document.getElementById('exportZipBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  const importZipBtn = document.getElementById('importZipBtn');
  const importZipFileInput = document.getElementById('importZipFileInput');
  const refreshUsageBtn = document.getElementById('refreshUsageBtn');
  const usageLocal = document.getElementById('usageLocal');
  const usageIdb = document.getElementById('usageIdb');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const clearGalleryBtn = document.getElementById('clearGalleryBtn');
  const cleanOrphanImagesBtn = document.getElementById('cleanOrphanImagesBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const viewRecoveryBtn = document.getElementById('viewRecoveryBtn');
  const regenRecoveryBtn = document.getElementById('regenRecoveryBtn');
  const resetShortcutsBtn = document.getElementById('resetShortcutsBtn');

  const noteLockStatus = document.getElementById('noteLockStatus');
  const setNoteLockPasswordBtn = document.getElementById('setNoteLockPasswordBtn');
  const noteLockPasswordDisplay = document.getElementById('noteLockPasswordDisplay');
  const viewNoteLockPasswordBtn = document.getElementById('viewNoteLockPasswordBtn');

  const pickSaveDirBtn = document.getElementById('pickSaveDirBtn');
  const clearSaveDirBtn = document.getElementById('clearSaveDirBtn');
  const saveDirDisplay = document.getElementById('saveDirDisplay');

  const bgPreview = document.getElementById('bgPreview');
  const bgPreviewWrapper = document.getElementById('bgPreviewWrapper');
  const switchBgBtn = document.getElementById('switchBgBtn');
  const wallpaperPreview = document.getElementById('wallpaperPreview');
  const wallpaperPreviewWrapper = document.getElementById('wallpaperPreviewWrapper');
  const switchWallpaperBtn = document.getElementById('switchWallpaperBtn');

  const pickerOverlay = document.getElementById('pickerOverlay');
  const pickerTitle = document.getElementById('pickerTitle');
  const pickerGrid = document.getElementById('pickerGrid');
  const pickerHint = document.getElementById('pickerHint');
  const pickerCloseBtn = document.getElementById('pickerCloseBtn');

  const shortcutEls = {
    toggleMode: document.getElementById('shortcutToggleMode'),
    toggleSidebar: document.getElementById('shortcutToggleSidebar'),
    newNote: document.getElementById('shortcutNewNote'),
    deleteNote: document.getElementById('shortcutDeleteNote'),
    toggleDark: document.getElementById('shortcutToggleDark'),
    openSettings: document.getElementById('shortcutOpenSettings'),
    export: document.getElementById('shortcutExport'),
    lock: document.getElementById('shortcutLock')
  };

  const mdMenuEl = document.getElementById('mdMenu');
  const linkTooltipEl = document.getElementById('linkTooltip');
  const customContextMenu = document.getElementById('customContextMenu');
  const noteContextMenu = document.getElementById('noteContextMenu');
  const trashBtn = document.getElementById('trashBtn');
  const trashOverlay = document.getElementById('trashOverlay');
  const trashCloseBtn = document.getElementById('trashCloseBtn');
  const trashList = document.getElementById('trashList');
  const emptyTrashBtn = document.getElementById('emptyTrashBtn');
  const nctxPinLabel = document.getElementById('nctxPinLabel');

  const dialogOverlay = document.getElementById('dialogOverlay');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogMessage = document.getElementById('dialogMessage');
  const dialogCustom = document.getElementById('dialogCustom');
  const dialogButtons = document.getElementById('dialogButtons');

  const loginOverlay = document.getElementById('loginOverlay');
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginRemember = document.getElementById('loginRemember');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginSwitchText = document.getElementById('loginSwitchText');
  const loginSwitchBtn = document.getElementById('loginSwitchBtn');
  const loginForgotBtn = document.getElementById('loginForgotBtn');
  const loginWallpaperBtn = document.getElementById('loginWallpaperBtn');
  const aboutOverlay = document.getElementById('aboutOverlay');
  const aboutCloseBtn = document.getElementById('aboutCloseBtn');

  const accountAvatar = document.getElementById('accountAvatar');
  const accountAvatarLetter = document.getElementById('accountAvatarLetter');
  const accountUsername = document.getElementById('accountUsername');
  const accountMeta = document.getElementById('accountMeta');
  const logoutBtn = document.getElementById('logoutBtn');

  const wallpaperOverlay = document.getElementById('wallpaperOverlay');
  const wallpaperCloseBtn = document.getElementById('wallpaperCloseBtn');
  const wallpaperAddBtn = document.getElementById('wallpaperAddBtn');
  const wallpaperFileInput = document.getElementById('wallpaperFileInput');
  const wallpaperGrid = document.getElementById('wallpaperGrid');

  const settingsWallpaperAddBtn = document.getElementById('settingsWallpaperAddBtn');
  const settingsWallpaperFileInput = document.getElementById('settingsWallpaperFileInput');

  const cropOverlay = document.getElementById('cropOverlay');
  const cropCloseBtn = document.getElementById('cropCloseBtn');
  const cropCancelBtn = document.getElementById('cropCancelBtn');
  const cropResetBtn = document.getElementById('cropResetBtn');
  const cropConfirmBtn = document.getElementById('cropConfirmBtn');
  const cropCanvas = document.getElementById('cropCanvas');
  const cropStage = document.getElementById('cropStage');
  const cropZoom = document.getElementById('cropZoom');

  const progressOverlay = document.getElementById('progressOverlay');
  const progressFill = document.getElementById('progressFill');
  const progressTitleEl = document.getElementById('progressTitle');
  const progressPercentEl = document.getElementById('progressPercent');

  // ==================== Toast 提示 ====================
  const TOAST_ICON_CHECK = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const TOAST_ICON_INFO = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  function showToast(message, icon = TOAST_ICON_CHECK, type = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 2000);
  }

  // ==================== 进度条控制 ====================
  let progressHideTimer = null;
  let progressResetTimer = null;

  function showProgress(title) {
    if (!progressOverlay) return;
    if (progressHideTimer) {
      clearTimeout(progressHideTimer);
      progressHideTimer = null;
    }
    if (progressResetTimer) {
      clearTimeout(progressResetTimer);
      progressResetTimer = null;
    }
    if (progressTitleEl) {
      progressTitleEl.textContent = title || '正在处理...';
    }
    if (progressPercentEl) {
      progressPercentEl.textContent = '0%';
    }
    progressFill.style.width = '0%';
    progressOverlay.classList.add('show');
  }

  function updateProgress(current, total) {
    if (!progressFill || total <= 0) return;
    const pct = Math.min(100, Math.round((current / total) * 100));
    progressFill.style.width = pct + '%';
    if (progressPercentEl) {
      progressPercentEl.textContent = pct + '%';
    }
  }

  function setProgressTitle(title) {
    if (progressTitleEl) progressTitleEl.textContent = title;
  }

  function hideProgress() {
    if (!progressOverlay) return;
    progressFill.style.width = '100%';
    if (progressPercentEl) {
      progressPercentEl.textContent = '100%';
    }
    progressHideTimer = setTimeout(() => {
      progressOverlay.classList.remove('show');
      progressHideTimer = null;
      progressResetTimer = setTimeout(() => {
        progressFill.style.width = '0%';
        if (progressPercentEl) progressPercentEl.textContent = '0%';
        progressResetTimer = null;
      }, 200);
    }, 150);
  }

  function yieldToUI() {
    return new Promise((r) => requestAnimationFrame(r));
  }

  async function readBlobWithProgress(blob, onProgress) {
    const total = blob.size;
    const out = new Uint8Array(total);
    const reader = blob.stream().getReader();
    let offset = 0;
    let chunkCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out.set(value, offset);
      offset += value.length;
      chunkCount++;
      if (onProgress) onProgress(offset);
      if (chunkCount % 4 === 0) {
        await yieldToUI();
      }
    }
    return out.subarray(0, offset);
  }

  // ==================== Splash Screen ====================
  let splashStarted = false;

  function initSplash() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    const lastUserEl = document.getElementById('splashLastUser');
    if (lastUserEl) {
      let lastUser = '';
      try { lastUser = localStorage.getItem('lingyu_last_username') || ''; } catch (e) {}
      if (lastUser) {
        lastUserEl.textContent = `上次登录：${lastUser}`;
      }
    }

    const start = () => {
      if (splashStarted) return;
      splashStarted = true;
      splash.classList.add('started');
      document.removeEventListener('keydown', onTrigger);
      document.removeEventListener('click', onTrigger);
      document.removeEventListener('touchstart', onTrigger);

      setTimeout(() => {
        splash.classList.add('hide');
        showLogin();
        setTimeout(() => {
          if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 1500);
      }, 1200);
    };

    const onTrigger = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      start();
    };

    document.addEventListener('keydown', onTrigger);
    document.addEventListener('click', onTrigger);
    document.addEventListener('touchstart', onTrigger, { passive: false });
  }

  // ==================== 生成缩略图 ====================
  function makeThumbnail(dataUrl, maxW = THUMB_MAX_W, maxH = THUMB_MAX_H) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ==================== Tauri 环境检测 ====================
  function isTauri() {
    return typeof window.__TAURI__ !== 'undefined'
      && typeof window.__TAURI__.fs !== 'undefined'
      && typeof window.__TAURI__.dialog !== 'undefined';
  }

  // ==================== 选择保存目录 ====================
  async function pickSaveDir() {
    if (!isTauri()) {
      await showAlert('当前环境不支持选择文件夹，请使用打包后的桌面版应用。', { title: '不支持' });
      return null;
    }
    try {
      const dir = await window.__TAURI__.dialog.open({ directory: true });
      if (!dir) return null;
      window.DB.saveSaveDir(currentUser, dir);
      updateSaveDirDisplay();
      showToast('已设置保存位置');
      return dir;
    } catch (e) {
      console.error('选择文件夹失败', e);
      await showAlert('选择文件夹失败：' + (e.message || '未知错误'));
      return null;
    }
  }

  function updateSaveDirDisplay() {
    if (!saveDirDisplay) return;
    if (!currentUser) {
      saveDirDisplay.textContent = '未设置';
      saveDirDisplay.classList.remove('set');
      if (clearSaveDirBtn) clearSaveDirBtn.style.display = 'none';
      return;
    }
    const dir = window.DB.loadSaveDir(currentUser);
    if (dir) {
      saveDirDisplay.textContent = dir;
      saveDirDisplay.classList.add('set');
      if (clearSaveDirBtn) clearSaveDirBtn.style.display = '';
    } else {
      saveDirDisplay.textContent = '未设置';
      saveDirDisplay.classList.remove('set');
      if (clearSaveDirBtn) clearSaveDirBtn.style.display = 'none';
    }
  }

  // ==================== 通过 Tauri 保存文件 ====================
  async function saveViaTauri(filename, data, isBinary) {
    let dir = window.DB.loadSaveDir(currentUser);

    if (!dir) {
      dir = await pickSaveDir();
      if (!dir) return { result: 'cancelled' };
    }

    try {
      const sep = dir.includes('\\') ? '\\' : '/';
      const fullPath = dir.endsWith(sep) ? dir + filename : dir + sep + filename;

      if (isBinary) {
        await window.__TAURI__.fs.writeFile(fullPath, data);
      } else {
        await window.__TAURI__.fs.writeTextFile(fullPath, data);
      }
      return { result: 'saved', path: fullPath };
    } catch (e) {
      console.error('Tauri 写文件失败', e);
      const msg = e.message || '';
      if (msg.includes('forbidden') || msg.includes('not allowed') || msg.includes('No such file') || msg.includes('not found')) {
        window.DB.removeSaveDir(currentUser);
        updateSaveDirDisplay();
        await showAlert('保存失败，路径可能已失效，请重新选择。\n\n' + msg, { title: '保存失败' });
      } else {
        await showAlert('保存失败：' + (msg || '未知错误'));
      }
      return { result: 'cancelled' };
    }
  }

  // ==================== Web 环境：保存文件 ====================
  async function saveBlob(blob, defaultFilename, fileTypeDesc, fileExt) {
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: fileTypeDesc,
            accept: { [fileExt.mime]: [fileExt.ext] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return 'saved';
      } catch (err) {
        if (err.name === 'AbortError') return 'cancelled';
        console.warn('showSaveFilePicker 失败，回落到默认下载：', err);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    a.click();
    URL.revokeObjectURL(url);
    return 'fallback';
  }

  // ==================== 滑块填充 ====================
  function updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #5b8dee 0%, #5b8dee ${percent}%, rgba(255, 255, 255, 0.2) ${percent}%, rgba(255, 255, 255, 0.2) 100%)`;
  }

  // ==================== 自动保存定时器 ====================
  let autoSaveTimer = null;

  function scheduleAutoSave() {
    if (settings.autoSaveInterval <= 0) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (activeNoteId) {
        const changed = syncEditorToActiveNote();
        if (changed) showToast('已自动保存');
      }
      autoSaveTimer = null;
    }, settings.autoSaveInterval * 60 * 1000);
  }

  function flushAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    if (activeNoteId) syncEditorToActiveNote();
  }

  // ==================== 动画开关 ====================
  function applyAnimationSetting() {
    if (settings.animationEnabled) {
      document.body.classList.remove('no-animation');
    } else {
      document.body.classList.add('no-animation');
    }
  }

  // ==================== 自定义光标 ====================
  let cursorInited = false;
  let cursorDotEl = null;
  let cursorRingEl = null;
  let cursorMouseX = 0;
  let cursorMouseY = 0;
  let cursorRingX = 0;
  let cursorRingY = 0;
  let cursorVisible = false;
  let cursorRAF = null;

  const CURSOR_HOVER_SELECTOR = 'a, button, [role="button"], .top-btn, .new-note-btn, ' +
    '.footer-btn, .btn-primary, .btn-secondary, .btn-danger, .nav-item, ' +
    '.note-item, .gallery-item, .wallpaper-item, .dialog-btn, .login-btn, ' +
    '.login-switch-btn, .login-wallpaper-btn, .crop-btn, .lock-unlock-btn, ' +
    '.shortcut-input, .switch, .settings-header .close-btn, .gallery-del, ' +
    '.wallpaper-del, .dialog-copy-btn, .login-forgot-btn';

  const CURSOR_TEXT_SELECTOR = 'input[type="text"], input[type="password"], input:not([type]), textarea';

  function initCustomCursor() {
    if (cursorInited) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    cursorDotEl = document.getElementById('cursorDot');
    cursorRingEl = document.getElementById('cursorRing');
    if (!cursorDotEl || !cursorRingEl) return;

    cursorInited = true;

    cursorMouseX = window.innerWidth / 2;
    cursorMouseY = window.innerHeight / 2;
    cursorRingX = cursorMouseX;
    cursorRingY = cursorMouseY;

    document.addEventListener('mousemove', onCursorMove);
    document.addEventListener('mouseover', onCursorOver);
    document.addEventListener('mousedown', onCursorDown);
    document.addEventListener('mouseup', onCursorUp);
    document.addEventListener('mouseleave', onCursorLeave);

    if (cursorRAF) cancelAnimationFrame(cursorRAF);
    animateCursorRing();
  }

  function destroyCustomCursor() {
    if (!cursorInited) return;
    cursorInited = false;

    document.removeEventListener('mousemove', onCursorMove);
    document.removeEventListener('mouseover', onCursorOver);
    document.removeEventListener('mousedown', onCursorDown);
    document.removeEventListener('mouseup', onCursorUp);
    document.removeEventListener('mouseleave', onCursorLeave);

    if (cursorRAF) {
      cancelAnimationFrame(cursorRAF);
      cursorRAF = null;
    }

    if (cursorDotEl) {
      cursorDotEl.classList.remove('press', 'hidden');
    }
    if (cursorRingEl) {
      cursorRingEl.classList.remove('hover', 'text', 'press', 'hidden');
    }

    document.documentElement.classList.remove('custom-cursor-image');
    document.documentElement.classList.remove('custom-cursor-image-text');
    document.documentElement.classList.remove('custom-cursor-image-pointer');

    cursorVisible = false;
  }

  function onCursorMove(e) {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;

    if (cursorDotEl) {
      cursorDotEl.style.transform =
        `translate(${cursorMouseX}px, ${cursorMouseY}px) translate(-50%, -50%)`;
    }

    if (!cursorVisible) {
      cursorVisible = true;
      if (cursorDotEl) cursorDotEl.classList.remove('hidden');
      if (cursorRingEl) cursorRingEl.classList.remove('hidden');
    }
  }

  function onCursorOver(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const isText = !!t.closest(CURSOR_TEXT_SELECTOR);
    const isHover = !!t.closest(CURSOR_HOVER_SELECTOR);

    document.documentElement.classList.remove('custom-cursor-image');
    document.documentElement.classList.remove('custom-cursor-image-text');
    document.documentElement.classList.remove('custom-cursor-image-pointer');

    if (isText && settings.customCursorTextImageId) {
      document.documentElement.classList.add('custom-cursor-image-text');
    } else if (isHover && settings.customCursorPointerImageId) {
      document.documentElement.classList.add('custom-cursor-image-pointer');
    } else if (settings.customCursorImageId) {
      document.documentElement.classList.add('custom-cursor-image');
    }

    if (!cursorRingEl) return;

    if (isText) {
      cursorRingEl.classList.add('text');
      cursorRingEl.classList.remove('hover');
    } else if (isHover) {
      cursorRingEl.classList.add('hover');
      cursorRingEl.classList.remove('text');
    } else {
      cursorRingEl.classList.remove('hover', 'text');
    }
  }

  function onCursorDown() {
    if (cursorDotEl) cursorDotEl.classList.add('press');
    if (cursorRingEl) cursorRingEl.classList.add('press');
  }

  function onCursorUp() {
    if (cursorDotEl) cursorDotEl.classList.remove('press');
    if (cursorRingEl) cursorRingEl.classList.remove('press');
  }

  function onCursorLeave() {
    cursorVisible = false;
    if (cursorDotEl) cursorDotEl.classList.add('hidden');
    if (cursorRingEl) cursorRingEl.classList.add('hidden');
  }

  function animateCursorRing() {
    if (!cursorInited) return;
    cursorRingX += (cursorMouseX - cursorRingX) * 0.18;
    cursorRingY += (cursorMouseY - cursorRingY) * 0.18;
    if (cursorRingEl) {
      cursorRingEl.style.transform =
        `translate(${cursorRingX}px, ${cursorRingY}px) translate(-50%, -50%)`;
    }
    cursorRAF = requestAnimationFrame(animateCursorRing);
  }

  async function applyCursorImage() {
    // 正常
    const id = settings.customCursorImageId;
    if (!id) {
      document.documentElement.classList.remove('custom-cursor-image');
      document.documentElement.style.removeProperty('--cursor-image');
      updateCursorPreview(cursorPreviewThumb, null);
    } else {
      try {
        const item = await bgDB.getCursor(id);
        if (item && item.data) {
          document.documentElement.style.setProperty('--cursor-image', `url('${item.data}')`);
          document.documentElement.classList.add('custom-cursor-image');
          updateCursorPreview(cursorPreviewThumb, item.data);
        } else {
          document.documentElement.classList.remove('custom-cursor-image');
          document.documentElement.style.removeProperty('--cursor-image');
          updateCursorPreview(cursorPreviewThumb, null);
        }
      } catch (e) {
        console.warn('光标图片加载失败', e);
        document.documentElement.classList.remove('custom-cursor-image');
        document.documentElement.style.removeProperty('--cursor-image');
        updateCursorPreview(cursorPreviewThumb, null);
      }
    }

    // 文本
    const textId = settings.customCursorTextImageId;
    if (!textId) {
      document.documentElement.classList.remove('custom-cursor-image-text');
      document.documentElement.style.removeProperty('--cursor-text-image');
      updateCursorPreview(cursorTextPreviewThumb, null);
    } else {
      try {
        const item = await bgDB.getCursor(textId);
        if (item && item.data) {
          document.documentElement.style.setProperty('--cursor-text-image', `url('${item.data}')`);
          updateCursorPreview(cursorTextPreviewThumb, item.data);
        } else {
          document.documentElement.classList.remove('custom-cursor-image-text');
          document.documentElement.style.removeProperty('--cursor-text-image');
          updateCursorPreview(cursorTextPreviewThumb, null);
        }
      } catch (e) {
        console.warn('文本光标图片加载失败', e);
        document.documentElement.classList.remove('custom-cursor-image-text');
        document.documentElement.style.removeProperty('--cursor-text-image');
        updateCursorPreview(cursorTextPreviewThumb, null);
      }
    }

    // 悬停
    const pointerId = settings.customCursorPointerImageId;
    if (!pointerId) {
      document.documentElement.classList.remove('custom-cursor-image-pointer');
      document.documentElement.style.removeProperty('--cursor-pointer-image');
      updateCursorPreview(cursorPointerPreviewThumb, null);
    } else {
      try {
        const item = await bgDB.getCursor(pointerId);
        if (item && item.data) {
          document.documentElement.style.setProperty('--cursor-pointer-image', `url('${item.data}')`);
          updateCursorPreview(cursorPointerPreviewThumb, item.data);
        } else {
          document.documentElement.classList.remove('custom-cursor-image-pointer');
          document.documentElement.style.removeProperty('--cursor-pointer-image');
          updateCursorPreview(cursorPointerPreviewThumb, null);
        }
      } catch (e) {
        console.warn('悬停光标图片加载失败', e);
        document.documentElement.classList.remove('custom-cursor-image-pointer');
        document.documentElement.style.removeProperty('--cursor-pointer-image');
        updateCursorPreview(cursorPointerPreviewThumb, null);
      }
    }
  }

  function updateCursorPreview(el, dataUrl) {
    if (!el) return;
    if (dataUrl) {
      el.style.background = `url('${dataUrl}') center/60% no-repeat`;
      el.classList.add('has-image');
    } else {
      el.style.background = 'rgba(0, 0, 0, 0.25)';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundSize = '60%';
      el.classList.remove('has-image');
    }
  }

  function applyCustomCursorSetting() {
    if (customCursorImageRow) {
      customCursorImageRow.style.display = settings.customCursorEnabled ? '' : 'none';
    }

    if (settings.customCursorEnabled) {
      document.documentElement.classList.add('custom-cursor-on');
      initCustomCursor();
    } else {
      document.documentElement.classList.remove('custom-cursor-on');
      destroyCustomCursor();
    }
  }

  async function handleCursorImageUpload(file, type) {
    if (!file) return;

    if (file.size > MAX_CURSOR_IMAGE_SIZE) {
      await showAlert('图片过大，请选择小于 2MB 的图片', { title: '文件过大' });
      return;
    }

    const validTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      await showAlert('请选择 PNG / SVG / WebP / JPEG 格式的图片', { title: '格式不支持' });
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let currentId, settingKey, toastMsg;
      if (type === 'text') {
        currentId = settings.customCursorTextImageId;
        settingKey = 'customCursorTextImageId';
        toastMsg = '已上传文本光标';
      } else if (type === 'pointer') {
        currentId = settings.customCursorPointerImageId;
        settingKey = 'customCursorPointerImageId';
        toastMsg = '已上传悬停光标';
      } else {
        currentId = settings.customCursorImageId;
        settingKey = 'customCursorImageId';
        toastMsg = '已上传光标图片';
      }

      if (currentId) {
        try { await bgDB.deleteCursor(currentId); } catch (err) {}
      }

      const id = generateId();
      await bgDB.addCursor({
        id,
        name: file.name,
        type: file.type,
        data: dataUrl,
        createdAt: Date.now()
      });

      settings[settingKey] = id;
      saveSettingsToStorage();
      await applyCursorImage();
      showToast(toastMsg);
    } catch (err) {
      console.error(err);
      await showAlert('上传失败：' + (err.message || '未知错误'));
    }
  }

  // ==================== 笔记内嵌图片 ====================
  async function insertNoteImage(file) {
    if (!file) return;
    if (file.size > MAX_NOTE_IMAGE_SIZE) {
      await showAlert('图片过大，请选择小于 10MB 的图片', { title: '文件过大' });
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const id = generateId();
      await bgDB.addNoteImage({
        id,
        name: file.name || 'image',
        type: file.type,
        data: dataUrl,
        createdAt: Date.now(),
        owner: currentUser
      });

      const textarea = noteContentInput;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      let prefix = '';
      if (start > 0 && value[start - 1] !== '\n') prefix = '\n';

      const insertion = `${prefix}![图片](${id})\n`;
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      textarea.value = newValue;

      const newCursor = start + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      showToast('已插入图片');
    } catch (err) {
      console.error(err);
      await showAlert('插入图片失败：' + (err.message || '未知错误'));
    }
  }

  async function loadNoteImages(container) {
    const imgs = container.querySelectorAll('.note-image[data-img-id]');
    const jobs = [];
    imgs.forEach(img => {
      const id = img.getAttribute('data-img-id');
      if (!id) return;
      jobs.push((async () => {
        try {
          const item = await bgDB.getNoteImage(id);
          if (item && item.data) {
            img.src = item.data;
            img.classList.remove('loading');
          } else {
            img.alt = '图片丢失';
            img.classList.remove('loading');
          }
        } catch (e) {
          console.warn('笔记图片加载失败', id, e);
          img.classList.remove('loading');
        }
      })());
    });
    await Promise.all(jobs);
  }

  // ==================== 笔记图片清理（彻底删除笔记时用） ====================
  function extractNoteImageIds(content) {
    const ids = [];
    if (!content) return ids;
    const re = /!\[[^\]]*\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const id = m[1];
      if (id && !/^(https?:\/\/|data:|#|\/)/i.test(id)) {
        ids.push(id);
      }
    }
    return ids;
  }

  async function cleanupNoteImages(content) {
    const ids = extractNoteImageIds(content);
    if (ids.length === 0) return;
    for (const id of ids) {
      try {
        const item = await bgDB.getNoteImage(id);
        if (item && item.owner === currentUser) {
          await bgDB.deleteNoteImage(id);
        }
      } catch (e) {
        console.warn('清理笔记图片失败', id, e);
      }
    }
  }

  // ==================== 唯一的动态壁纸 video ====================
  async function loadWallpaperVideo(id) {
    if (!id) {
      if (mainVideoObjectUrl) {
        URL.revokeObjectURL(mainVideoObjectUrl);
        mainVideoObjectUrl = null;
      }
      mainWallpaperVideo.classList.remove('ready');
      mainWallpaperVideo.removeAttribute('src');
      mainWallpaperVideo.load();
      mainWallpaperVideo.dataset.loadedId = '';
      return;
    }

    if (String(id) === mainWallpaperVideo.dataset.loadedId && mainWallpaperVideo.src) {
      if (mainWallpaperVideo.ended) {
        mainWallpaperVideo.currentTime = 0;
      }
      mainWallpaperVideo.play().catch(() => {});
      mainWallpaperVideo.classList.add('ready');
      return;
    }

    if (mainVideoObjectUrl) {
      URL.revokeObjectURL(mainVideoObjectUrl);
      mainVideoObjectUrl = null;
    }
    mainWallpaperVideo.classList.remove('ready');
    mainWallpaperVideo.removeAttribute('src');
    mainWallpaperVideo.load();
    mainWallpaperVideo.dataset.loadedId = '';

    try {
      const item = await bgDB.getWallpaper(id);
      if (!item || !item.data) return;

      mainVideoObjectUrl = URL.createObjectURL(item.data);
      mainWallpaperVideo.src = mainVideoObjectUrl;
      mainWallpaperVideo.load();

      const onLoaded = () => {
        mainWallpaperVideo.removeEventListener('loadeddata', onLoaded);
        mainWallpaperVideo.play().catch(() => {});
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mainWallpaperVideo.classList.add('ready');
          });
        });
      };

      if (mainWallpaperVideo.readyState >= 2) {
        onLoaded();
      } else {
        mainWallpaperVideo.addEventListener('loadeddata', onLoaded, { once: true });
      }

      mainWallpaperVideo.dataset.loadedId = String(id);
    } catch (e) {
      console.warn('动态壁纸加载失败', e);
    }
  }

  // ==================== 控制 bgLayer 与 video 的可见性 ====================
  function syncWallpaperVisibility() {
    const inMainApp = !!currentUser && appContainer.classList.contains('visible');
    const videoReady = mainWallpaperVideo.classList.contains('ready');

    let showVideo;
    if (!inMainApp) {
      showVideo = videoReady;
    } else {
      showVideo = settings.mainWallpaperEnabled && videoReady;
    }

    bgLayer.style.opacity = showVideo ? '0' : '1';
  }

  function watchVideoReady() {
    const observer = new MutationObserver(() => {
      syncWallpaperVisibility();
    });
    observer.observe(mainWallpaperVideo, { attributes: true, attributeFilter: ['class'] });
    return observer;
  }

  // ==================== 自定义对话框 ====================
  function openDialog({ title = '提示', message = '', buttons = [], customHTML = '' }) {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogCustom.innerHTML = customHTML;
      dialogButtons.innerHTML = '';

      buttons.forEach((btn) => {
        const btnEl = document.createElement('button');
        btnEl.className = 'dialog-btn ' + (btn.type || 'cancel');
        if (btn.danger) btnEl.classList.add('danger');
        btnEl.textContent = btn.text;
        btnEl.addEventListener('click', () => {
          try {
            if (btn.onClick) btn.onClick();
          } catch (e) {
            console.error('dialog button onClick error', e);
          } finally {
            closeDialog();
            resolve(btn.value);
          }
        });
        dialogButtons.appendChild(btnEl);
      });

      dialogOverlay.classList.add('show');
      bindRippleToAll();
    });
  }

  function closeDialog() {
    dialogOverlay.classList.remove('show');
  }

  function showConfirm(message, { title = '确认', confirmText = '确定', cancelText = '取消', danger = false } = {}) {
    return openDialog({
      title,
      message,
      buttons: [
        { text: cancelText, type: 'cancel', value: false },
        { text: confirmText, type: 'confirm', value: true, danger }
      ]
    });
  }

  function showAlert(message, { title = '提示', confirmText = '知道了' } = {}) {
    return openDialog({
      title,
      message,
      buttons: [
        { text: confirmText, type: 'confirm', value: true }
      ]
    });
  }

  function showRecoveryKeyDialog(recoveryKey, titleText, confirmLabel) {
    titleText = titleText || '请保存你的恢复密钥';
    confirmLabel = confirmLabel || '我已保存';
    const COPY_ICON = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    return new Promise((resolve) => {
      const html = `
        <div class="recovery-key-box">
          <div class="recovery-key-text" id="recoveryKeyDisplay">${escapeHtml(recoveryKey)}</div>
          <button class="dialog-copy-btn" id="recoveryCopyBtn">
            ${COPY_ICON} 复制
          </button>
        </div>
        <div style="font-size:0.78rem; color:rgba(255,255,255,0.55); line-height:1.6; margin-bottom:8px;">
          请务必保存好这串密钥。<br>
          忘记密码时，只能通过它来重置密码。
        </div>
      `;
      openDialog({
        title: titleText,
        message: '',
        customHTML: html,
        buttons: [
          { text: confirmLabel, type: 'confirm', value: true }
        ]
      }).then(resolve);

      setTimeout(() => {
        const copyBtn = document.getElementById('recoveryCopyBtn');
        const keyEl = document.getElementById('recoveryKeyDisplay');
        if (copyBtn && keyEl) {
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(keyEl.textContent);
            } catch (e) {
              const ta = document.createElement('textarea');
              ta.value = keyEl.textContent;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '✓ 已复制';
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = COPY_ICON + ' 复制';
            }, 1500);
          });
        }
      }, 50);
    });
  }

  function showForgotPasswordDialog() {
    return new Promise((resolve) => {
      const prefilledUsername = loginUsername.value.trim();
      const html = `
        <div class="dialog-field">
          <label>用户名</label>
          <input type="text" id="fpUsername" placeholder="请输入用户名" maxlength="20" value="${escapeHtml(prefilledUsername)}">
        </div>
        <div class="dialog-field">
          <label>恢复密钥</label>
          <input type="text" id="fpRecoveryKey" placeholder="请输入恢复密钥，如 A7K-9F2-MXP-4WT" autocomplete="off" style="text-transform:uppercase;">
        </div>
        <div class="dialog-field">
          <label>新密码</label>
          <input type="password" id="fpNewPassword" placeholder="请输入新密码" maxlength="50">
        </div>
      `;

      openDialog({
        title: '重置密码',
        message: '',
        customHTML: html,
        buttons: [
          { text: '取消', type: 'cancel', value: null },
          { text: '确认重置', type: 'confirm', value: 'submit' }
        ]
      }).then(async (val) => {
        if (val !== 'submit') { resolve(false); return; }
        const u = document.getElementById('fpUsername').value.trim();
        const k = document.getElementById('fpRecoveryKey').value.trim().toUpperCase();
        const p = document.getElementById('fpNewPassword').value;

        if (!u) { await showAlert('请输入用户名'); resolve(false); return; }
        if (!k) { await showAlert('请输入恢复密钥'); resolve(false); return; }
        if (!p) { await showAlert('请输入新密码'); resolve(false); return; }

        const users = getUsers();
        if (!users[u]) {
          await showAlert('用户不存在', { title: '重置失败' });
          resolve(false);
          return;
        }
        if (!users[u].recoveryKey || users[u].recoveryKey !== k) {
          await showAlert('恢复密钥不正确', { title: '重置失败' });
          resolve(false);
          return;
        }

        users[u].password = hashPassword(p);
        saveUsers(users);

        await showAlert('密码已重置，请重新登录', { title: '重置成功' });

        loginUsername.value = u;
        loginPassword.value = p;
        loginRemember.checked = false;
        try { localStorage.removeItem(REMEMBER_KEY); } catch (e) {}

        resolve(true);
      });

      setTimeout(() => {
        const uInput = document.getElementById('fpUsername');
        if (uInput && !uInput.value) uInput.focus();
        else {
          const kInput = document.getElementById('fpRecoveryKey');
          if (kInput) kInput.focus();
        }
      }, 50);
    });
  }

  function showChangePasswordDialog() {
    return new Promise((resolve) => {
      const html = `
        <div class="dialog-field">
          <label>旧密码</label>
          <input type="password" id="cpOldPassword" placeholder="请输入当前密码" maxlength="50">
        </div>
        <div class="dialog-field">
          <label>新密码</label>
          <input type="password" id="cpNewPassword" placeholder="请输入新密码" maxlength="50">
        </div>
        <div class="dialog-field">
          <label>确认新密码</label>
          <input type="password" id="cpConfirmPassword" placeholder="请再次输入新密码" maxlength="50">
        </div>
      `;
      openDialog({
        title: '修改密码',
        message: '',
        customHTML: html,
        buttons: [
          { text: '取消', type: 'cancel', value: null },
          { text: '确认修改', type: 'confirm', value: 'submit' }
        ]
      }).then(async (val) => {
        if (val !== 'submit') { resolve(false); return; }
        const oldPwd = document.getElementById('cpOldPassword').value;
        const newPwd = document.getElementById('cpNewPassword').value;
        const confirmPwd = document.getElementById('cpConfirmPassword').value;

        if (!oldPwd) { await showAlert('请输入旧密码'); resolve(false); return; }
        if (!newPwd) { await showAlert('请输入新密码'); resolve(false); return; }
        if (newPwd.length < 1) { await showAlert('新密码不能为空'); resolve(false); return; }
        if (newPwd !== confirmPwd) { await showAlert('两次输入的新密码不一致'); resolve(false); return; }

        const users = getUsers();
        if (!users[currentUser]) {
          await showAlert('用户不存在', { title: '修改失败' });
          resolve(false);
          return;
        }
        if (users[currentUser].password !== hashPassword(oldPwd)) {
          await showAlert('旧密码错误', { title: '修改失败' });
          resolve(false);
          return;
        }
        users[currentUser].password = hashPassword(newPwd);
        saveUsers(users);
        await showAlert('密码已修改', { title: '修改成功' });
        resolve(true);
      });

      setTimeout(() => {
        const el = document.getElementById('cpOldPassword');
        if (el) el.focus();
      }, 50);
    });
  }

  function showDeleteAccountDialog() {
    return new Promise((resolve) => {
      const html = `
        <div class="dialog-field">
          <label>请输入你的用户名 <strong style="color:#ff8a9a;">${escapeHtml(currentUser)}</strong> 以确认注销</label>
          <input type="text" id="daConfirmUsername" placeholder="输入用户名" maxlength="20" autocomplete="off">
        </div>
      `;
      openDialog({
        title: '确认注销账号',
        message: '',
        customHTML: html,
        buttons: [
          { text: '取消', type: 'cancel', value: null },
          { text: '确认注销', type: 'confirm', value: 'submit', danger: true }
        ]
      }).then(async (val) => {
        if (val !== 'submit') { resolve(false); return; }
        const input = document.getElementById('daConfirmUsername').value.trim();
        if (input !== currentUser) {
          await showAlert('用户名不正确', { title: '验证失败' });
          resolve(false);
          return;
        }
        resolve(true);
      });

      setTimeout(() => {
        const input = document.getElementById('daConfirmUsername');
        if (input) input.focus();
      }, 50);
    });
  }

  // ==================== 笔记锁密码相关 ====================
  function showSetNoteLockPasswordDialog() {
    return new Promise((resolve) => {
      const users = getUsers();
      const existing = users[currentUser] && users[currentUser].noteLockPassword;
      const hasExisting = !!existing;

      const html = `
        ${hasExisting ? `
        <div class="dialog-field">
          <label>当前笔记锁密码</label>
          <input type="password" id="nlpOldPassword" placeholder="请输入当前笔记锁密码" maxlength="50">
        </div>` : ''}
        <div class="dialog-field">
          <label>新笔记锁密码</label>
          <input type="password" id="nlpNewPassword" placeholder="请输入新笔记锁密码" maxlength="50">
        </div>
        <div class="dialog-field">
          <label>确认新笔记锁密码</label>
          <input type="password" id="nlpConfirmPassword" placeholder="请再次输入新笔记锁密码" maxlength="50">
        </div>
      `;

      openDialog({
        title: hasExisting ? '修改笔记锁密码' : '设置笔记锁密码',
        message: '',
        customHTML: html,
        buttons: [
          { text: '取消', type: 'cancel', value: null },
          { text: '确认', type: 'confirm', value: 'submit' }
        ]
      }).then(async (val) => {
        if (val !== 'submit') { resolve(false); return; }

        if (hasExisting) {
          const oldPwd = document.getElementById('nlpOldPassword').value;
          if (!oldPwd) { await showAlert('请输入当前笔记锁密码'); resolve(false); return; }
          if (oldPwd !== existing) {
            await showAlert('当前笔记锁密码不正确', { title: '修改失败' });
            resolve(false);
            return;
          }
        }

        const newPwd = document.getElementById('nlpNewPassword').value;
        const confirmPwd = document.getElementById('nlpConfirmPassword').value;

        if (!newPwd) { await showAlert('请输入新笔记锁密码'); resolve(false); return; }
        if (newPwd !== confirmPwd) { await showAlert('两次输入的新笔记锁密码不一致'); resolve(false); return; }

        const users2 = getUsers();
        if (!users2[currentUser]) { resolve(false); return; }
        users2[currentUser].noteLockPassword = newPwd;
        saveUsers(users2);

        updateNoteLockStatusDisplay();
        await showAlert(hasExisting ? '笔记锁密码已修改' : '笔记锁密码已设置', { title: '成功' });
        resolve(true);
      });

      setTimeout(() => {
        const first = document.getElementById('nlpOldPassword') || document.getElementById('nlpNewPassword');
        if (first) first.focus();
      }, 50);
    });
  }

  function showViewNoteLockPasswordDialog() {
    return new Promise((resolve) => {
      const users = getUsers();
      const userInfo = users[currentUser];
      if (!userInfo) { resolve(false); return; }

      if (!userInfo.noteLockPassword) {
        showAlert('尚未设置笔记锁密码', { title: '未设置' });
        resolve(false);
        return;
      }

      const html = `
        <div class="dialog-field">
          <label>请输入登录密码验证身份</label>
          <input type="password" id="vnpLoginPassword" placeholder="登录密码" maxlength="50">
        </div>
      `;

      openDialog({
        title: '查看笔记锁密码',
        message: '',
        customHTML: html,
        buttons: [
          { text: '取消', type: 'cancel', value: null },
          { text: '验证', type: 'confirm', value: 'verify' }
        ]
      }).then(async (val) => {
        if (val !== 'verify') { resolve(false); return; }

        const inputPwd = document.getElementById('vnpLoginPassword');
        if (!inputPwd) { resolve(false); return; }
        const loginPwd = inputPwd.value;

        const users2 = getUsers();
        const info2 = users2[currentUser];
        if (!info2) { resolve(false); return; }

        if (hashPassword(loginPwd) !== info2.password) {
          await showAlert('登录密码不正确', { title: '验证失败' });
          resolve(false);
          return;
        }

        await showNoteLockPasswordPanel(info2.noteLockPassword);
        resolve(true);
      });

      setTimeout(() => {
        const el = document.getElementById('vnpLoginPassword');
        if (el) el.focus();
      }, 50);
    });
  }

  function showNoteLockPasswordPanel(noteLockPassword) {
    const COPY_ICON = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    return new Promise((resolve) => {
      const html = `
        <div class="recovery-key-box">
          <div class="recovery-key-text" id="noteLockPasswordDisplay2">${escapeHtml(noteLockPassword)}</div>
          <button class="dialog-copy-btn" id="noteLockCopyBtn">
            ${COPY_ICON} 复制
          </button>
        </div>
        <div style="font-size:0.78rem; color:rgba(255,255,255,0.55); line-height:1.6; margin-bottom:8px;">
          用于解锁被锁定的笔记。<br>
          请勿泄露给他人。
        </div>
      `;
      openDialog({
        title: '你的笔记锁密码',
        message: '',
        customHTML: html,
        buttons: [
          { text: '关闭', type: 'confirm', value: true }
        ]
      }).then(resolve);

      setTimeout(() => {
        const copyBtn = document.getElementById('noteLockCopyBtn');
        const pwdEl = document.getElementById('noteLockPasswordDisplay2');
        if (copyBtn && pwdEl) {
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(pwdEl.textContent);
            } catch (e) {
              const ta = document.createElement('textarea');
              ta.value = pwdEl.textContent;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '✓ 已复制';
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = COPY_ICON + ' 复制';
            }, 1500);
          });
        }
      }, 50);
    });
  }

  function updateNoteLockStatusDisplay() {
    if (!noteLockStatus) return;
    if (!currentUser) {
      noteLockStatus.textContent = '未设置';
      noteLockStatus.classList.remove('set');
      if (noteLockPasswordDisplay) noteLockPasswordDisplay.textContent = '••••••';
      return;
    }
    const users = getUsers();
    const info = users[currentUser];
    if (info && info.noteLockPassword) {
      noteLockStatus.textContent = '已设置';
      noteLockStatus.classList.add('set');
    } else {
      noteLockStatus.textContent = '未设置';
      noteLockStatus.classList.remove('set');
    }
    if (noteLockPasswordDisplay) {
      noteLockPasswordDisplay.textContent = '••••••';
    }
  }

  // ==================== 波纹效果 ====================
  function attachRipple(el) {
    el.addEventListener('click', function(e) {
      if (!settings.animationEnabled) return;
      const existing = this.querySelectorAll('.ripple-wave');
      if (existing.length > 3) return;

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e.clientX || (rect.left + rect.width / 2)) - rect.left - size / 2;
      const y = (e.clientY || (rect.top + rect.height / 2)) - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-wave';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      this.appendChild(ripple);
      setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    });
  }

  function bindRippleToAll() {
    const selector = '.top-btn, .new-note-btn, .footer-btn, .btn-primary, .btn-secondary, .btn-danger, .settings-header .close-btn, .nav-item, .gallery-del, .dialog-btn, .login-btn, .login-switch-btn, .login-wallpaper-btn, .wallpaper-del, .wallpaper-add-btn, .dialog-copy-btn, .login-forgot-btn, .crop-btn, .picker-header .close-btn, .picker-del, .lock-unlock-btn, .shortcuts-header .close-btn, .cursor-panel-header .close-btn';
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.rippleBound) {
        attachRipple(el);
        el.dataset.rippleBound = '1';
      }
    });
  }

  // ==================== 快捷键冲突检测 ====================
  function findShortcutConflict(action, shortcutStr) {
    for (const key in settings.shortcuts) {
      if (key === action) continue;
      if (settings.shortcuts[key] === shortcutStr) return key;
    }
    return null;
  }

  // ==================== 快捷键一览弹窗 ====================
  const SHORTCUT_LABELS = {
    toggleMode: '切换编辑/预览模式',
    toggleSidebar: '切换侧边栏',
    newNote: '新建笔记',
    deleteNote: '删除当前笔记',
    toggleDark: '切换深色模式',
    openSettings: '打开设置',
    export: '导出数据',
    lock: '锁定/解锁'
  };

  const CATEGORY_LABELS = {
    work: '工作',
    fun: '娱乐',
    other: '其他'
  };

  function renderShortcutsList() {
    if (!shortcutsList) return;
    shortcutsList.innerHTML = '';

    for (const key in SHORTCUT_LABELS) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'shortcut-name';
      nameEl.textContent = SHORTCUT_LABELS[key];

      const keyEl = document.createElement('span');
      keyEl.className = 'shortcut-key';
      keyEl.textContent = settings.shortcuts[key] || '—';

      row.appendChild(nameEl);
      row.appendChild(keyEl);
      shortcutsList.appendChild(row);
    }
  }

  function openShortcuts() {
    renderShortcutsList();
    shortcutsOverlay.classList.add('show');
    bindRippleToAll();
  }

  function closeShortcuts() {
    shortcutsOverlay.classList.remove('show');
  }

  // ==================== 存储桥接 ====================
  function saveNotesToStorage() {
    if (!currentUser) return;
    window.DB.saveNotes(currentUser, notes);
  }

  function saveSettingsToStorage() {
    if (!currentUser) return;
    window.DB.saveSettings(currentUser, settings);
  }

  function loadNotesFromStorage() {
    if (!currentUser) return;
    const stored = window.DB.loadNotes(currentUser);
    if (stored) {
      notes = stored;
      notes.forEach(n => {
        if (n.preview === undefined) n.preview = false;
        if (n.locked === undefined) n.locked = false;
        if (n.pinned === undefined) n.pinned = false;
        if (n.category === undefined) n.category = 'other';
        if (n.deleted === undefined) n.deleted = false;
      });
      sortNotes();
      if (notes.length > 0) {
        if (!activeNoteId || !notes.some(n => n.id === activeNoteId)) {
          activeNoteId = notes[0].id;
        }
      } else {
        activeNoteId = null;
      }
    } else {
      const now = Date.now();
      notes = [
        {
          id: generateId(),
          title: '欢迎使用灵羽笔记',
          content: '# 欢迎使用灵羽笔记\n\n这是一个完全在浏览器中运行的笔记软件。\n\n## 主要功能\n\n- **自动保存**：所有更改都会保存到本地\n- *Markdown 语法*：支持标题、粗体、斜体、删除线、链接\n- ~~待办~~：预览模式下点击切换\n\n## 试试看\n\n1. 点击「新建」创建笔记\n2. 输入 **粗体** 或 *斜体* 文字\n3. 按 Tab 呼出 Markdown 菜单\n4. 按 E 切换编辑/预览模式\n\n[访问 GitHub](https://github.com) 了解更多',
          createdAt: now - 3600000 * 5,
          updatedAt: now - 3600000 * 2,
          preview: false,
          locked: false,
          pinned: false,
        },
        {
          id: generateId(),
          title: '今日待办',
          content: '- [ ] 买牛奶\n- [ ] 回复邮件\n- [x] 下午4点会议\n- [ ] 健身30分钟',
          createdAt: now - 3600000 * 24,
          updatedAt: now - 3600000 * 23,
          preview: false,
          locked: false,
          pinned: false,
        }
      ];
      sortNotes();
      activeNoteId = notes[0].id;
      saveNotesToStorage();
    }
  }

  function loadSettingsFromStorage() {
    if (!currentUser) {
      settings = window.DB.defaultSettings();
      return;
    }
    settings = window.DB.loadSettings(currentUser);
  }

  function sortNotes() {
    const compareBase = (a, b) => {
      if (settings.sortBy === 'updatedAt') return b.updatedAt - a.updatedAt;
      if (settings.sortBy === 'createdAt') return b.createdAt - a.createdAt;
      if (settings.sortBy === 'title') return (a.title || '').localeCompare(b.title || '', 'zh-CN');
      return 0;
    };
    notes.sort((a, b) => {
      const pa = a.pinned ? 1 : 0;
      const pb = b.pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return compareBase(a, b);
    });
  }

  // ==================== 壁纸 owner 过滤 ====================
    function filterWallpapersByOwner(items) {
    if (!currentUser) {
      // 未登录（登录界面）：显示所有壁纸
      return items.slice();
    }
    return items.filter(it => !it.owner || it.owner === currentUser);
  }

  // ==================== 存储用量 ====================
  async function updateStorageUsage() {
    usageLocal.textContent = '计算中...';
    usageIdb.textContent = '计算中...';

    let localBytes = 0;
    try {
      for (const k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
          const v = localStorage.getItem(k);
          if (v) localBytes += (v.length + k.length) * 2;
        }
      }
    } catch (e) {}

    usageLocal.textContent = formatBytes(localBytes);

    try {
      const bgs = await bgDB.getAll();
      const wallpapers = await bgDB.getAllWallpapers();
      const noteImages = await bgDB.getAllNoteImages();
      let idbBytes = 0;
      let bgCount = 0, wpCount = 0, niCount = 0;
      for (const item of bgs) {
        if (item.owner !== currentUser) continue;
        bgCount++;
        if (typeof item.data === 'string') idbBytes += item.data.length * 2;
        else if (item.data && item.data.size) idbBytes += item.data.size;
        if (item.thumbnail) idbBytes += item.thumbnail.length * 2;
      }
      const userWallpapers = filterWallpapersByOwner(wallpapers);
      for (const item of userWallpapers) {
        wpCount++;
        if (item.data && item.data.size) idbBytes += item.data.size;
        if (item.thumbnail) idbBytes += item.thumbnail.length * 2;
      }
      for (const item of noteImages) {
        if (item.owner !== currentUser) continue;
        niCount++;
        if (typeof item.data === 'string') idbBytes += item.data.length * 2;
      }
      usageIdb.textContent = `${formatBytes(idbBytes)}（背景图 ${bgCount} + 壁纸 ${wpCount} + 笔记图 ${niCount}）`;
    } catch (e) {
      usageIdb.textContent = '计算失败';
    }
  }

  // ==================== 背景图片预览 & 切换 ====================
  async function updateBgPreview() {
    if (!currentUser) return;
    const id = settings.currentBgId;
    if (!id) {
      bgPreview.removeAttribute('src');
      bgPreviewWrapper.classList.add('empty');
      bgPreviewWrapper.setAttribute('data-empty-text', '未设置背景');
      return;
    }
    const item = await bgDB.get(id);
    if (!item || !item.data || item.owner !== currentUser) {
      bgPreview.removeAttribute('src');
      bgPreviewWrapper.classList.add('empty');
      bgPreviewWrapper.setAttribute('data-empty-text', '未设置背景');
      return;
    }
    bgPreviewWrapper.classList.remove('empty');
    bgPreviewWrapper.removeAttribute('data-empty-text');
    bgPreview.src = item.thumbnail || item.data;
  }

  // ==================== 动态壁纸预览 & 切换 ====================
  async function updateWallpaperPreview() {
    if (!currentUser) return;
    if (!currentWallpaperId) {
      wallpaperPreview.removeAttribute('src');
      wallpaperPreviewWrapper.classList.add('empty');
      wallpaperPreviewWrapper.setAttribute('data-empty-text', '未设置动态壁纸');
      return;
    }
    const item = await bgDB.getWallpaper(currentWallpaperId);
    if (!item || !item.thumbnail || (item.owner && item.owner !== currentUser)) {
      wallpaperPreview.removeAttribute('src');
      wallpaperPreviewWrapper.classList.add('empty');
      wallpaperPreviewWrapper.setAttribute('data-empty-text', '未设置动态壁纸');
      return;
    }
    wallpaperPreviewWrapper.classList.remove('empty');
    wallpaperPreviewWrapper.removeAttribute('data-empty-text');
    wallpaperPreview.src = item.thumbnail;
  }

  // ==================== 选择器弹窗 ====================
  function openPicker(mode) {
    pickerMode = mode;
    pickerOverlay.classList.add('show');
    pickerTitle.textContent = mode === 'bg' ? '切换背景图片' : '切换动态壁纸';
    pickerHint.textContent = mode === 'bg'
      ? '点击任意背景即可应用'
      : '点击任意壁纸即可应用';
    renderPicker();
  }

  function closePicker() {
    pickerOverlay.classList.remove('show');
  }

  async function renderPicker() {
    pickerGrid.innerHTML = '';

    if (pickerMode === 'bg') {
      const allItems = await bgDB.getAll();
      const items = allItems
        .filter(item => item.owner === currentUser)
        .sort((a, b) => a.createdAt - b.createdAt);

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'picker-empty';
        empty.innerHTML = '还没有背景图片<br>请先在设置页「上传背景图片」中添加';
        pickerGrid.appendChild(empty);
        return;
      }

      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'gallery-item' + (item.id === settings.currentBgId ? ' current' : '');
        el.dataset.id = item.id;
        el.title = '点击应用为当前背景';

        const img = document.createElement('img');
        img.src = item.thumbnail || item.data;
        img.alt = '';
        el.appendChild(img);

        if (item.id === settings.currentBgId) {
          const badge = document.createElement('span');
          badge.className = 'gallery-current-badge';
          badge.textContent = '当前';
          el.appendChild(badge);
        }

        const del = document.createElement('button');
        del.className = 'gallery-del';
        del.innerHTML = '✕';
        del.title = '删除这张背景';
        del.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const ok = await showConfirm('确定删除这张背景图吗？', { confirmText: '删除', danger: true });
          if (!ok) return;
          await bgDB.delete(item.id);
          if (settings.currentBgId === item.id) {
            const rest = items.filter(i => i.id !== item.id);
            settings.currentBgId = rest.length > 0 ? rest[0].id : null;
            saveSettingsToStorage();
            await applyBackground();
            await updateBgPreview();
          }
          await renderPicker();
          showToast('已删除背景');
        });
        el.appendChild(del);

        el.addEventListener('click', async () => {
          if (settings.currentBgId === item.id) {
            closePicker();
            return;
          }
          settings.currentBgId = item.id;
          saveSettingsToStorage();
          await applyBackground();
          await updateBgPreview();
          closePicker();
          showToast('已切换背景');
        });

        pickerGrid.appendChild(el);
      });
    } else {
      const allItems = filterWallpapersByOwner(await bgDB.getAllWallpapers());
      const items = allItems.slice().sort((a, b) => a.createdAt - b.createdAt);

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'picker-empty';
        empty.innerHTML = '还没有动态壁纸<br>请先在设置页「上传动态壁纸」中添加';
        pickerGrid.appendChild(empty);
        return;
      }

      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'wallpaper-item' + (item.id === currentWallpaperId ? ' current' : '');
        el.dataset.id = item.id;
        el.title = '点击应用为当前壁纸';

        const img = document.createElement('img');
        img.src = item.thumbnail;
        img.alt = '';
        el.appendChild(img);

        if (item.id === currentWallpaperId) {
          const badge = document.createElement('span');
          badge.className = 'wallpaper-current-badge';
          badge.textContent = '当前';
          el.appendChild(badge);
        }

        const nameEl = document.createElement('div');
        nameEl.className = 'wallpaper-name';
        nameEl.textContent = item.name || '未命名';
        el.appendChild(nameEl);

        const del = document.createElement('button');
        del.className = 'wallpaper-del';
        del.innerHTML = '✕';
        del.title = '删除这段视频';
                del.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const ok = await showConfirm('确定删除这段视频吗？', { confirmText: '删除', danger: true });
          if (!ok) return;
          await bgDB.deleteWallpaper(item.id);
          if (currentWallpaperId === item.id) {
            const rest = items.filter(i => i.id !== item.id);
            if (rest.length > 0) {
              await setCurrentWallpaper(rest[0].id);
            } else {
              await setCurrentWallpaper(null);
            }
          }
          await renderPicker();
          showToast('已删除动态壁纸');
        });
        el.appendChild(del);

        el.addEventListener('click', async () => {
          if (currentWallpaperId === item.id) {
            closePicker();
            return;
          }
          await setCurrentWallpaper(item.id);
          closePicker();
        });

        pickerGrid.appendChild(el);
      });
    }

    bindRippleToAll();
  }

  // ==================== 背景应用 ====================
  async function applyBackground() {
    if (!settings.currentBgId) {
      bgLayer.style.backgroundImage = `url('https://api.dujin.org/bing/1920.php')`;
      return;
    }
    const item = await bgDB.get(settings.currentBgId);
    if (item && item.data && item.owner === currentUser) {
      bgLayer.style.backgroundImage = `url('${item.data}')`;
    } else {
      bgLayer.style.backgroundImage = `url('https://api.dujin.org/bing/1920.php')`;
    }
  }

  // ==================== 切换当前壁纸 ====================
  async function setCurrentWallpaper(id) {
    currentWallpaperId = id;
    try {
      if (id) localStorage.setItem(CURRENT_WALLPAPER_KEY, id);
      else localStorage.removeItem(CURRENT_WALLPAPER_KEY);
    } catch (e) {}

    await loadWallpaperVideo(id);
    syncWallpaperVisibility();
    await updateWallpaperPreview();
    if (id) showToast('已切换动态壁纸');
  }

  async function importWallpaperFile(file) {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) {
      await showAlert(`视频过大，请选择小于 100MB 的文件`, { title: '文件过大' });
      return;
    }
    const validTypes = ['video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.mp4') && !file.name.toLowerCase().endsWith('.webm')) {
      await showAlert('请选择 MP4 或 WebM 格式的视频', { title: '格式不支持' });
      return;
    }

    try {
      const thumbnail = await generateVideoThumbnail(file);
      const item = {
        id: generateId(),
        name: file.name.replace(/\.[^.]+$/, ''),
        type: file.type || 'video/mp4',
        size: file.size,
        thumbnail: thumbnail,
        data: file,
        createdAt: Date.now(),
        owner: currentUser
      };
      await bgDB.addWallpaper(item);

      await setCurrentWallpaper(item.id);
      await renderWallpaperGrids();
      showToast('已上传动态壁纸');
    } catch (e) {
      console.error('导入视频失败', e);
      await showAlert('导入失败：' + (e.message || '未知错误'));
    }
  }

  async function renderWallpaperGrids() {
    if (wallpaperGrid) {
      const allItems = filterWallpapersByOwner(await bgDB.getAllWallpapers());
      allItems.sort((a, b) => a.createdAt - b.createdAt);
      renderWallpaperInto(wallpaperGrid, allItems);
    }
  }

  function renderWallpaperInto(grid, items) {
    if (!grid) return;
    grid.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'wallpaper-empty';
      empty.innerHTML = '还没有动态壁纸<br>点击「选择视频」添加一个吧';
      grid.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'wallpaper-item' + (item.id === currentWallpaperId ? ' current' : '');
      el.dataset.id = item.id;
      el.title = '点击切换为当前壁纸';

      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = '';
      el.appendChild(img);

      if (item.id === currentWallpaperId) {
        const badge = document.createElement('span');
        badge.className = 'wallpaper-current-badge';
        badge.textContent = '当前';
        el.appendChild(badge);
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'wallpaper-name';
      nameEl.textContent = item.name || '未命名';
      el.appendChild(nameEl);

      const del = document.createElement('button');
      del.className = 'wallpaper-del';
      del.innerHTML = '✕';
      del.title = '删除这段视频';
            del.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const ok = await showConfirm('确定删除这段视频吗？', { confirmText: '删除', danger: true });
        if (!ok) return;
        await bgDB.deleteWallpaper(item.id);
        if (currentWallpaperId === item.id) {
          const rest = items.filter(i => i.id !== item.id);
          if (rest.length > 0) {
            await setCurrentWallpaper(rest[0].id);
          } else {
            await setCurrentWallpaper(null);
          }
        }
        await renderWallpaperGrids();
      });
      el.appendChild(del);

      el.addEventListener('click', async () => {
        if (currentWallpaperId === item.id) return;
        await setCurrentWallpaper(item.id);
        await renderWallpaperGrids();
      });

      grid.appendChild(el);
    });

    bindRippleToAll();
  }

  // ==================== 应用设置 ====================
  async function applySettings() {
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
      darkModeSwitch.classList.add('on');
    } else {
      document.body.classList.remove('dark-mode');
      darkModeSwitch.classList.remove('on');
    }

    let noteSize = '1.05rem', titleSize = '2rem', listSize = '0.95rem';
    if (settings.fontSize === 'small') {
      noteSize = '0.9rem'; titleSize = '1.7rem'; listSize = '0.85rem';
    } else if (settings.fontSize === 'large') {
      noteSize = '1.2rem'; titleSize = '2.4rem'; listSize = '1.05rem';
    }
    document.documentElement.style.setProperty('--note-font-size', noteSize);
    document.documentElement.style.setProperty('--title-font-size', titleSize);
    document.documentElement.style.setProperty('--list-font-size', listSize);
    fontSizeSelect.value = settings.fontSize;

    const glassBlurPx = settings.blur / 100 * 30;
    document.documentElement.style.setProperty('--glass-blur', glassBlurPx + 'px');

    blurSlider.value = settings.blur;
    updateSliderFill(blurSlider);

    for (const k in shortcutEls) {
      if (shortcutEls[k]) shortcutEls[k].textContent = settings.shortcuts[k] || '';
    }

    defaultPreviewSelect.value = settings.defaultPreview ? 'preview' : 'edit';
    sidebarDefaultSelect.value = settings.sidebarDefaultHidden ? 'hide' : 'show';
    autoSaveSelect.value = String(settings.autoSaveInterval);
    if (trashRetentionSelect) {
      trashRetentionSelect.value = String(settings.trashRetentionDays || 30);
    }

    if (settings.animationEnabled) animationSwitch.classList.add('on');
    else animationSwitch.classList.remove('on');
    applyAnimationSetting();

    if (settings.customCursorEnabled) customCursorSwitch.classList.add('on');
    else customCursorSwitch.classList.remove('on');
    applyCustomCursorSetting();
    await applyCursorImage();

    if (settings.mainWallpaperEnabled) mainWallpaperSwitch.classList.add('on');
    else mainWallpaperSwitch.classList.remove('on');

    await applyBackground();
    await loadWallpaperVideo(currentWallpaperId);
    syncWallpaperVisibility();
    await updateBgPreview();
    await updateWallpaperPreview();
  }

  // ==================== 笔记列表 ====================
    function renderNoteList() {
    let filteredNotes = notes.filter(n => !n.deleted);

    if (activeCategory !== 'all') {
      filteredNotes = filteredNotes.filter(n => (n.category || 'other') === activeCategory);
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      filteredNotes = filteredNotes.filter(n =>
        (n.title || '').toLowerCase().includes(kw) ||
        (n.content || '').toLowerCase().includes(kw)
      );
    }

    noteCountEl.textContent = notes.filter(n => !n.deleted).length;
    notesListEl.innerHTML = '';

    if (filteredNotes.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = 'padding: 24px 12px; color: rgba(255,255,255,0.4); text-align: center; font-size: 0.85rem;';
      if (searchKeyword) {
        emptyItem.innerText = '没有匹配的笔记';
      } else if (activeCategory !== 'all') {
        emptyItem.innerText = '这个分类下暂无笔记';
      } else {
        emptyItem.innerText = '暂无笔记';
      }
      notesListEl.appendChild(emptyItem);
      return;
    }

    const pinned = filteredNotes.filter(n => n.pinned);
    const normal = filteredNotes.filter(n => !n.pinned);

    if (pinned.length > 0) {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'note-group-label';
      groupLabel.textContent = '置顶';
      notesListEl.appendChild(groupLabel);

      pinned.forEach(note => {
        notesListEl.appendChild(createNoteItemEl(note));
      });
    }

    if (pinned.length > 0 && normal.length > 0) {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'note-group-label';
      groupLabel.textContent = '全部笔记';
      notesListEl.appendChild(groupLabel);
    }

    normal.forEach(note => {
      notesListEl.appendChild(createNoteItemEl(note));
    });
  }

  function createNoteItemEl(note) {
    const item = document.createElement('div');
    item.className = `note-item ${note.id === activeNoteId ? 'active' : ''}${note.pinned ? ' pinned' : ''}`;
    item.dataset.noteId = note.id;

    const titleRow = document.createElement('div');
    titleRow.className = 'note-title';

    const titleTextEl = document.createElement('span');
    titleTextEl.className = 'note-title-text';
    titleTextEl.textContent = note.title || '无标题笔记';
    titleRow.appendChild(titleTextEl);

    if (activeCategory === 'all') {
      const cat = note.category || 'other';
      const catEl = document.createElement('span');
      catEl.className = 'note-category-tag cat-' + cat;
      catEl.textContent = CATEGORY_LABELS[cat] || '其他';
      titleRow.appendChild(catEl);
    }

    const pinRow = document.createElement('div');
    pinRow.className = 'note-pin-row';

    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn' + (note.pinned ? ' pinned' : '');
    pinBtn.title = note.pinned ? '取消置顶' : '置顶';
    pinBtn.innerHTML = '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinNote(note.id);
    });
    pinRow.appendChild(pinBtn);

    const dateRow = document.createElement('div');
    dateRow.className = 'note-date';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatTime(note.updatedAt);
    dateRow.appendChild(timeSpan);

    const fullText = (note.title || '') + (note.content || '');
    const charCount = fullText.length;
    if (charCount > 0) {
      const countSpan = document.createElement('span');
      countSpan.className = 'note-char-count';
      countSpan.textContent = `${charCount} 字`;
      dateRow.appendChild(countSpan);
    }

    item.appendChild(titleRow);
    item.appendChild(pinRow);
    item.appendChild(dateRow);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeNoteId !== note.id) setActiveNote(note.id);
    });

    return item;
  }

  function togglePinNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.pinned = !note.pinned;
    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    showToast(note.pinned ? '已置顶' : '已取消置顶');
  }

  function setNoteCategory(noteId, category) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    if ((note.category || 'other') === category) return;
    note.category = category;
    note.updatedAt = Date.now();
    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    const label = CATEGORY_LABELS[category] || category;
    showToast(`已改为「${label}」`);
  }

  function setActiveNote(noteId) {
    if (activeNoteId === noteId) return;
    if (activeNoteId && notes.some(n => n.id === activeNoteId)) {
      syncEditorToActiveNote();
    }
    activeNoteId = noteId;
    renderEditorForActiveNote();
    renderNoteList();
    saveNotesToStorage();
  }

  function syncEditorToActiveNote() {
    if (!activeNoteId) return false;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return false;

    if (note.locked) return false;

    const newTitle = noteTitleInput.value;
    const newContent = noteContentInput.value;
    if (note.title === newTitle && note.content === newContent) return false;

    note.title = newTitle;
    note.content = newContent;
    note.updatedAt = Date.now();

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    return true;
  }

  function renderEditorForActiveNote() {
    if (!activeNoteId || notes.length === 0) {
      emptyStateEl.classList.remove('hidden');
      editorWrapperEl.classList.add('hidden');
      return;
    }
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) {
      activeNoteId = notes.length > 0 ? notes[0].id : null;
      if (!activeNoteId) {
        emptyStateEl.classList.remove('hidden');
        editorWrapperEl.classList.add('hidden');
        return;
      }
      return renderEditorForActiveNote();
    }

    emptyStateEl.classList.add('hidden');
    editorWrapperEl.classList.remove('hidden');

    // 在写入内容之前，先把 locked 类同步好，避免锁定笔记内容闪现
    if (note.locked) {
      editorAreaEl.classList.add('locked');
    } else {
      editorAreaEl.classList.remove('locked');
    }

    noteTitleInput.value = note.title || '';
    noteContentInput.value = note.content || '';
    notePreviewEl.innerHTML = renderMarkdown(note.content || '');
    loadNoteImages(notePreviewEl);

    applyModeState();
    updateEditorStats();
  }

  const ICON_EDIT = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  const ICON_PREVIEW = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICON_LOCK_OPEN = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
  const ICON_LOCK_CLOSED = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function applyModeState() {
    const note = notes.find(n => n.id === activeNoteId);
    const locked = note ? !!note.locked : false;
    const preview = note ? !!note.preview : false;

    if (!locked) {
      if (preview) {
        noteTitleInput.style.display = 'block';
        noteTitleInput.readOnly = true;
        noteContentInput.style.display = 'none';
        notePreviewEl.style.display = 'block';
        toggleModeIcon.innerHTML = ICON_PREVIEW;
        toggleModeText.textContent = '预览模式';
        toggleModeBtn.classList.add('active');
      } else {
        noteTitleInput.style.display = 'block';
        noteTitleInput.readOnly = false;
        noteContentInput.style.display = 'block';
        notePreviewEl.style.display = 'none';
        toggleModeIcon.innerHTML = ICON_EDIT;
        toggleModeText.textContent = '编辑模式';
        toggleModeBtn.classList.remove('active');
      }
    }

    applyLockState();
  }

  // ==================== 锁定 ====================
  function isCurrentNoteLocked() {
    if (!activeNoteId) return false;
    const note = notes.find(n => n.id === activeNoteId);
    return note ? !!note.locked : false;
  }

  function applyLockState() {
    const locked = isCurrentNoteLocked();

    if (locked) {
      editorAreaEl.classList.add('locked');
      lockOverlay.classList.add('show');
      lockBtnIcon.innerHTML = ICON_LOCK_CLOSED;
      lockBtnText.textContent = '已锁定';
      lockBtn.classList.add('active');
      lockInput.value = '';
      lockError.textContent = '';
      lockInput.classList.remove('error');
      requestAnimationFrame(() => lockInput.focus());
    } else {
      editorAreaEl.classList.remove('locked');
      lockOverlay.classList.remove('show');
      lockBtnIcon.innerHTML = ICON_LOCK_OPEN;
      lockBtnText.textContent = '锁定';
      lockBtn.classList.remove('active');
    }
  }

  function toggleLock() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    if (note.locked) {
      lockInput.focus();
    } else {
      const users = getUsers();
      const userInfo = users[currentUser];
      if (!userInfo || !userInfo.noteLockPassword) {
        showAlert('请先在「设置 → 安全」中设置笔记锁密码', { title: '未设置笔记锁密码' });
        return;
      }
      note.locked = true;
      saveNotesToStorage();
      applyLockState();
      showToast('已锁定');
    }
  }

  function tryUnlock() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    const input = lockInput.value.trim();
    if (!input) {
      lockError.textContent = '请输入笔记锁密码';
      lockInput.classList.add('error');
      setTimeout(() => lockInput.classList.remove('error'), 400);
      return;
    }

    const users = getUsers();
    const userInfo = users[currentUser];
    if (!userInfo || !userInfo.noteLockPassword) {
      lockError.textContent = '未设置笔记锁密码';
      lockInput.classList.add('error');
      setTimeout(() => lockInput.classList.remove('error'), 400);
      return;
    }

    if (input !== userInfo.noteLockPassword) {
      lockError.textContent = '笔记锁密码不正确';
      lockInput.classList.add('error');
      setTimeout(() => lockInput.classList.remove('error'), 400);
      lockInput.select();
      return;
    }

    note.locked = false;
    saveNotesToStorage();
    lockError.textContent = '';
    lockInput.value = '';
    applyLockState();
    showToast('已解锁');
  }

  // ==================== 预览交互 ====================
  notePreviewEl.addEventListener('click', (e) => {
    const todoEl = e.target.closest('.preview-todo');
    if (!todoEl) return;
    if (isCurrentNoteLocked()) return;
    const lineIndex = parseInt(todoEl.dataset.line);
    if (isNaN(lineIndex)) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    const lines = note.content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const match = lines[lineIndex].match(/^- \[([ x])\] (.*)$/);
    if (!match) return;

    const isChecked = match[1] === 'x';
    lines[lineIndex] = `- [${isChecked ? ' ' : 'x'}] ${match[2]}`;
    note.content = lines.join('\n');
    note.updatedAt = Date.now();
    noteContentInput.value = note.content;

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    notePreviewEl.innerHTML = renderMarkdown(note.content);
    loadNoteImages(notePreviewEl);
  });

  notePreviewEl.addEventListener('mouseover', (e) => {
    const link = e.target.closest('.md-link');
    if (!link) return;
    const url = link.getAttribute('data-url') || link.getAttribute('href') || '';
    if (!url) return;

    linkTooltipEl.textContent = url;
    linkTooltipEl.classList.add('show');

    const rect = link.getBoundingClientRect();
    const tooltipRect = linkTooltipEl.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (left < 10) left = 10;
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = rect.top - tooltipHeight - 8;
      linkTooltipEl.classList.add('above');
    } else {
      linkTooltipEl.classList.remove('above');
    }

    linkTooltipEl.style.left = left + 'px';
    linkTooltipEl.style.top = top + 'px';
  });

  notePreviewEl.addEventListener('mouseout', (e) => {
    const link = e.target.closest('.md-link');
    if (!link) return;
    const related = e.relatedTarget;
    if (related && related.closest && related.closest('.md-link') === link) return;
    linkTooltipEl.classList.remove('show');
  });

  function createNewNote() {
    if (activeNoteId) syncEditorToActiveNote();
    const now = Date.now();
    const newNote = {
      id: generateId(),
      title: '新笔记',
      content: '',
      createdAt: now,
      updatedAt: now,
      preview: !!settings.defaultPreview,
      locked: false,
      pinned: false,
      category: activeCategory === 'all' ? 'other' : activeCategory,
    };
    notes.unshift(newNote);
    activeNoteId = newNote.id;
    searchKeyword = '';
    searchInput.value = '';

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    renderEditorForActiveNote();

    if (!settings.defaultPreview) {
      noteTitleInput.focus();
      noteTitleInput.select();
    }
  }

  // ==================== 导出当前笔记为 Markdown ====================
  async function exportNoteAsMarkdown(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) {
      showToast('笔记不存在', TOAST_ICON_INFO, 'info');
      return;
    }

    const title = (note.title || '无标题笔记').trim() || '无标题笔记';
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);

    let content = note.content || '';
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, id) => {
      if (/^(https?:\/\/|data:|#|\/)/i.test(id)) return m;
      return `![${alt || '图片'}](图片已保存在应用内，导出的 md 不含图片数据)`;
    });

    const md = `# ${title}\n\n${content}\n`;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `${safeTitle}-${dateStr}.md`;

    if (isTauri()) {
      const res = await saveViaTauri(filename, md, false);
      if (res.result === 'cancelled') return;
      if (res.result === 'saved') {
        showToast(`已导出到 ${res.path}`);
      }
      return;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const result = await saveBlob(
      blob,
      filename,
      'Markdown 文件',
      { mime: 'text/markdown', ext: '.md' }
    );

    if (result === 'cancelled') return;
    if (result === 'fallback') {
      showToast('已下载到默认目录（当前环境不支持自选路径）');
    } else {
      showToast('已导出');
    }
  }

  function deleteNoteById(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    note.deleted = true;
    note.deletedAt = Date.now();

    if (activeNoteId === noteId) {
      const visible = notes.filter(n => !n.deleted);
      activeNoteId = visible.length > 0 ? visible[0].id : null;
    }

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    renderEditorForActiveNote();
    showToast('已移到回收站');
  }

  function restoreNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.deleted = false;
    delete note.deletedAt;
    note.updatedAt = Date.now();
    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    renderTrashList();
    showToast('已恢复');
  }

  async function deleteNoteForever(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const ok = await showConfirm(`彻底删除「${note.title || '无标题笔记'}」？\n\n此操作不可恢复。`, { confirmText: '彻底删除', danger: true });
    if (!ok) return;

    const index = notes.findIndex(n => n.id === noteId);
    if (index === -1) return;
    const removed = notes.splice(index, 1)[0];

    try {
      await cleanupNoteImages(removed.content);
    } catch (e) {
      console.warn('清理笔记图片失败', e);
    }

    if (activeNoteId === noteId) {
      const visible = notes.filter(n => !n.deleted);
      activeNoteId = visible.length > 0 ? visible[0].id : null;
    }

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    renderEditorForActiveNote();
    renderTrashList();
    showToast('已彻底删除');
  }

  async function emptyTrash() {
    const deletedNotes = notes.filter(n => n.deleted);
    if (deletedNotes.length === 0) {
      showToast('回收站已经是空的');
      return;
    }
    const ok = await showConfirm(`确定清空回收站吗？\n\n${deletedNotes.length} 篇笔记将被永久删除，此操作不可恢复。`, { confirmText: '清空', danger: true });
    if (!ok) return;

    for (const n of deletedNotes) {
      try {
        await cleanupNoteImages(n.content);
      } catch (e) {
        console.warn('清理笔记图片失败', e);
      }
    }

    notes = notes.filter(n => !n.deleted);
    if (activeNoteId && !notes.some(n => n.id === activeNoteId)) {
      activeNoteId = notes.length > 0 ? notes[0].id : null;
    }

    sortNotes();
    saveNotesToStorage();
    renderNoteList();
    renderEditorForActiveNote();
    renderTrashList();
    showToast('回收站已清空');
  }

  function renderTrashList() {
    if (!trashList) return;
    trashList.innerHTML = '';

    const deletedNotes = notes
      .filter(n => n.deleted)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

    if (deletedNotes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'trash-empty';
      empty.textContent = '回收站是空的';
      trashList.appendChild(empty);
      return;
    }

    deletedNotes.forEach(note => {
      const item = document.createElement('div');
      item.className = 'trash-item';

      const info = document.createElement('div');
      info.className = 'trash-item-info';

      const titleEl = document.createElement('div');
      titleEl.className = 'trash-item-title';
      titleEl.textContent = note.title || '无标题笔记';
      info.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.className = 'trash-item-meta';
      const days = settings.trashRetentionDays || 30;
      const deletedAt = note.deletedAt || note.updatedAt;
      const expiresAt = deletedAt + days * 24 * 60 * 60 * 1000;
      const msLeft = expiresAt - Date.now();
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

      const deletedSpan = document.createElement('span');
      deletedSpan.textContent = '删除于 ' + formatTime(deletedAt);
      metaEl.appendChild(deletedSpan);

      const sep = document.createElement('span');
      sep.textContent = ' · ';
      sep.style.opacity = '0.6';
      metaEl.appendChild(sep);

      const remainSpan = document.createElement('span');
      if (daysLeft <= 0) {
        remainSpan.textContent = '即将清理';
        remainSpan.className = 'trash-remain urgent';
      } else {
        remainSpan.textContent = `剩余 ${daysLeft} 天`;
        if (daysLeft <= 1) remainSpan.className = 'trash-remain urgent';
        else if (daysLeft <= 3) remainSpan.className = 'trash-remain warn';
        else remainSpan.className = 'trash-remain';
      }
      metaEl.appendChild(remainSpan);

      info.appendChild(metaEl);

      item.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'trash-item-actions';

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'restore';
      restoreBtn.textContent = '恢复';
      restoreBtn.addEventListener('click', () => restoreNote(note.id));
      actions.appendChild(restoreBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-forever';
      delBtn.textContent = '彻底删除';
      delBtn.addEventListener('click', () => deleteNoteForever(note.id));
      actions.appendChild(delBtn);

      item.appendChild(actions);
      trashList.appendChild(item);
    });
  }

  async function deleteCurrentNoteWithConfirm() {
    if (!activeNoteId) return;
    const ok = await showConfirm('确定删除当前笔记吗？', { confirmText: '删除', danger: true });
    if (ok) deleteNoteById(activeNoteId);
  }

  let saveFlashTimer = null;

  function flashSaveButton() {
    if (!saveBtn) return;
    saveBtn.classList.add('saved');
    if (saveFlashTimer) clearTimeout(saveFlashTimer);
    saveFlashTimer = setTimeout(() => {
      saveBtn.classList.remove('saved');
      saveFlashTimer = null;
    }, 1500);
  }

  function updateEditorStats() {
    if (!editorStatsEl) return;
    if (!activeNoteId) {
      editorStatsEl.textContent = '';
      return;
    }
    const note = notes.find(n => n.id === activeNoteId);
    if (!note || note.locked) {
      editorStatsEl.textContent = '';
      return;
    }

    const title = noteTitleInput.value || '';
    const content = noteContentInput.value || '';
    const full = title + content;
    const chars = full.length;
    const cjk = (full.match(/[\u4e00-\u9fa5]/g) || []).length;

    if (chars === 0) {
      editorStatsEl.textContent = '';
      return;
    }

    editorStatsEl.textContent = `${chars} 字符 · ${cjk} 汉字`;
  }

  function saveActiveNote(silent = false) {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    if (note.locked) {
      if (!silent) showToast('笔记已锁定，无法保存', '🔒');
      return;
    }

    if (note.preview) {
      if (!silent) {
        showToast('已保存');
        flashSaveButton();
      }
      return;
    }

    const newTitle = noteTitleInput.value;
    const newContent = noteContentInput.value;
    const changed = (note.title !== newTitle || note.content !== newContent);

    note.title = newTitle;
    note.content = newContent;
    if (changed) note.updatedAt = Date.now();

    sortNotes();
    saveNotesToStorage();
    renderNoteList();

    if (!silent) {
      showToast('已保存');
      flashSaveButton();
    }
  }

  function toggleEditPreviewMode() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    const goingToPreview = !note.preview;

    if (goingToPreview) {
      if (!note.locked) syncEditorToActiveNote();
      const freshNote = notes.find(n => n.id === activeNoteId);
      if (freshNote) {
        notePreviewEl.innerHTML = renderMarkdown(freshNote.content);
        loadNoteImages(notePreviewEl);
        freshNote.preview = true;
      }
    } else {
      noteTitleInput.value = note.title;
      noteContentInput.value = note.content;
      note.preview = false;
    }

    saveNotesToStorage();
    applyModeState();
  }

  function toggleSidebar() {
    sidebarHidden = !sidebarHidden;
    if (sidebarHidden) {
      sidebarEl.classList.add('hidden-sidebar');
    } else {
      sidebarEl.classList.remove('hidden-sidebar');
    }
  }

  function toggleDarkMode() {
    settings.darkMode = !settings.darkMode;
    saveSettingsToStorage();
    applySettings();
  }

  // ==================== Tab 菜单 ====================
  let menuOpen = false;
  let highlightedIndex = 0;
  const menuItems = Array.from(mdMenuEl.querySelectorAll('.md-menu-item'));

  function openMdMenu() {
    if (isCurrentNoteLocked()) return;
    const textarea = noteContentInput;

    mdMenuEl.style.left = '-9999px';
    mdMenuEl.style.top = '-9999px';
    mdMenuEl.classList.add('show');
    menuOpen = true;
    highlightedIndex = 0;
    updateMenuHighlight();

    const coords = getCaretCoordinates(textarea, textarea.selectionStart);
    const textareaRect = textarea.getBoundingClientRect();

    const caretLeft = textareaRect.left + coords.left - textarea.scrollLeft;
    const caretTop = textareaRect.top + coords.top - textarea.scrollTop;
    const caretBottom = caretTop + coords.height;

    const menuRect = mdMenuEl.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    let left = caretLeft;
    let top = caretBottom + 6;

    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }
    if (top + menuHeight > window.innerHeight - 10) {
      top = caretTop - menuHeight - 6;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    mdMenuEl.style.left = left + 'px';
    mdMenuEl.style.top = top + 'px';

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = textarea.selectionStart;
      textarea.setSelectionRange(pos, pos);
    });
  }

  function closeMdMenu() {
    mdMenuEl.classList.remove('show');
    menuOpen = false;
  }

  function updateMenuHighlight() {
    menuItems.forEach((item, idx) => {
      item.classList.toggle('highlighted', idx === highlightedIndex);
    });
  }

  function insertAtCursor(text, cursorOffset = null) {
    const textarea = noteContentInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let prefix = '';
    if (start > 0 && textarea.value[start - 1] !== '\n') {
      prefix = '\n';
    }

    const insertion = prefix + text;
    const newValue = textarea.value.substring(0, start) + insertion + textarea.value.substring(end);

    textarea.value = newValue;

    let newCursor;
    if (cursorOffset !== null) {
      newCursor = start + prefix.length + cursorOffset;
    } else {
      newCursor = start + insertion.length;
    }
    textarea.setSelectionRange(newCursor, newCursor);
    textarea.focus();

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function wrapSelection(prefix, suffix, placeholder) {
    const textarea = noteContentInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    if (start === end) {
      const insertion = prefix + placeholder + suffix;
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      textarea.value = newValue;
      const cursorPos = start + prefix.length + placeholder.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    } else {
      const selected = value.substring(start, end);
      const newValue = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
      textarea.value = newValue;
      const cursorPos = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function handleMenuAction(type) {
    switch (type) {
      case 'h1': insertAtCursor('# ', 2); break;
      case 'h2': insertAtCursor('## ', 3); break;
      case 'bold': wrapSelection('**', '**', '粗体'); break;
      case 'italic': wrapSelection('*', '*', '斜体'); break;
      case 'strike': wrapSelection('~~', '~~', '删除线'); break;
      case 'link':
        (function() {
          const textarea = noteContentInput;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          let insertion, cursorPos;
          if (start === end) {
            insertion = '[链接](url)';
            const newValue = value.substring(0, start) + insertion + value.substring(end);
            textarea.value = newValue;
            cursorPos = start + 1;
          } else {
            const selected = value.substring(start, end);
            insertion = '[' + selected + '](url)';
            const newValue = value.substring(0, start) + insertion + value.substring(end);
            textarea.value = newValue;
            cursorPos = start + 1 + selected.length + 3;
          }
          textarea.setSelectionRange(cursorPos, cursorPos);
          textarea.focus();
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        })();
        break;
      case 'ul': insertAtCursor('- ', 2); break;
      case 'ol': insertAtCursor('1. ', 3); break;
      case 'todo': insertAtCursor('- [ ] ', 6); break;
    }
  }

  menuItems.forEach((item, idx) => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const type = item.dataset.type;
      handleMenuAction(type);
      closeMdMenu();
    });
    item.addEventListener('mouseenter', () => {
      highlightedIndex = idx;
      updateMenuHighlight();
    });
  });

  noteContentInput.addEventListener('keydown', (e) => {
    if (isCurrentNoteLocked()) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      if (menuOpen) closeMdMenu();
      else openMdMenu();
      return;
    }

    if (menuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % menuItems.length;
        updateMenuHighlight();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + menuItems.length) % menuItems.length;
        updateMenuHighlight();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = menuItems[highlightedIndex];
        handleMenuAction(item.dataset.type);
        closeMdMenu();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMdMenu();
        return;
      }
    }
  });

  noteContentInput.addEventListener('input', () => {
    if (menuOpen) closeMdMenu();
  });

  noteContentInput.addEventListener('scroll', () => {
    if (menuOpen) closeMdMenu();
  });

  document.addEventListener('mousedown', (e) => {
    if (menuOpen && !mdMenuEl.contains(e.target) && e.target !== noteContentInput) {
      closeMdMenu();
    }
  });

  // ==================== 图片粘贴 / 拖拽 ====================
  editorAreaEl.addEventListener('paste', async (e) => {
    if (isCurrentNoteLocked()) return;

    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    const imageFiles = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) return;
    e.preventDefault();

    for (const file of imageFiles) {
      await insertNoteImage(file);
    }
  });

  let dragCounter = 0;

  editorAreaEl.addEventListener('dragenter', (e) => {
    if (isCurrentNoteLocked()) return;
    const hasImage = Array.from(e.dataTransfer.types || []).includes('Files');
    if (!hasImage) return;
    e.preventDefault();
    dragCounter++;
    editorAreaEl.classList.add('dragover');
  });

  editorAreaEl.addEventListener('dragover', (e) => {
    if (isCurrentNoteLocked()) return;
    const hasImage = Array.from(e.dataTransfer.types || []).includes('Files');
    if (!hasImage) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  editorAreaEl.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      editorAreaEl.classList.remove('dragover');
    }
  });

  editorAreaEl.addEventListener('drop', async (e) => {
    if (isCurrentNoteLocked()) return;
    dragCounter = 0;
    editorAreaEl.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    e.preventDefault();

    for (const file of imageFiles) {
      await insertNoteImage(file);
    }
  });

  // ==================== 头像裁切 ====================
  let cropState = {
    img: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    minScale: 1,
    maxScale: 3,
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    canvasW: 0,
    canvasH: 0,
    cropRadius: 0,
  };

  function openCropDialog(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        cropState.img = img;
        initCropCanvas();
        resetCrop();
        cropOverlay.classList.add('show');
        bindCropResize();
      };
      img.onerror = async () => {
        await showAlert('图片加载失败');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function initCropCanvas() {
    const stageRect = cropStage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cropCanvas.width = stageRect.width * dpr;
    cropCanvas.height = stageRect.height * dpr;
    cropCanvas.style.width = stageRect.width + 'px';
    cropCanvas.style.height = stageRect.height + 'px';
    cropState.canvasW = stageRect.width;
    cropState.canvasH = stageRect.height;
    cropState.cropRadius = Math.min(stageRect.width, stageRect.height) * 0.4;

    const img = cropState.img;
    const diameter = cropState.cropRadius * 2;
    cropState.minScale = Math.max(diameter / img.width, diameter / img.height);
    cropState.maxScale = cropState.minScale * 3;
  }

  function resetCrop() {
    cropState.scale = cropState.minScale;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    cropZoom.value = 100;
    cropZoom.min = 100;
    cropZoom.max = 300;
    drawCrop();
  }

  function drawCrop() {
    const ctx = cropCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = cropState.canvasW;
    const h = cropState.canvasH;
    const img = cropState.img;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, w, h);

    if (!img) {
      ctx.restore();
      return;
    }

    const dw = img.width * cropState.scale;
    const dh = img.height * cropState.scale;
    const dx = (w - dw) / 2 + cropState.offsetX;
    const dy = (h - dh) / 2 + cropState.offsetY;

    ctx.drawImage(img, dx, dy, dw, dh);

    const cx = w / 2;
    const cy = h / 2;
    const r = cropState.cropRadius;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  cropCanvas.addEventListener('mousedown', (e) => {
    cropState.isDragging = true;
    cropState.startX = e.clientX;
    cropState.startY = e.clientY;
    cropState.startOffsetX = cropState.offsetX;
    cropState.startOffsetY = cropState.offsetY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!cropState.isDragging || !cropState.img) return;
    const dx = e.clientX - cropState.startX;
    const dy = e.clientY - cropState.startY;
    cropState.offsetX = cropState.startOffsetX + dx;
    cropState.offsetY = cropState.startOffsetY + dy;
    clampCropOffset();
    drawCrop();
  });

  window.addEventListener('mouseup', () => {
    cropState.isDragging = false;
  });

  cropCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    cropState.isDragging = true;
    cropState.startX = e.touches[0].clientX;
    cropState.startY = e.touches[0].clientY;
    cropState.startOffsetX = cropState.offsetX;
    cropState.startOffsetY = cropState.offsetY;
  }, { passive: true });

  cropCanvas.addEventListener('touchmove', (e) => {
    if (!cropState.isDragging || !cropState.img) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - cropState.startX;
    const dy = e.touches[0].clientY - cropState.startY;
    cropState.offsetX = cropState.startOffsetX + dx;
    cropState.offsetY = cropState.startOffsetY + dy;
    clampCropOffset();
    drawCrop();
  }, { passive: false });

  cropCanvas.addEventListener('touchend', () => {
    cropState.isDragging = false;
  });

  function clampCropOffset() {
    const img = cropState.img;
    if (!img) return;
    const w = cropState.canvasW;
    const h = cropState.canvasH;
    const dw = img.width * cropState.scale;
    const dh = img.height * cropState.scale;
    const cx = w / 2;
    const cy = h / 2;
    const r = cropState.cropRadius;

    const minDx = cx + r - dw;
    const maxDx = cx - r;
    const minDy = cy + r - dh;
    const maxDy = cy - r;

    const baseDx = (w - dw) / 2;
    const baseDy = (h - dh) / 2;

    const minOffsetX = minDx - baseDx;
    const maxOffsetX = maxDx - baseDx;
    const minOffsetY = minDy - baseDy;
    const maxOffsetY = maxDy - baseDy;

    if (cropState.offsetX < minOffsetX) cropState.offsetX = minOffsetX;
    if (cropState.offsetX > maxOffsetX) cropState.offsetX = maxOffsetX;
    if (cropState.offsetY < minOffsetY) cropState.offsetY = minOffsetY;
    if (cropState.offsetY > maxOffsetY) cropState.offsetY = maxOffsetY;
  }

  cropZoom.addEventListener('input', (e) => {
    if (!cropState.img) return;
    const percent = parseInt(e.target.value);
    const newScale = cropState.minScale * (percent / 100);
    cropState.scale = newScale;
    clampCropOffset();
    drawCrop();
  });

  // ==================== 裁切面板 resize 响应 ====================
  let cropResizeBound = false;
  let cropResizeRAF = null;

  function bindCropResize() {
    if (cropResizeBound) return;
    cropResizeBound = true;
    window.addEventListener('resize', onCropResize);
    window.addEventListener('orientationchange', onCropResize);
  }

  function unbindCropResize() {
    if (!cropResizeBound) return;
    cropResizeBound = false;
    window.removeEventListener('resize', onCropResize);
    window.removeEventListener('orientationchange', onCropResize);
  }

  function onCropResize() {
    if (!cropState.img) return;
    if (cropResizeRAF) cancelAnimationFrame(cropResizeRAF);
    cropResizeRAF = requestAnimationFrame(() => {
      cropResizeRAF = null;
      const ratio = cropState.scale / (cropState.minScale || 1);
      initCropCanvas();
      cropState.scale = Math.min(
        cropState.maxScale,
        Math.max(cropState.minScale, cropState.minScale * ratio)
      );
      cropZoom.value = Math.round((cropState.scale / cropState.minScale) * 100);
      clampCropOffset();
      drawCrop();
    });
  }

  cropResetBtn.addEventListener('click', () => { resetCrop(); });

  cropCancelBtn.addEventListener('click', () => {
    cropOverlay.classList.remove('show');
    cropState.img = null;
    unbindCropResize();
  });

  cropCloseBtn.addEventListener('click', () => {
    cropOverlay.classList.remove('show');
    cropState.img = null;
    unbindCropResize();
  });

  cropConfirmBtn.addEventListener('click', async () => {
    if (!cropState.img) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = AVATAR_SIZE;
    outCanvas.height = AVATAR_SIZE;
    const outCtx = outCanvas.getContext('2d');

    const outputR = AVATAR_SIZE / 2;

    const w = cropState.canvasW;
    const h = cropState.canvasH;
    const img = cropState.img;
    const dw = img.width * cropState.scale;
    const dh = img.height * cropState.scale;
    const dx = (w - dw) / 2 + cropState.offsetX;
    const dy = (h - dh) / 2 + cropState.offsetY;

    const cx = w / 2;
    const cy = h / 2;
    const r = cropState.cropRadius;

    const srcCx = (cx - dx) / cropState.scale;
    const srcCy = (cy - dy) / cropState.scale;
    const srcR = r / cropState.scale;

    outCtx.save();
    outCtx.beginPath();
    outCtx.arc(outputR, outputR, outputR, 0, Math.PI * 2);
    outCtx.closePath();
    outCtx.clip();

    outCtx.fillStyle = '#000';
    outCtx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

    outCtx.drawImage(
      img,
      srcCx - srcR, srcCy - srcR, srcR * 2, srcR * 2,
      0, 0, AVATAR_SIZE, AVATAR_SIZE
    );
    outCtx.restore();

    const dataUrl = outCanvas.toDataURL('image/jpeg', 0.9);

    try {
      window.DB.saveAvatar(currentUser, dataUrl);
    } catch (e) {
      await showAlert('头像保存失败：存储空间不足');
      return;
    }

    renderAvatar();

    cropOverlay.classList.remove('show');
    cropState.img = null;
    unbindCropResize();
  });

  // ==================== 头像渲染 ====================
  function renderAvatar() {
    if (!currentUser) return;

    accountAvatarLetter.textContent = currentUser.charAt(0).toUpperCase();

    const avatarData = window.DB.loadAvatar(currentUser);

    if (avatarData) {
      accountAvatar.style.backgroundImage = `url('${avatarData}')`;
      accountAvatar.classList.add('has-image');
    } else {
      accountAvatar.style.backgroundImage = 'linear-gradient(135deg, rgba(91, 141, 238, 0.6), rgba(160, 120, 255, 0.6))';
      accountAvatar.classList.remove('has-image');
    }
  }

  accountAvatar.addEventListener('click', () => {
    if (!currentUser) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showAlert('图片过大，请选择小于 10MB 的图片', { title: '文件过大' });
          return;
        }
        openCropDialog(file);
      }
    };
    input.click();
  });

  // ==================== 登录相关 ====================
  let isRegisterMode = false;
  let loginLoadingTimer = null;
  let loginLoadingText = '';
  let loginLoadingDots = 0;

  function setLoginMode(register) {
    isRegisterMode = register;
    if (register) {
      loginSubmitBtn.textContent = '注册';
      loginSwitchText.textContent = '已有账号？';
      loginSwitchBtn.textContent = '点此登录';
    } else {
      loginSubmitBtn.textContent = '登录';
      loginSwitchText.textContent = '还没有账号？';
      loginSwitchBtn.textContent = '点此注册';
    }
  }

  function showLogin() {
    applyRemember();

    if (loginLoadingTimer) {
      clearInterval(loginLoadingTimer);
      loginLoadingTimer = null;
    }
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = isRegisterMode ? '注册' : '登录';

    loginOverlay.classList.remove('fast-hide');
    loginOverlay.classList.add('show');

    loadWallpaperVideo(currentWallpaperId);
    syncWallpaperVisibility();

    setTimeout(() => {
      if (loginUsername.value && loginPassword.value) {
        loginPassword.focus();
      } else {
        loginUsername.focus();
      }
    }, 1000);
  }

  function hideLogin() {
    loginOverlay.classList.add('fast-hide');
    loginOverlay.classList.remove('show');
    if (loginLoadingTimer) {
      clearInterval(loginLoadingTimer);
      loginLoadingTimer = null;
    }
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = isRegisterMode ? '注册' : '登录';
  }

  function startLoginLoading(baseText) {
    loginSubmitBtn.disabled = true;
    loginLoadingText = baseText;
    loginLoadingDots = 0;

    const render = () => {
      const dots = '.'.repeat(loginLoadingDots);
      loginSubmitBtn.textContent = loginLoadingText + dots;
    };

    render();

    loginLoadingTimer = setInterval(() => {
      loginLoadingDots = (loginLoadingDots + 1) % 4;
      render();
    }, 250);
  }

  function stopLoginLoading() {
    if (loginLoadingTimer) {
      clearInterval(loginLoadingTimer);
      loginLoadingTimer = null;
    }
    loginSubmitBtn.disabled = false;
  }

  async function handleLoginSubmit() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!isValidUsername(username)) {
      await showAlert('用户名需为 3-20 位字母、数字或下划线', { title: '格式错误' });
      return;
    }
    if (!password) {
      await showAlert('请输入密码', { title: '提示' });
      return;
    }

    const startTime = Date.now();
    startLoginLoading(isRegisterMode ? '注册中' : '登录中');

    const users = getUsers();
    let errorMsg = null;
    let registrationRecoveryKey = null;

    if (isRegisterMode) {
      if (users[username]) {
        errorMsg = { title: '提示', message: '用户名已存在，请直接登录' };
      } else {
        const recoveryKey = generateRecoveryKey();
        users[username] = {
          password: hashPassword(password),
          recoveryKey: recoveryKey,
          createdAt: Date.now(),
          noteLockPassword: null
        };
        saveUsers(users);
        registrationRecoveryKey = recoveryKey;
      }
    } else {
      if (!users[username]) {
        errorMsg = { title: '登录失败', message: '用户不存在' };
      } else if (users[username].password !== hashPassword(password)) {
        errorMsg = { title: '登录失败', message: '密码错误' };
      }
    }

    const elapsed = Date.now() - startTime;
    const minDuration = 2000;
    if (elapsed < minDuration) {
      await new Promise(r => setTimeout(r, minDuration - elapsed));
    }

        if (errorMsg) {
      stopLoginLoading();
      await showAlert(errorMsg.message, { title: errorMsg.title });
      return;
    }

    // 显示「登录成功」/「注册成功」
    if (loginLoadingTimer) {
      clearInterval(loginLoadingTimer);
      loginLoadingTimer = null;
    }
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = isRegisterMode ? '注册成功 ✓' : '登录成功 ✓';

//调试：每 50ms 检查一次按钮文字，变了就打印
    const debugTimer = setInterval(() => {
      console.log('[debug] 按钮文字 =', loginSubmitBtn.textContent);
    }, 50);

    await new Promise(r => setTimeout(r, 800));
    clearInterval(debugTimer);

    // 停一下让用户看到
    await new Promise(r => setTimeout(r, 800));

    if (registrationRecoveryKey) {
      await showRecoveryKeyDialog(registrationRecoveryKey);
    }

    try {
      localStorage.setItem('lingyu_last_username', username);
    } catch (e) {}

    if (loginRemember.checked) {
      try {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem(REMEMBER_KEY);
      } catch (e) {}
    }

    currentUser = username;
    try {
      localStorage.setItem(CURRENT_USER_KEY, username);
    } catch (e) {}

        // 停留一下，让登录成功的状态可见
    await new Promise(r => setTimeout(r, 400));

    hideLogin();

    // 等登录界面淡出一点，再切主界面
    await new Promise(r => setTimeout(r, 300));

    appContainer.classList.remove('hidden-app');
    void appContainer.offsetWidth;
    appContainer.classList.add('visible');

    await enterApp();

    showToast(`欢迎回来，${username}`);
  }

  function applyRemember() {
    try {
      const stored = localStorage.getItem(REMEMBER_KEY);
      if (stored) {
        const { username, password } = JSON.parse(stored);
        loginUsername.value = username || '';
        loginPassword.value = password || '';
        loginRemember.checked = true;
      } else {
        let lastUser = '';
        try { lastUser = localStorage.getItem('lingyu_last_username') || ''; } catch (e) {}
        loginUsername.value = lastUser;
        loginPassword.value = '';
        loginRemember.checked = false;
      }
    } catch (e) {}
  }

  async function logout() {
    const ok = await showConfirm('确定要退出登录吗？', { confirmText: '退出', danger: true });
    if (!ok) return;

    flushAutoSave();
    saveNotesToStorage();
    saveSettingsToStorage();

    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {}

    settingsOverlay.classList.remove('show');
    pickerOverlay.classList.remove('show');
    shortcutsOverlay.classList.remove('show');
    cursorOverlay.classList.remove('show');
    trashOverlay.classList.remove('show');

    currentUser = null;
    notes = [];
    activeNoteId = null;

    appContainer.classList.remove('visible');
    showLogin();
    syncWallpaperVisibility();

    setTimeout(() => {
      appContainer.classList.add('hidden-app');
    }, 1500);
  }

  async function deleteAccount() {
    if (!currentUser) return;

    const ok1 = await showConfirm(
      '确定要注销账号吗？\n\n该账户下的所有笔记、设置、背景图、笔记内图片、动态壁纸都将被永久删除。\n\n此操作不可恢复！',
      { title: '注销账号', confirmText: '继续', danger: true }
    );
    if (!ok1) return;

    const ok2 = await showDeleteAccountDialog();
    if (!ok2) return;

    const username = currentUser;

    try {
      window.DB.removeUserData(username);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {}

    const users = getUsers();
    delete users[username];
    saveUsers(users);

    try {
      const allBgs = await bgDB.getAll();
      const userBgs = allBgs.filter(item => item.owner === username);
      for (const bg of userBgs) {
        await bgDB.delete(bg.id);
      }
    } catch (e) {
      console.warn('删除背景图失败', e);
    }

    try {
      const allImgs = await bgDB.getAllNoteImages();
      const userImgs = allImgs.filter(item => item.owner === username);
      for (const img of userImgs) {
        await bgDB.deleteNoteImage(img.id);
      }
    } catch (e) {
      console.warn('删除笔记图片失败', e);
    }

    try {
      const allWps = await bgDB.getAllWallpapers();
      const userWps = allWps.filter(item => item.owner === username);
      for (const wp of userWps) {
        await bgDB.deleteWallpaper(wp.id);
      }
      if (currentWallpaperId) {
        const stillOwned = allWps.some(item => item.id === currentWallpaperId && item.owner === username);
        if (stillOwned) {
          try { localStorage.removeItem(CURRENT_WALLPAPER_KEY); } catch (e) {}
          currentWallpaperId = null;
        }
      }
    } catch (e) {
      console.warn('删除动态壁纸失败', e);
    }

    settingsOverlay.classList.remove('show');
    pickerOverlay.classList.remove('show');
    shortcutsOverlay.classList.remove('show');
    cursorOverlay.classList.remove('show');

    currentUser = null;
    notes = [];
    activeNoteId = null;

    appContainer.classList.remove('visible');
    showLogin();
    syncWallpaperVisibility();

    await new Promise(r => setTimeout(r, 1500));

    appContainer.classList.add('hidden-app');

    loginUsername.value = '';
    loginPassword.value = '';
    loginRemember.checked = false;
    try { localStorage.removeItem(REMEMBER_KEY); } catch (e) {}

    await showAlert('账号已注销', { title: '注销成功' });
  }

  // ==================== 设置面板 ====================
  function openSettings() {
    settingsOverlay.classList.add('show');
    updateAccountPage();
    updateStorageUsage();
    updateBgPreview();
    updateWallpaperPreview();
    renderWallpaperGrids();
    updateSaveDirDisplay();
    updateNoteLockStatusDisplay();
  }

  function closeSettings() {
    settingsOverlay.classList.remove('show');
  }

  function updateAccountPage() {
    if (!currentUser) return;
    accountAvatarLetter.textContent = currentUser.charAt(0).toUpperCase();
    accountUsername.textContent = currentUser;

    const users = getUsers();
    const info = users[currentUser];
    if (info && info.createdAt) {
      const date = new Date(info.createdAt);
      accountMeta.textContent = `注册于 ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      accountMeta.textContent = '';
    }

    renderAvatar();
  }

  settingsBtn.addEventListener('click', openSettings);
  shortcutsBtn.addEventListener('click', openShortcuts);
  shortcutsCloseBtn.addEventListener('click', closeShortcuts);
  closeSettingsBtn.addEventListener('click', closeSettings);

  trashBtn.addEventListener('click', () => {
    trashOverlay.classList.add('show');
    renderTrashList();
    bindRippleToAll();
  });

  trashCloseBtn.addEventListener('click', () => {
    trashOverlay.classList.remove('show');
  });

  emptyTrashBtn.addEventListener('click', emptyTrash);

  pickSaveDirBtn.addEventListener('click', pickSaveDir);
  clearSaveDirBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    window.DB.removeSaveDir(currentUser);
    updateSaveDirDisplay();
    showToast('已清除保存位置');
  });

  navItems.forEach(item => {
    item.addEventListener('click', async () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const targetId = item.dataset.page;
      pages.forEach(p => p.classList.remove('active'));
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.add('active');
      if (targetId === 'page-glass') await updateBgPreview();
      if (targetId === 'page-wallpaper') await updateWallpaperPreview();
      if (targetId === 'page-account') updateAccountPage();
      if (targetId === 'page-data') { updateStorageUsage(); updateSaveDirDisplay(); }
      if (targetId === 'page-security') updateNoteLockStatusDisplay();
    });
  });

  pickerCloseBtn.addEventListener('click', closePicker);

  switchBgBtn.addEventListener('click', () => openPicker('bg'));
  switchWallpaperBtn.addEventListener('click', () => openPicker('wallpaper'));

  loginAboutBtn.addEventListener('click', () => {
    aboutOverlay.classList.add('show');
  });

  aboutCloseBtn.addEventListener('click', () => {
    aboutOverlay.classList.remove('show');
  });

  aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) {
      aboutOverlay.classList.remove('show');
    }
  });

  loginWallpaperBtn.addEventListener('click', () => {
    wallpaperOverlay.classList.add('show');
    renderWallpaperGrids();
  });

  wallpaperCloseBtn.addEventListener('click', () => {
    wallpaperOverlay.classList.remove('show');
  });

  wallpaperAddBtn.addEventListener('click', () => wallpaperFileInput.click());
  wallpaperFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    wallpaperFileInput.value = '';
    if (file) importWallpaperFile(file);
  });

  settingsWallpaperAddBtn.addEventListener('click', () => settingsWallpaperFileInput.click());
  settingsWallpaperFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    settingsWallpaperFileInput.value = '';
    if (file) importWallpaperFile(file);
  });

  darkModeSwitch.addEventListener('click', () => {
    settings.darkMode = !settings.darkMode;
    saveSettingsToStorage();
    applySettings();
  });

  animationSwitch.addEventListener('click', () => {
    settings.animationEnabled = !settings.animationEnabled;
    saveSettingsToStorage();
    applySettings();
  });

  customCursorSwitch.addEventListener('click', async () => {
    settings.customCursorEnabled = !settings.customCursorEnabled;
    saveSettingsToStorage();
    applyCustomCursorSetting();
    customCursorSwitch.classList.toggle('on', settings.customCursorEnabled);
    if (settings.customCursorEnabled) {
      await applyCursorImage();
    }
  });

  openCursorPanelBtn.addEventListener('click', async () => {
    cursorOverlay.classList.add('show');
    await applyCursorImage();
    bindRippleToAll();
  });

  cursorCloseBtn.addEventListener('click', () => {
    cursorOverlay.classList.remove('show');
  });

  uploadCursorBtn.addEventListener('click', () => cursorImageInput.click());
  uploadCursorTextBtn.addEventListener('click', () => cursorTextImageInput.click());
  uploadCursorPointerBtn.addEventListener('click', () => cursorPointerImageInput.click());

  cursorImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    cursorImageInput.value = '';
    await handleCursorImageUpload(file, 'normal');
  });

  cursorTextImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    cursorTextImageInput.value = '';
    await handleCursorImageUpload(file, 'text');
  });

  cursorPointerImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    cursorPointerImageInput.value = '';
    await handleCursorImageUpload(file, 'pointer');
  });

  resetCursorBtn.addEventListener('click', async () => {
    if (!settings.customCursorImageId) {
      showToast('当前已经是默认光标');
      return;
    }
    const ok = await showConfirm('确定要恢复默认光标吗？\n\n上传的图片将被删除。', { confirmText: '恢复', danger: true });
    if (!ok) return;

    try { await bgDB.deleteCursor(settings.customCursorImageId); } catch (e) {}
    settings.customCursorImageId = null;
    saveSettingsToStorage();

    await applyCursorImage();
    showToast('已恢复默认光标');
  });

  resetCursorTextBtn.addEventListener('click', async () => {
    if (!settings.customCursorTextImageId) {
      showToast('当前已经是默认文本光标');
      return;
    }
    const ok = await showConfirm('确定要恢复默认文本光标吗？\n\n上传的图片将被删除。', { confirmText: '恢复', danger: true });
    if (!ok) return;

    try { await bgDB.deleteCursor(settings.customCursorTextImageId); } catch (e) {}
    settings.customCursorTextImageId = null;
    saveSettingsToStorage();

    await applyCursorImage();
    showToast('已恢复默认文本光标');
  });

  resetCursorPointerBtn.addEventListener('click', async () => {
    if (!settings.customCursorPointerImageId) {
      showToast('当前已经是默认悬停光标');
      return;
    }
    const ok = await showConfirm('确定要恢复默认悬停光标吗？\n\n上传的图片将被删除。', { confirmText: '恢复', danger: true });
    if (!ok) return;

    try { await bgDB.deleteCursor(settings.customCursorPointerImageId); } catch (e) {}
    settings.customCursorPointerImageId = null;
    saveSettingsToStorage();

    await applyCursorImage();
    showToast('已恢复默认悬停光标');
  });

  fontSizeSelect.addEventListener('change', (e) => {
    settings.fontSize = e.target.value;
    saveSettingsToStorage();
    applySettings();
  });

  defaultPreviewSelect.addEventListener('change', (e) => {
    settings.defaultPreview = e.target.value === 'preview';
    saveSettingsToStorage();
  });

  sidebarDefaultSelect.addEventListener('change', (e) => {
    settings.sidebarDefaultHidden = e.target.value === 'hide';
    saveSettingsToStorage();
  });

  autoSaveSelect.addEventListener('change', (e) => {
    settings.autoSaveInterval = parseInt(e.target.value) || 5;
    saveSettingsToStorage();
  });

  mainWallpaperSwitch.addEventListener('click', async () => {
    settings.mainWallpaperEnabled = !settings.mainWallpaperEnabled;
    saveSettingsToStorage();
    await applySettings();
  });

  galleryAddUrlBtn.addEventListener('click', async () => {
    const url = galleryUrlInput.value.trim();
    if (!url) return;
    const thumbnail = await makeThumbnail(url);
    const item = {
      id: generateId(),
      type: 'url',
      data: url,
      thumbnail: thumbnail,
      createdAt: Date.now(),
      owner: currentUser
    };
    await bgDB.add(item);
    galleryUrlInput.value = '';
    if (!settings.currentBgId) {
      settings.currentBgId = item.id;
      saveSettingsToStorage();
      await applyBackground();
      await updateBgPreview();
    }
    showToast('已添加背景');
  });

  galleryUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      galleryAddUrlBtn.click();
    }
  });

  galleryAddFileBtn.addEventListener('click', () => galleryFileInput.click());
  galleryFileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const showProgressBar = files.length >= 2;

    if (showProgressBar) {
      showProgress('正在添加背景...');
      updateProgress(0, files.length);
      await yieldToUI();
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const thumbnail = await makeThumbnail(dataUrl);
      const item = {
        id: generateId(),
        type: 'file',
        data: dataUrl,
        thumbnail: thumbnail,
        createdAt: Date.now(),
        owner: currentUser
      };
      await bgDB.add(item);
      if (!settings.currentBgId) {
        settings.currentBgId = item.id;
        saveSettingsToStorage();
      }
      if (showProgressBar) {
        updateProgress(i + 1, files.length);
        await yieldToUI();
      }
    }

    galleryFileInput.value = '';
    await applyBackground();
    await updateBgPreview();

    if (showProgressBar) {
      hideProgress();
    }

    showToast(files.length > 1 ? `已添加 ${files.length} 张背景` : '已添加背景');
  });

  blurSlider.addEventListener('input', (e) => {
    settings.blur = parseInt(e.target.value);
    blurValue.textContent = settings.blur + '%';
    updateSliderFill(blurSlider);
    saveSettingsToStorage();
    applySettings();
  });

  sortSelect.addEventListener('change', (e) => {
    settings.sortBy = e.target.value;
    saveSettingsToStorage();
    sortNotes();
    renderNoteList();
  });

  // ==================== 回收站保留时长 ====================
  function purgeExpiredTrash() {
    const days = settings.trashRetentionDays || 30;
    if (days <= 0) return;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const toPurge = notes.filter(n => n.deleted && n.deletedAt && n.deletedAt < cutoff);
    if (toPurge.length === 0) return;

    (async () => {
      for (const n of toPurge) {
        try {
          await cleanupNoteImages(n.content);
        } catch (e) {
          console.warn('清理过期笔记图片失败', e);
        }
      }
      const before = notes.length;
      notes = notes.filter(n => !(n.deleted && n.deletedAt && n.deletedAt < cutoff));
      const removed = before - notes.length;
      if (removed > 0) {
        if (activeNoteId && !notes.some(n => n.id === activeNoteId)) {
          const visible = notes.filter(n => !n.deleted);
          activeNoteId = visible.length > 0 ? visible[0].id : null;
        }
        sortNotes();
        saveNotesToStorage();
        renderNoteList();
        renderEditorForActiveNote();
        showToast(`已自动清理 ${removed} 篇过期笔记`);
      }
    })();
  }

  if (trashRetentionSelect) {
    trashRetentionSelect.addEventListener('change', (e) => {
      settings.trashRetentionDays = parseInt(e.target.value) || 30;
      saveSettingsToStorage();
      purgeExpiredTrash();
      showToast(`回收站保留 ${settings.trashRetentionDays} 天`);
    });
  }

  // ==================== 安全页事件 ====================
  if (setNoteLockPasswordBtn) {
    setNoteLockPasswordBtn.addEventListener('click', () => {
      if (!currentUser) return;
      showSetNoteLockPasswordDialog();
    });
  }

  if (viewNoteLockPasswordBtn) {
    viewNoteLockPasswordBtn.addEventListener('click', () => {
      if (!currentUser) return;
      showViewNoteLockPasswordDialog();
    });
  }

  // ==================== 快捷键录入 ====================
  let recordingEl = null;
  let isRecording = false;

  function startRecording(el) {
    if (isRecording) return;
    recordingEl = el;
    isRecording = true;
    el.classList.add('recording');
    el.textContent = '按下新按键...';
  }

  function stopRecording() {
    if (!recordingEl) return;
    recordingEl.classList.remove('recording');
    recordingEl = null;
    isRecording = false;
  }

  Object.values(shortcutEls).forEach(el => {
    if (!el) return;
    el.addEventListener('click', () => startRecording(el));
  });

  resetShortcutsBtn.addEventListener('click', async () => {
    const ok = await showConfirm('确定要重置所有快捷键吗？\n\n只有快捷键会恢复默认值，其他设置不受影响。', { confirmText: '重置', danger: true });
    if (!ok) return;

    const defaults = window.DB.defaultSettings();
    settings.shortcuts = defaults.shortcuts;
    saveSettingsToStorage();
    await applySettings();

    await showAlert('快捷键已重置', { title: '完成' });
  });

  document.addEventListener('keydown', (e) => {
    if (recordingEl) {
      if (e.key === 'Escape' && customContextMenu && customContextMenu.classList.contains('show')) {
        e.preventDefault();
        closeContextMenu();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        const action = recordingEl.dataset.shortcut;
        recordingEl.textContent = settings.shortcuts[action];
        stopRecording();
        return;
      }

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        const previewParts = [];
        if (e.ctrlKey) previewParts.push('Ctrl');
        if (e.altKey) previewParts.push('Alt');
        if (e.shiftKey) previewParts.push('Shift');
        if (e.metaKey) previewParts.push('Meta');
        recordingEl.textContent = previewParts.join('+') + '+...';
        return;
      }

      const shortcutStr = eventToShortcut(e);
      if (!isValidShortcut(shortcutStr)) {
        recordingEl.textContent = '无效按键';
        recordingEl.classList.add('conflict');
        setTimeout(() => {
          recordingEl.classList.remove('conflict');
          recordingEl.textContent = settings.shortcuts[recordingEl.dataset.shortcut];
          stopRecording();
        }, 900);
        return;
      }

      const action = recordingEl.dataset.shortcut;
      const conflictAction = findShortcutConflict(action, shortcutStr);
      if (conflictAction) {
        recordingEl.textContent = '与其他快捷键冲突';
        recordingEl.classList.add('conflict');
        setTimeout(() => {
          recordingEl.classList.remove('conflict');
          recordingEl.textContent = settings.shortcuts[action];
          stopRecording();
        }, 1200);
        return;
      }

      settings.shortcuts[action] = shortcutStr;
      saveSettingsToStorage();
      recordingEl.textContent = shortcutStr;
      stopRecording();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      e.stopPropagation();
      saveActiveNote();
      return;
    }

    const tag = document.activeElement && document.activeElement.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

    if (dialogOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closeDialog();
      return;
    }

    if (cropOverlay.classList.contains('show')) {
      if (e.key === 'Escape') {
        cropOverlay.classList.remove('show');
        cropState.img = null;
        unbindCropResize();
      }
      return;
    }

    if (pickerOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closePicker();
      return;
    }

    if (shortcutsOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closeShortcuts();
      return;
    }

    if (cursorOverlay.classList.contains('show')) {
      if (e.key === 'Escape') cursorOverlay.classList.remove('show');
      return;
    }

    if (trashOverlay.classList.contains('show')) {
      if (e.key === 'Escape') trashOverlay.classList.remove('show');
      return;
    }

    if (loginOverlay.classList.contains('show')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLoginSubmit();
      }
      return;
    }

    if (aboutOverlay.classList.contains('show')) {
      if (e.key === 'Escape') aboutOverlay.classList.remove('show');
      return;
    }


    if (wallpaperOverlay.classList.contains('show')) {
      if (e.key === 'Escape') wallpaperOverlay.classList.remove('show');
      return;
    }

    if (settingsOverlay.classList.contains('show')) {
      if (e.key === 'Escape') closeSettings();
      return;
    }

    if (e.key === 'Escape') {
      const active = document.activeElement;
      if (active && (active.id === 'noteContentInput' || active.id === 'noteTitleInput')) {
        active.blur();
        e.preventDefault();
        return;
      }
    }

    function shouldTrigger(shortcutStr) {
      if (!matchShortcut(e, shortcutStr)) return false;
      if (isTyping) {
        const hasMod = /\b(Ctrl|Alt|Shift|Meta)\b/.test(shortcutStr);
        if (!hasMod) return false;
      }
      return true;
    }

    if (shouldTrigger(settings.shortcuts.toggleMode)) {
      e.preventDefault();
      toggleEditPreviewMode();
      return;
    }
    if (shouldTrigger(settings.shortcuts.toggleSidebar)) {
      e.preventDefault();
      toggleSidebar();
      return;
    }
    if (shouldTrigger(settings.shortcuts.newNote)) {
      e.preventDefault();
      createNewNote();
      return;
    }
    if (shouldTrigger(settings.shortcuts.deleteNote)) {
      e.preventDefault();
      deleteCurrentNoteWithConfirm();
      return;
    }
    if (shouldTrigger(settings.shortcuts.toggleDark)) {
      e.preventDefault();
      toggleDarkMode();
      return;
    }
    if (shouldTrigger(settings.shortcuts.openSettings)) {
      e.preventDefault();
      openSettings();
      return;
    }
    if (shouldTrigger(settings.shortcuts.export)) {
      e.preventDefault();
      exportNotesJson();
      return;
    }
    if (shouldTrigger(settings.shortcuts.lock)) {
      e.preventDefault();
      if (isCurrentNoteLocked()) {
        lockInput.focus();
      } else {
        toggleLock();
      }
      return;
    }
  });

  // ==================== 数据管理：导出 JSON ====================
  async function exportNotesJson() {
    const data = JSON.stringify(notes, null, 2);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `灵羽笔记-${currentUser}-${dateStr}-${timeStr}.json`;

    if (isTauri()) {
      const res = await saveViaTauri(filename, data, false);
      if (res.result === 'cancelled') return;
      if (res.result === 'saved') {
        showToast(`已导出到 ${res.path}`);
      }
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const result = await saveBlob(
      blob,
      filename,
      'JSON 文件',
      { mime: 'application/json', ext: '.json' }
    );

    if (result === 'cancelled') return;

    if (result === 'fallback') {
      showToast('已下载到默认目录（当前环境不支持自选路径）');
    } else {
      showToast('已导出');
    }
  }

  exportBtn.addEventListener('click', exportNotesJson);

  // ==================== 数据管理：导出 ZIP ====================
  async function exportZip() {
    if (typeof fflate === 'undefined') {
      await showAlert('未找到 fflate 库。请确保 js/fflate.min.js 存在。', { title: '导出失败' });
      return;
    }

    try {
      const files = {};

      const notesJson = JSON.stringify(notes, null, 2);
      const settingsJson = JSON.stringify(settings, null, 2);
      const notesBytes = new Blob([notesJson]).size;
      const settingsBytes = new Blob([settingsJson]).size;

      const allBgs = await bgDB.getAll();
      const userBgs = allBgs.filter(item => item.owner === currentUser);
      const wallpapers = filterWallpapersByOwner(await bgDB.getAllWallpapers());
      const allNoteImgs = await bgDB.getAllNoteImages();
      const userNoteImgs = allNoteImgs.filter(item => item.owner === currentUser);

      let bgBytesTotal = 0;
      for (const item of userBgs) {
        if (item.type === 'file' && typeof item.data === 'string') {
          const base64 = (item.data.split(',')[1]) || '';
          bgBytesTotal += Math.floor(base64.length * 0.75);
        } else {
          bgBytesTotal += 1024;
        }
      }

      let wpBytesTotal = 0;
      for (const item of wallpapers) {
        if (item.data instanceof Blob) {
          wpBytesTotal += item.data.size;
        } else {
          wpBytesTotal += item.size || 0;
        }
      }

      let niBytesTotal = 0;
      for (const img of userNoteImgs) {
        if (typeof img.data === 'string') {
          const base64 = (img.data.split(',')[1]) || '';
          niBytesTotal += Math.floor(base64.length * 0.75);
        }
      }

      const overhead = 8192;
      const totalBytes = notesBytes + settingsBytes + bgBytesTotal + wpBytesTotal + niBytesTotal + overhead;
      let doneBytes = 0;

      const useProgress = totalBytes > 1024 * 1024;

      const DATA_STAGE_MAX = 85;

      function updateDataProgress(done, total) {
        if (!useProgress || total <= 0) return;
        const ratio = Math.min(1, done / total);
        const pct = ratio * DATA_STAGE_MAX;
        progressFill.style.width = pct + '%';
        if (progressPercentEl) {
          progressPercentEl.textContent = Math.round(pct) + '%';
        }
      }

      if (useProgress) {
        showProgress('正在导出 ZIP...');
        updateProgress(0, totalBytes);
        await yieldToUI();
      }

      files['notes.json'] = fflate.strToU8(notesJson);
      files['settings.json'] = fflate.strToU8(settingsJson);
      doneBytes += notesBytes + settingsBytes;

      const avatarData = window.DB.loadAvatar(currentUser);
      if (avatarData) {
        files['avatar.jpg'] = fflate.strToU8(avatarData);
      }

      if (useProgress) {
        updateDataProgress(doneBytes, totalBytes);
        await yieldToUI();
      }

      const bgUrls = [];
      const bgThumbs = [];
      for (const item of userBgs) {
        if (item.type === 'url') {
          bgUrls.push({ id: item.id, type: 'url', data: item.data, createdAt: item.createdAt });
          doneBytes += 1024;
        } else if (item.type === 'file' && typeof item.data === 'string') {
          const ext = extFromMime((item.data.match(/^data:([^;]+);/) || [])[1]);
          const filename = `backgrounds/${item.id}.${ext}`;
          const base64 = (item.data.split(',')[1]) || '';
          try {
            const binaryStr = atob(base64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            files[filename] = bytes;
          } catch (e) {
            console.warn('背景图导出失败（base64 解码错误）：', item.id, e);
          }
          doneBytes += Math.floor(base64.length * 0.75);
        }
        if (item.thumbnail) {
          bgThumbs.push({ id: item.id, thumbnail: item.thumbnail });
        }
        if (useProgress) {
          updateDataProgress(doneBytes, totalBytes);
          await yieldToUI();
        }
      }
      if (bgUrls.length > 0) {
        files['backgrounds/urls.json'] = fflate.strToU8(JSON.stringify(bgUrls, null, 2));
      }
      if (bgThumbs.length > 0) {
        files['backgrounds/thumbnails.json'] = fflate.strToU8(JSON.stringify(bgThumbs, null, 2));
      }

      // 导出笔记内嵌图片
      const noteImgMeta = [];
      for (const img of userNoteImgs) {
        const ext = extFromMime(img.type);
        const filename = `noteImages/${img.id}.${ext}`;
        const base64 = (img.data.split(',')[1]) || '';
        try {
          const binaryStr = atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          files[filename] = bytes;
          noteImgMeta.push({
            id: img.id,
            name: img.name,
            type: img.type,
            filename: filename,
            createdAt: img.createdAt
          });
          doneBytes += Math.floor(base64.length * 0.75);
        } catch (e) {
          console.warn('笔记图片导出失败（base64 解码错误）：', img.id, e);
        }
        if (useProgress) {
          updateDataProgress(doneBytes, totalBytes);
          await yieldToUI();
        }
      }
      if (noteImgMeta.length > 0) {
        files['noteImages/meta.json'] = fflate.strToU8(JSON.stringify(noteImgMeta, null, 2));
      }

      const wpMeta = [];
      for (const item of wallpapers) {
        const ext = extFromMime(item.type);
        const filename = `wallpapers/${item.id}.${ext}`;

        if (item.data instanceof Blob) {
          const fileStartBytes = doneBytes;
          const fileSize = item.data.size;

          try {
            const bytes = await readBlobWithProgress(item.data, (received) => {
              if (useProgress) {
                updateDataProgress(fileStartBytes + received, totalBytes);
              }
            });
            files[filename] = [bytes, { level: 0 }];
          } catch (e) {
            console.warn('壁纸读取失败：', item.id, e);
          }

          doneBytes += fileSize;
        } else {
          doneBytes += item.size || 0;
        }

        wpMeta.push({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          thumbnail: item.thumbnail,
          createdAt: item.createdAt,
          filename: filename,
          owner: item.owner
        });

        if (useProgress) {
          updateDataProgress(doneBytes, totalBytes);
          await yieldToUI();
        }
      }
      files['wallpapers/meta.json'] = fflate.strToU8(JSON.stringify(wpMeta, null, 2));

      files['manifest.json'] = fflate.strToU8(JSON.stringify({
        version: ZIP_MANIFEST_VERSION,
        exportedAt: Date.now(),
        username: currentUser,
        currentBgId: settings.currentBgId,
        currentWallpaperId: currentWallpaperId
      }, null, 2));

      if (useProgress) {
        progressFill.style.width = DATA_STAGE_MAX + '%';
        if (progressPercentEl) {
          progressPercentEl.textContent = DATA_STAGE_MAX + '%';
        }
        await yieldToUI();
      }

      if (useProgress) {
        setProgressTitle('正在压缩...');
        await yieldToUI();
      }

      let zipFakeTimer = null;
      if (useProgress) {
        let fakePct = DATA_STAGE_MAX;
        zipFakeTimer = setInterval(() => {
          const remaining = 98 - fakePct;
          fakePct += Math.max(0.1, remaining * 0.06);
          if (fakePct > 98) fakePct = 98;
          updateProgress(totalBytes * (fakePct / 100), totalBytes);
        }, 120);
      }

      const zipped = await new Promise((resolve, reject) => {
        fflate.zip(files, { level: 6 }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (zipFakeTimer) {
        clearInterval(zipFakeTimer);
        zipFakeTimer = null;
      }

      if (useProgress) {
        setProgressTitle('正在写入文件...');
        updateProgress(totalBytes, totalBytes);
        await yieldToUI();
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const filename = `灵羽笔记-${currentUser}-${dateStr}-${timeStr}.zip`;

      if (isTauri()) {
        const res = await saveViaTauri(filename, zipped, true);
        if (useProgress) hideProgress();
        if (res.result === 'cancelled') return;
        if (res.result === 'saved') {
          showToast(`已导出到 ${res.path}`);
        }
        return;
      }

      const blob = new Blob([zipped], { type: 'application/zip' });
      const result = await saveBlob(
        blob,
        filename,
        'ZIP 压缩包',
        { mime: 'application/zip', ext: '.zip' }
      );

      if (useProgress) hideProgress();

      if (result === 'cancelled') return;

      if (result === 'fallback') {
        showToast('已下载到默认目录（当前环境不支持自选路径）');
      } else {
        showToast('已导出');
      }
    } catch (err) {
      hideProgress();
      console.error(err);
      await showAlert('导出 ZIP 失败：' + (err.message || '未知错误'));
    }
  }

  exportZipBtn.addEventListener('click', exportZip);

  // ==================== 数据管理：导入 JSON ====================
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const raw = JSON.parse(ev.target.result);
        if (!Array.isArray(raw)) {
          await showAlert('文件格式不正确，应为笔记数组。');
          return;
        }
        const imported = [];
        for (const item of raw) {
          if (!item || typeof item !== 'object') continue;
          const note = {
            id: typeof item.id === 'string' && item.id ? item.id : generateId(),
            title: typeof item.title === 'string' ? item.title : '',
            content: typeof item.content === 'string' ? item.content : '',
            createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
            updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
            preview: !!item.preview,
            locked: !!item.locked,
            pinned: !!item.pinned,
            category: (item.category === 'work' || item.category === 'fun' || item.category === 'other')
              ? item.category : 'other',
            deleted: !!item.deleted,
          };
          if (item.deleted && Number.isFinite(item.deletedAt)) {
            note.deletedAt = item.deletedAt;
          }
          imported.push(note);
        }
        if (imported.length === 0) {
          await showAlert('没有可导入的有效笔记。');
          return;
        }
        const overwrite = await showConfirm(
          `导入 ${imported.length} 篇笔记，是否覆盖现有笔记？\n\n点击「覆盖」：替换所有现有笔记\n点击「追加」：添加到现有笔记后`,
          { title: '导入笔记', confirmText: '覆盖', cancelText: '追加' }
        );
        if (overwrite) {
          notes = imported;
        } else {
          const existingIds = new Set(notes.map(n => n.id));
          const toAdd = imported.filter(n => !existingIds.has(n.id));
          notes = notes.concat(toAdd);
        }
        sortNotes();
        activeNoteId = notes.length > 0 ? notes[0].id : null;
        saveNotesToStorage();
        renderNoteList();
        renderEditorForActiveNote();
        await showAlert('导入完成！');
      } catch (err) {
        await showAlert('导入失败：' + err.message);
      }
    };
    reader.readAsText(file);
    importFileInput.value = '';
  });

  // ==================== 数据管理：导入 ZIP ====================
  importZipBtn.addEventListener('click', () => importZipFileInput.click());
  importZipFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    importZipFileInput.value = '';
    if (!file) return;

    if (typeof fflate === 'undefined') {
      await showAlert('未找到 fflate 库。请确保 js/fflate.min.js 存在。', { title: '导入失败' });
      return;
    }

    try {
      const buf = await file.arrayBuffer();
      const unzipped = fflate.unzipSync(new Uint8Array(buf));

      let importedNotes = null;
      if (unzipped['notes.json']) {
        const text = fflate.strFromU8(unzipped['notes.json']);
        importedNotes = JSON.parse(text);
        if (Array.isArray(importedNotes)) {
          importedNotes.forEach(n => {
            if (n.preview === undefined) n.preview = false;
            if (n.locked === undefined) n.locked = false;
            if (n.pinned === undefined) n.pinned = false;
          });
        }
      }

      let overwrite = false;
      if (importedNotes && Array.isArray(importedNotes)) {
        overwrite = await showConfirm(
          `ZIP 中包含 ${importedNotes.length} 篇笔记。\n\n点击「覆盖」：替换所有现有笔记和资源\n点击「追加」：添加到现有笔记后（资源按 ID 去重合并）`,
          { title: '导入 ZIP', confirmText: '覆盖', cancelText: '追加' }
        );

        if (overwrite) {
          const allBgs = await bgDB.getAll();
          const userBgs = allBgs.filter(item => item.owner === currentUser);
          for (const bg of userBgs) await bgDB.delete(bg.id);
          notes = importedNotes;
        } else {
          const existingIds = new Set(notes.map(n => n.id));
          const toAdd = importedNotes.filter(n => !existingIds.has(n.id));
          notes = notes.concat(toAdd);
        }
      } else {
        overwrite = await showConfirm(
          'ZIP 中不包含笔记数据。\n\n点击「覆盖」：替换所有背景/壁纸\n点击「追加」：与现有资源按 ID 去重合并',
          { title: '导入 ZIP', confirmText: '覆盖', cancelText: '追加' }
        );
      }

      if (unzipped['settings.json']) {
        try {
          const text = fflate.strFromU8(unzipped['settings.json']);
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            const defaults = window.DB.defaultSettings();
            if (parsed.shortcuts) {
              Object.assign(settings.shortcuts, parsed.shortcuts);
              delete parsed.shortcuts;
            }
            Object.assign(settings, parsed);
            for (const k in defaults.shortcuts) {
              if (!settings.shortcuts[k]) settings.shortcuts[k] = defaults.shortcuts[k];
            }
          }
        } catch (e) {}
      }

      if (unzipped['avatar.jpg']) {
        try {
          const text = fflate.strFromU8(unzipped['avatar.jpg']);
          window.DB.saveAvatar(currentUser, text);
        } catch (e) {}
      }

      // 背景图
      const bgUrlEntries = [];
      const bgFileEntries = [];
      for (const path in unzipped) {
        if (path.startsWith('backgrounds/') && path !== 'backgrounds/urls.json' && path !== 'backgrounds/thumbnails.json') {
          bgFileEntries.push({ path, data: unzipped[path] });
        }
      }
      if (unzipped['backgrounds/urls.json']) {
        try {
          const text = fflate.strFromU8(unzipped['backgrounds/urls.json']);
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) {
            for (const entry of arr) {
              bgUrlEntries.push(entry);
            }
          }
        } catch (e) {}
      }

      const thumbMap = {};
      if (unzipped['backgrounds/thumbnails.json']) {
        try {
          const text = fflate.strFromU8(unzipped['backgrounds/thumbnails.json']);
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) {
            for (const entry of arr) {
              if (entry && entry.id) thumbMap[entry.id] = entry.thumbnail;
            }
          }
        } catch (e) {}
      }

      const existingBgs = await bgDB.getAll();
      const existingBgIds = new Set(existingBgs.map(b => b.id));

      function binToDataUrl(bytes, ext, explicitMime) {
        let mime;
        if (explicitMime && typeof explicitMime === 'string') {
          mime = explicitMime;
        } else if (ext === 'png') {
          mime = 'image/png';
        } else if (ext === 'webp') {
          mime = 'image/webp';
        } else if (ext === 'gif') {
          mime = 'image/gif';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          mime = 'image/jpeg';
        } else if (ext === 'svg') {
          mime = 'image/svg+xml';
        } else if (ext === 'bin') {
          mime = 'application/octet-stream';
        } else {
          mime = 'image/jpeg';
        }
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return `data:${mime};base64,${btoa(binary)}`;
      }

      const bgToImport = [];
      for (const entry of bgUrlEntries) {
        if (!entry || !entry.id) continue;
        if (!overwrite && existingBgIds.has(entry.id)) continue;
        bgToImport.push({ kind: 'url', entry });
      }
      for (const entry of bgFileEntries) {
        const filename = entry.path.split('/').pop();
        const id = filename.replace(/\.[^.]+$/, '');
        if (!id) continue;
        if (!overwrite && existingBgIds.has(id)) continue;
        const ext = (filename.match(/\.([^.]+)$/) || [])[1] || 'jpg';
        bgToImport.push({ kind: 'file', entry, id, ext });
      }

      // 笔记内嵌图片
      const noteImgMeta = [];
      if (unzipped['noteImages/meta.json']) {
        try {
          const text = fflate.strFromU8(unzipped['noteImages/meta.json']);
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) noteImgMeta.push(...arr);
        } catch (e) {}
      }

      const existingNoteImgs = await bgDB.getAllNoteImages();
      const existingNoteImgIds = new Set(existingNoteImgs.map(i => i.id));

      const noteImgToImport = [];
      for (const meta of noteImgMeta) {
        if (!meta || !meta.id) continue;
        if (existingNoteImgIds.has(meta.id)) continue;
        const fileData = unzipped[meta.filename];
        if (!fileData) continue;
        noteImgToImport.push({ meta, fileData });
      }

      // 壁纸
      const wpMeta = [];
      if (unzipped['wallpapers/meta.json']) {
        try {
          const text = fflate.strFromU8(unzipped['wallpapers/meta.json']);
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) wpMeta.push(...arr);
        } catch (e) {}
      }

      const existingWps = await bgDB.getAllWallpapers();
      const existingWpIds = new Set(
        filterWallpapersByOwner(existingWps).map(w => w.id)
      );

      // 覆盖模式：先删掉当前用户的所有壁纸
      if (overwrite) {
        const userWps = filterWallpapersByOwner(existingWps);
        for (const wp of userWps) {
          try { await bgDB.deleteWallpaper(wp.id); } catch (e) {}
        }
      }

      const wpToImport = [];
      for (const meta of wpMeta) {
        if (!meta || !meta.id) continue;
        if (!overwrite && existingWpIds.has(meta.id)) continue;
        const fileData = unzipped[meta.filename];
        if (!fileData) continue;
        wpToImport.push({ meta, fileData });
      }

      const totalSteps = bgToImport.length + noteImgToImport.length + wpToImport.length;
      const useProgress = totalSteps >= 2;

      if (useProgress) {
        showProgress('正在导入 ZIP...');
        updateProgress(0, totalSteps);
        await yieldToUI();
      }

      let currentStep = 0;

      for (const item of bgToImport) {
        try {
          if (item.kind === 'url') {
            const entry = item.entry;
            await bgDB.add({
              id: entry.id,
              type: 'url',
              data: entry.data,
              thumbnail: thumbMap[entry.id] || null,
              createdAt: entry.createdAt || Date.now(),
              owner: currentUser
            });
          } else {
            const dataUrl = binToDataUrl(item.entry.data, item.ext);
            await bgDB.add({
              id: item.id,
              type: 'file',
              data: dataUrl,
              thumbnail: thumbMap[item.id] || null,
              createdAt: Date.now(),
              owner: currentUser
            });
          }
        } catch (e) {
          console.warn('背景图导入失败：', item, e);
        }
        currentStep++;
        if (useProgress) {
          updateProgress(currentStep, totalSteps);
          await yieldToUI();
        }
      }

      for (const item of noteImgToImport) {
        const meta = item.meta;
        const ext = extFromMime(meta.type);
        const dataUrl = binToDataUrl(item.fileData, ext, meta.type);
        try {
          await bgDB.addNoteImage({
            id: meta.id,
            name: meta.name,
            type: meta.type,
            data: dataUrl,
            createdAt: meta.createdAt || Date.now(),
            owner: currentUser
          });
        } catch (e) {
          console.warn('笔记图片导入失败：', meta.id, e);
        }
        currentStep++;
        if (useProgress) {
          updateProgress(currentStep, totalSteps);
          await yieldToUI();
        }
      }

      for (const item of wpToImport) {
        const meta = item.meta;
        const blob = new Blob([item.fileData], { type: meta.type || 'video/mp4' });
        await bgDB.addWallpaper({
          id: meta.id,
          name: meta.name,
          type: meta.type,
          size: meta.size || blob.size,
          thumbnail: meta.thumbnail,
          data: blob,
          createdAt: meta.createdAt || Date.now(),
          owner: currentUser
        });
        currentStep++;
        if (useProgress) {
          updateProgress(currentStep, totalSteps);
          await yieldToUI();
        }
      }

      sortNotes();
      activeNoteId = notes.length > 0 ? notes[0].id : null;
      saveNotesToStorage();
      saveSettingsToStorage();

      await applySettings();
      sidebarHidden = !!settings.sidebarDefaultHidden;
      if (sidebarHidden) sidebarEl.classList.add('hidden-sidebar');
      else sidebarEl.classList.remove('hidden-sidebar');

      renderNoteList();
      renderEditorForActiveNote();
      renderAvatar();
      renderWallpaperGrids();
      updateSaveDirDisplay();

      if (useProgress) hideProgress();

      await showAlert('导入完成！', { title: '成功' });
    } catch (err) {
      hideProgress();
      console.error(err);
      await showAlert('导入 ZIP 失败：' + (err.message || '未知错误'));
    }
  });

  // ==================== 数据管理：清空 ====================
  clearAllBtn.addEventListener('click', async () => {
    const ok1 = await showConfirm('确定要清空所有笔记吗？此操作不可恢复！', { confirmText: '继续', danger: true });
    if (!ok1) return;
    const ok2 = await showConfirm('再次确认：所有笔记将被永久删除。', { confirmText: '删除全部', danger: true });
    if (!ok2) return;

    for (const n of notes) {
      try {
        await cleanupNoteImages(n.content);
      } catch (e) {
        console.warn('清理笔记图片失败', e);
      }
    }

    notes = [];
    activeNoteId = null;
    saveNotesToStorage();
    renderNoteList();
    renderEditorForActiveNote();
    updateStorageUsage();
    await showAlert('所有笔记已清空', { title: '完成' });
  });

  clearGalleryBtn.addEventListener('click', async () => {
    const ok = await showConfirm('确定要清空背景图库吗？\n\n当前用户的所有背景图将被永久删除。\n（笔记内嵌图片不受影响）', { confirmText: '清空', danger: true });
    if (!ok) return;
    try {
      const allBgs = await bgDB.getAll();
      const userBgs = allBgs.filter(item => item.owner === currentUser);

      const useProgress = userBgs.length >= 2;

      if (useProgress) {
        showProgress('正在清空背景图库...');
        updateProgress(0, userBgs.length);
        await yieldToUI();
      }

      for (let i = 0; i < userBgs.length; i++) {
        await bgDB.delete(userBgs[i].id);
        if (useProgress) {
          updateProgress(i + 1, userBgs.length);
          await yieldToUI();
        }
      }

      settings.currentBgId = null;
      saveSettingsToStorage();
      await applyBackground();
      await updateBgPreview();
      updateStorageUsage();

      if (useProgress) {
        hideProgress();
      }

      await showAlert('背景图库已清空', { title: '完成' });
    } catch (err) {
      hideProgress();
      await showAlert('清空失败：' + (err.message || '未知错误'));
    }
  });

  refreshUsageBtn.addEventListener('click', updateStorageUsage);

  deleteAccountBtn.addEventListener('click', deleteAccount);

  // ==================== 清理未引用的笔记图片 ====================
  function collectReferencedImageIds() {
    const ids = new Set();
    const re = /!\[[^\]]*\]\(([^)]+)\)/g;
    for (const note of notes) {
      const content = note.content || '';
      let m;
      while ((m = re.exec(content)) !== null) {
        const id = m[1];
        if (id && !/^(https?:\/\/|data:|#|\/)/i.test(id)) {
          ids.add(id);
        }
      }
    }
    return ids;
  }

  async function cleanOrphanNoteImages() {
    try {
      const allImgs = await bgDB.getAllNoteImages();
      const userImgs = allImgs.filter(item => item.owner === currentUser);
      const referenced = collectReferencedImageIds();

      const orphans = userImgs.filter(img => !referenced.has(img.id));

      if (orphans.length === 0) {
        await showAlert('没有未引用的笔记图片', { title: '完成' });
        return;
      }

      const ok = await showConfirm(
        `找到 ${orphans.length} 张未被任何笔记引用的图片。\n\n是否删除？此操作不可恢复。`,
        { title: '清理未引用的图片', confirmText: '删除', danger: true }
      );
      if (!ok) return;

      const useProgress = orphans.length >= 2;

      if (useProgress) {
        showProgress('正在清理...');
        updateProgress(0, orphans.length);
        await yieldToUI();
      }

      for (let i = 0; i < orphans.length; i++) {
        try {
          await bgDB.deleteNoteImage(orphans[i].id);
        } catch (e) {
          console.warn('删除孤儿图片失败', orphans[i].id, e);
        }
        if (useProgress) {
          updateProgress(i + 1, orphans.length);
          await yieldToUI();
        }
      }

      if (useProgress) hideProgress();

      updateStorageUsage();
      await showAlert(`已清理 ${orphans.length} 张未引用的图片`, { title: '完成' });
    } catch (err) {
      hideProgress();
      console.error(err);
      await showAlert('清理失败：' + (err.message || '未知错误'));
    }
  }

  cleanOrphanImagesBtn.addEventListener('click', cleanOrphanNoteImages);

  // ==================== 账户：修改密码 / 恢复密钥 ====================
  changePasswordBtn.addEventListener('click', async () => {
    await showChangePasswordDialog();
  });

  viewRecoveryBtn.addEventListener('click', async () => {
    const users = getUsers();
    if (!users[currentUser]) return;
    const key = users[currentUser].recoveryKey;
    if (!key) {
      await showAlert('未找到恢复密钥');
      return;
    }
    await showRecoveryKeyDialog(key, '你的恢复密钥', '关闭');
  });

  regenRecoveryBtn.addEventListener('click', async () => {
    const ok = await showConfirm(
      '确定要重新生成恢复密钥吗？\n\n旧的恢复密钥将立即失效。\n请确保你能保存好新的密钥。',
      { confirmText: '重新生成', danger: true }
    );
    if (!ok) return;
    const users = getUsers();
    if (!users[currentUser]) return;
    const newKey = generateRecoveryKey();
    users[currentUser].recoveryKey = newKey;
    saveUsers(users);
    await showRecoveryKeyDialog(newKey, '新的恢复密钥', '我已保存');
  });

  // ==================== 主界面事件 ====================
  newNoteBtn.addEventListener('click', createNewNote);
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value;
    renderNoteList();
  });

  categoryTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;
    const cat = tab.dataset.category;
    if (cat === activeCategory) return;
    activeCategory = cat;

    categoryTabs.querySelectorAll('.category-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.category === cat);
    });

    renderNoteList();
  });

  noteTitleInput.addEventListener('input', () => {
    if (!activeNoteId) return;
    if (isCurrentNoteLocked()) return;
    updateEditorStats();
    scheduleAutoSave();
  });
  noteContentInput.addEventListener('input', () => {
    if (!activeNoteId) return;
    if (isCurrentNoteLocked()) return;
    updateEditorStats();
    scheduleAutoSave();
  });
  noteTitleInput.addEventListener('blur', () => {
    if (activeNoteId) syncEditorToActiveNote();
  });
  noteContentInput.addEventListener('blur', () => {
    if (activeNoteId) syncEditorToActiveNote();
  });

  deleteNoteBtn.addEventListener('click', deleteCurrentNoteWithConfirm);

  toggleModeBtn.addEventListener('click', toggleEditPreviewMode);

  saveBtn.addEventListener('click', () => saveActiveNote());

  lockBtn.addEventListener('click', toggleLock);
  lockUnlockBtn.addEventListener('click', tryUnlock);
  lockInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryUnlock();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      lockInput.blur();
    }
  });

  // ==================== 禁用右键菜单（保留输入框） ====================
  document.addEventListener('contextmenu', (e) => {
    const el = e.target;
    const tag = el && el.tagName;
    const isEditable = tag === 'INPUT'
      || tag === 'TEXTAREA'
      || (el && el.isContentEditable);
    if (isEditable) return;
    e.preventDefault();
  });

  // ==================== 自定义右键菜单 ====================
  let ctxTargetEl = null;
  let noteCtxNoteId = null;

  function openContextMenu(x, y, targetEl) {
    if (!customContextMenu) return;

    ctxTargetEl = targetEl;

    customContextMenu.style.left = '-9999px';
    customContextMenu.style.top = '-9999px';
    customContextMenu.classList.add('show');

    const menuRect = customContextMenu.getBoundingClientRect();
    const menuW = menuRect.width;
    const menuH = menuRect.height;

    let left = x;
    let top = y;

    if (left + menuW > window.innerWidth - 8) {
      left = window.innerWidth - menuW - 8;
    }
    if (top + menuH > window.innerHeight - 8) {
      top = y - menuH;
      if (top < 8) top = 8;
    }
    if (left < 8) left = 8;

    customContextMenu.style.left = left + 'px';
    customContextMenu.style.top = top + 'px';

    updateContextMenuState();
  }

  function closeContextMenu() {
    if (!customContextMenu) return;
    customContextMenu.classList.remove('show');
    ctxTargetEl = null;
  }

  function openNoteContextMenu(x, y, noteId) {
    if (!noteContextMenu) return;
    noteCtxNoteId = noteId;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (nctxPinLabel) {
      nctxPinLabel.textContent = note.pinned ? '取消置顶' : '置顶';
    }

    noteContextMenu.style.left = '-9999px';
    noteContextMenu.style.top = '-9999px';
    noteContextMenu.classList.add('show');

    const menuRect = noteContextMenu.getBoundingClientRect();
    const menuW = menuRect.width;
    const menuH = menuRect.height;

    let left = x;
    let top = y;

    if (left + menuW > window.innerWidth - 8) {
      left = window.innerWidth - menuW - 8;
    }
    if (top + menuH > window.innerHeight - 8) {
      top = y - menuH;
      if (top < 8) top = 8;
    }
    if (left < 8) left = 8;

    noteContextMenu.style.left = left + 'px';
    noteContextMenu.style.top = top + 'px';
  }

  function closeNoteContextMenu() {
    if (!noteContextMenu) return;
    noteContextMenu.classList.remove('show');
    noteCtxNoteId = null;
  }

  function updateContextMenuState() {
    if (!customContextMenu || !ctxTargetEl) return;

    const el = ctxTargetEl;
    const tag = el.tagName;

    let hasSelection = false;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      hasSelection = el.selectionStart !== el.selectionEnd;
    } else {
      const sel = window.getSelection();
      hasSelection = sel && sel.toString().length > 0;
    }

    const cutItem = customContextMenu.querySelector('[data-action="cut"]');
    const copyItem = customContextMenu.querySelector('[data-action="copy"]');

    if (cutItem) cutItem.classList.toggle('disabled', !hasSelection);
    if (copyItem) copyItem.classList.toggle('disabled', !hasSelection);
  }

  function execContextAction(action) {
    const el = ctxTargetEl;
    if (!el) return;

    try { el.focus(); } catch (e) {}

    switch (action) {
      case 'cut':
        try { document.execCommand('cut'); } catch (e) {}
        break;
      case 'copy':
        try { document.execCommand('copy'); } catch (e) {}
        break;
      case 'paste':
        try {
          const ok = document.execCommand('paste');
          if (!ok) {
            showToast('请使用 Ctrl+V 粘贴', TOAST_ICON_INFO, 'info');
          }
        } catch (e) {
          showToast('请使用 Ctrl+V 粘贴', TOAST_ICON_INFO, 'info');
        }
        break;
      case 'selectAll':
        try { document.execCommand('selectAll'); } catch (e) {}
        break;
    }

    closeContextMenu();
  }

  if (customContextMenu) {
    customContextMenu.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const item = e.target.closest('.ctx-item');
      if (!item) return;
      if (item.classList.contains('disabled')) return;

      const action = item.dataset.action;
      execContextAction(action);
    });

    customContextMenu.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  if (noteContextMenu) {
    noteContextMenu.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const item = e.target.closest('.nctx-item');
      if (!item) return;

      const action = item.dataset.action;
      const noteId = noteCtxNoteId;
      closeNoteContextMenu();

      if (!noteId) return;

      if (action === 'pin') {
        togglePinNote(noteId);
      } else if (action === 'cat-work') {
        setNoteCategory(noteId, 'work');
      } else if (action === 'cat-fun') {
        setNoteCategory(noteId, 'fun');
      } else if (action === 'cat-other') {
        setNoteCategory(noteId, 'other');
      } else if (action === 'export-md') {
        exportNoteAsMarkdown(noteId);      
      } else if (action === 'delete') {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        const ok = await showConfirm(`确定删除「${note.title || '无标题笔记'}」吗？`, { confirmText: '删除', danger: true });
        if (ok) deleteNoteById(noteId);
      }
    });

    noteContextMenu.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  document.addEventListener('contextmenu', (e) => {
    const el = e.target;
    const tag = el && el.tagName;

    const noteItem = el && el.closest && el.closest('.note-item');
    if (noteItem) {
      e.preventDefault();
      e.stopPropagation();
      const noteId = noteItem.dataset.noteId;
      if (noteId) {
        if (activeNoteId !== noteId) setActiveNote(noteId);
        openNoteContextMenu(e.clientX, e.clientY, noteId);
      }
      return;
    }

    const isEditableInput = tag === 'INPUT'
      || tag === 'TEXTAREA'
      || (el && el.isContentEditable);

    if (!isEditableInput) {
      e.preventDefault();
      closeContextMenu();
      return;
    }

    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, el);
  });

  document.addEventListener('mousedown', (e) => {
    if (!customContextMenu || !customContextMenu.classList.contains('show')) return;
    if (customContextMenu.contains(e.target)) return;
    closeContextMenu();
  });

  document.addEventListener('mousedown', (e) => {
    if (!noteContextMenu || !noteContextMenu.classList.contains('show')) return;
    if (noteContextMenu.contains(e.target)) return;
    closeNoteContextMenu();
  });

  document.addEventListener('wheel', () => {
    if (customContextMenu && customContextMenu.classList.contains('show')) {
      closeContextMenu();
    }
    if (noteContextMenu && noteContextMenu.classList.contains('show')) {
      closeNoteContextMenu();
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (customContextMenu && customContextMenu.classList.contains('show')) {
      closeContextMenu();
    }
    if (noteContextMenu && noteContextMenu.classList.contains('show')) {
      closeNoteContextMenu();
    }
  });

  window.addEventListener('blur', () => {
    if (customContextMenu && customContextMenu.classList.contains('show')) {
      closeContextMenu();
    }
    if (noteContextMenu && noteContextMenu.classList.contains('show')) {
      closeNoteContextMenu();
    }
  });

  // ==================== 关闭页面前双保险 ====================
  function emergencySave() {
    try {
      flushAutoSave();
    } catch (e) {
      console.warn('emergencySave flush 失败', e);
    }
    try {
      if (currentUser) {
        saveNotesToStorage();
        saveSettingsToStorage();
      }
    } catch (e) {
      console.warn('emergencySave 保存失败', e);
    }
  }

  window.addEventListener('beforeunload', () => {
    emergencySave();
    if (mainVideoObjectUrl) {
      URL.revokeObjectURL(mainVideoObjectUrl);
    }
  });

  window.addEventListener('pagehide', () => {
    emergencySave();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      emergencySave();
    }
  });

  // ==================== 登录事件 ====================
  loginSubmitBtn.addEventListener('click', handleLoginSubmit);

  loginSwitchBtn.addEventListener('click', () => {
    setLoginMode(!isRegisterMode);
    loginPassword.value = '';
    loginPassword.focus();
  });

  loginForgotBtn.addEventListener('click', async () => {
    await showForgotPasswordDialog();
  });

  loginUsername.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginPassword.focus();
    }
  });

  loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoginSubmit();
    }
  });

  logoutBtn.addEventListener('click', logout);

  // ==================== 进入应用 ====================
  async function enterApp() {
    notes = [];
    activeNoteId = null;
    searchKeyword = '';
    searchInput.value = '';

    settings = window.DB.defaultSettings();

    loadSettingsFromStorage();
    loadNotesFromStorage();

    if (notes.length === 0) {
      const now = Date.now();
      notes = [{
        id: generateId(),
        title: '我的第一篇笔记',
        content: '点击这里开始编辑...',
        createdAt: now,
        updatedAt: now,
        preview: false,
        locked: false,
        pinned: false,
      }];
      activeNoteId = notes[0].id;
      saveNotesToStorage();
    }
    if (!activeNoteId && notes.length > 0) activeNoteId = notes[0].id;

    sidebarHidden = !!settings.sidebarDefaultHidden;
    if (sidebarHidden) {
      sidebarEl.classList.add('hidden-sidebar');
    } else {
      sidebarEl.classList.remove('hidden-sidebar');
    }

    await applySettings();
    blurSlider.value = settings.blur;
    blurValue.textContent = settings.blur + '%';
    sortSelect.value = settings.sortBy;

    renderNoteList();
    renderEditorForActiveNote();
    renderAvatar();
    updateSaveDirDisplay();
    updateNoteLockStatusDisplay();

    bindRippleToAll();

    purgeExpiredTrash();

    syncWallpaperVisibility();
  }

  // ==================== 初始化 ====================
  let videoReadyObserver = null;

  async function init() {
    await bgDB.open();

    try {
      currentWallpaperId = localStorage.getItem(CURRENT_WALLPAPER_KEY) || null;
    } catch (e) {}

    const users = getUsers();
    const hasUsers = Object.keys(users).length > 0;

    applyRemember();

    await loadWallpaperVideo(currentWallpaperId);
    syncWallpaperVisibility();
    videoReadyObserver = watchVideoReady();

    if (!hasUsers) {
      setLoginMode(true);
    } else {
      setLoginMode(false);
    }

    bindRippleToAll();
    initSplash();
  }

  window.addEventListener('beforeunload', () => {
    if (videoReadyObserver) {
      try { videoReadyObserver.disconnect(); } catch (e) {}
    }
  });

  init();
})();