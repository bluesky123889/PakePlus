(function () {
  'use strict';

  const MB = window.MB;

  window.showConfirm = function (title, message, isDanger = false) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMessage');
      const cancelBtn = document.getElementById('confirmCancelBtn');
      const okBtn = document.getElementById('confirmOkBtn');

      titleEl.textContent = title;
      msgEl.textContent = message;

      if (isDanger) modal.classList.add('danger');
      else modal.classList.remove('danger');

      modal.classList.add('show');

      let settled = false;
      const settle = (v) => { if (!settled) { settled = true; resolve(v); } };
      const handleCancel = () => { modal.classList.remove('show'); cleanup(); settle(false); };
      const handleOk = () => { modal.classList.remove('show'); cleanup(); settle(true); };
      const cleanup = () => {
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleOk);
        modal.removeEventListener('click', handleOverlay);
      };
      const handleOverlay = (e) => { if (e.target === modal) handleCancel(); };

      cancelBtn.addEventListener('click', handleCancel);
      okBtn.addEventListener('click', handleOk);
      modal.addEventListener('click', handleOverlay);
    });
  };

  const Ripple = (function () {
    const SELECTORS = [
      '.ctrl-btn', '.icon-btn', '.play-btn', '.loop-btn', '.list-btn', '.volume-btn',
      '.pl-back-btn', '.pl-sort-btn', '.pl-more-btn', '.pl-menu-item', '.btn-primary',
      '.btn-outline', '.btn-danger', '.pl-item', '.bg-source-btn', '.nav-item',
      '.shortcut-key-btn', '.gallery-item', '.offset-btn', '.image-preview-close',
      '.modal-close-btn', '.stats-tab'
    ];
    const SELECTOR_STR = SELECTORS.join(',');

    function createRipple(e, host) {
      if (host._rippleLock) return;
      const rect = host.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height);
      if (diameter <= 0) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = diameter + 'px';
      ripple.style.left = (x - diameter / 2) + 'px';
      ripple.style.top = (y - diameter / 2) + 'px';
      host.classList.add('ripple-host');
      host.appendChild(ripple);
      const cleanup = () => { ripple.remove(); host._rippleLock = false; };
      ripple.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 700);
      host._rippleLock = true;
    }

    function bind() {
      document.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const host = e.target.closest(SELECTOR_STR);
        if (!host || host.disabled || host.getAttribute('aria-disabled') === 'true') return;
        createRipple(e, host);
      }, { passive: true });
    }
    return { bind };
  })();

  const listBtn = document.getElementById('listBtn');
  const playlistScreen = document.getElementById('playlistScreen');
  const plCloseBtn = document.getElementById('plCloseBtn');
  const plListScroller = document.getElementById('plListScroller');
  const plListPhantom = document.getElementById('plListPhantom');
  const plList = document.getElementById('plList');
  const plSortBtn = document.getElementById('plSortBtn');
  const plNowPlaying = document.getElementById('plNowPlaying');
  const npName = document.getElementById('npName');
  const plSearchInput = document.getElementById('plSearchInput');
  const plSearchClear = document.getElementById('plSearchClear');
  const plLocateBtn = document.getElementById('plLocateBtn');
  const lrcFileInput = document.getElementById('lrcFileInput');

  const storageCount = document.getElementById('storageCount');
  const storageSize = document.getElementById('storageSize');
  const dashCount = document.getElementById('dashCount');
  const dashSize = document.getElementById('dashSize');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const clearAllBtnData = document.getElementById('clearAllBtnData');

  const editModal = document.getElementById('editModal');
  const editCoverPreview = document.getElementById('editCoverPreview');
  const editUploadCoverBtn = document.getElementById('editUploadCoverBtn');
  const editCoverInput = document.getElementById('editCoverInput');
  const editTitleInput = document.getElementById('editTitleInput');
  const editArtistInput = document.getElementById('editArtistInput');
  const editAlbumInput = document.getElementById('editAlbumInput');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editSaveBtn = document.getElementById('editSaveBtn');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const rememberProgress = document.getElementById('rememberProgress');
  const restoreLastTrack = document.getElementById('restoreLastTrack');
  const autoPlayOnStart = document.getElementById('autoPlayOnStart');
  const resetPlaySettingsBtn = document.getElementById('resetPlaySettingsBtn');

  const shortcutList = document.getElementById('shortcutList');
  const resetShortcutsBtn = document.getElementById('resetShortcutsBtn');
  const showUiShortcuts = document.getElementById('showUiShortcuts');

  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const dataFileInput = document.getElementById('dataFileInput');
  const exportZipBtn = document.getElementById('exportZipBtn');
  const importZipBtn = document.getElementById('importZipBtn');
  const zipFileInput = document.getElementById('zipFileInput');

  const dataProgressWrap = document.getElementById('dataProgressWrap');
  const dataProgressLabel = document.getElementById('dataProgressLabel');
  const dataProgressFill = document.getElementById('dataProgressFill');
  const restoreReportModal = document.getElementById('restoreReportModal');
  const reportSuccessCount = document.getElementById('reportSuccessCount');
  const reportFailCount = document.getElementById('reportFailCount');
  const reportFailList = document.getElementById('reportFailList');
  const reportEmptyMsg = document.getElementById('reportEmptyMsg');
  const closeReportBtn = document.getElementById('closeReportBtn');

  const dropOverlay = document.getElementById('dropOverlay');

  // 统计 DOM
  const statsTabs = document.querySelectorAll('.stats-tab');
  const statsTitle = document.getElementById('statsTitle');
  const statsDate = document.getElementById('statsDate');
  const statsTime = document.getElementById('statsTime');
  const statsCount = document.getElementById('statsCount');

  let currentStatsPeriod = 'day';
  let editingTrackId = null;
  let editingCoverBase64 = null;
  let recordingAction = null;
  let virtualList = null;
  let closeTimer = null;

  function openPlaylist() {
    clearTimeout(closeTimer);
    playlistScreen.classList.add('show');
    renderPlaylist(false);
  }

  function closePlaylist() {
    playlistScreen.classList.remove('show');
    
    document.querySelectorAll('.pl-menu.show').forEach(m => {
      m.classList.remove('show');
      if (m.previousElementSibling) m.previousElementSibling.classList.remove('active');
    });

    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (virtualList) {
        virtualList.destroy();
        virtualList = null;
      }
    }, 400);
  }

  // ============ 统计面板渲染 ============
  function formatStatsTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)} 秒`;
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remainM = m % 60;
      return remainM > 0 ? `${h} 小时 ${remainM} 分钟` : `${h} 小时`;
    }
    return `${m} 分钟`;
  }

  function renderStats() {
    if (!statsTitle) return;
    const data = MB.getStats(currentStatsPeriod);
    statsTitle.textContent = data.title;
    statsDate.textContent = data.dateLabel;
    statsTime.textContent = formatStatsTime(data.totalSeconds);
    statsCount.textContent = `${data.totalCount} 次`;
  }

  statsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statsTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatsPeriod = tab.dataset.period;
      renderStats();
    });
  });

  // ============ 单项 DOM 生成器 ============
  function renderPlaylistItemDOM(song, realIndex) {
    const isCurrent = realIndex === MB.currentIndex;
    const playCount = song.playCount || 0;
    const hasMeta = song.album || song.year || song.genre ? '有元数据' : '无元数据';

    const div = document.createElement('div');
    div.className = 'pl-item' + (isCurrent ? ' active' : '');
    div.dataset.index = realIndex;
    div.draggable = true;
    div.innerHTML = `
      <div class="pl-index">${realIndex + 1}</div>
      <div class="pl-thumb"><img src="${song.cover || MB.DEFAULT_COVER}" alt="" loading="lazy" decoding="async"></div>
      <div class="pl-meta">
        <div class="pl-name" style="${isCurrent ? 'color: #38bdf8;' : ''}">${MB.escapeHtml(song.title || '未知标题')}</div>
        <div class="pl-sub">
          <span>${MB.escapeHtml(song.artist || '未知艺术家')}</span>
          <span class="dot"></span>
          <span>播放 ${playCount} 次</span>
          <span class="dot"></span>
          <span>${hasMeta}</span>
        </div>
      </div>
      <div class="pl-duration">${song.duration ? MB.formatTime(song.duration) : '0:00'}</div>
      <div class="pl-actions">
        <button class="pl-more-btn" title="更多操作">
          <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor;">
            <circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle>
          </svg>
        </button>
        <div class="pl-menu">
          <button class="pl-menu-item" data-edit="${song.id}">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            编辑信息
          </button>
          <button class="pl-menu-item" data-import-lrc="${song.id}">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            导入歌词
          </button>
          <button class="pl-menu-item danger" data-del="${realIndex}">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
            删除歌曲
          </button>
        </div>
      </div>
    `;
    return div;
  }

  // ============ 虚拟列表绑定 ============
  function ensureVirtualList() {
    if (virtualList) return virtualList;
    virtualList = window.PlaylistVirtual.createVirtualList(
      plListScroller,
      plList,
      plListPhantom,
      (song, index) => {
        const realIdx = MB.playlist.findIndex(s => s.id === song.id);
        return renderPlaylistItemDOM(song, realIdx >= 0 ? realIdx : index);
      }
    );
    return virtualList;
  }

  function renderPlaylist(skipAnimation) {
    const playlist = MB.playlist;

    if (playlist.length === 0) {
      if (virtualList) { virtualList.destroy(); virtualList = null; }
      plList.innerHTML = '<div class="pl-empty">播放列表为空<br>请在设置 → 音乐 中导入音乐</div>';
      plNowPlaying.style.display = 'none';
      plListPhantom.style.height = '0px';
      return;
    }

    plNowPlaying.style.display = 'flex';
    const currentSong = playlist[MB.currentIndex];
    if (currentSong) npName.textContent = currentSong.title || '未知标题';

    let filtered = playlist;
    if (MB.searchKeyword.trim()) {
      const kw = MB.searchKeyword.trim().toLowerCase();
      filtered = playlist.filter(s => {
        let py = s.pinyin;
        if (!py) {
          py = {
            title: MB.buildPinyinIndex(s.title || ''),
            artist: MB.buildPinyinIndex(s.artist || ''),
            album: s.album ? MB.buildPinyinIndex(s.album) : { full: '', initials: '' }
          };
          s.pinyin = py;
        }
        return (
          MB.matchSearch(s.title || '', kw, py.title) ||
          MB.matchSearch(s.artist || '', kw, py.artist) ||
          MB.matchSearch(s.album || '', kw, py.album)
        );
      });
    }

    if (filtered.length === 0) {
      if (virtualList) { virtualList.destroy(); virtualList = null; }
      plList.innerHTML = '<div class="pl-empty">没有找到匹配的歌曲</div>';
      plListPhantom.style.height = '0px';
      return;
    }

    const vl = ensureVirtualList();
    vl.setData(filtered, !!MB.searchKeyword.trim());
    bindVirtualEvents(vl);
  }

  // ============ 事件委托 ============
  let virtualEventsBound = false;
  let autoScrollRaf = null;

  function bindVirtualEvents(vl) {
    if (virtualEventsBound) return;
    virtualEventsBound = true;

    let draggedEl = null;
    let draggedRealIndex = -1;

    function stopAutoScroll() {
      if (autoScrollRaf) {
        cancelAnimationFrame(autoScrollRaf);
        autoScrollRaf = null;
      }
    }

    plList.addEventListener('dragstart', (e) => {
      const el = e.target.closest('.pl-item');
      if (!el) return;
      if (MB.searchKeyword.trim() !== '') {
        e.preventDefault();
        MB.showToast('请在清除搜索后拖拽排序', true);
        return;
      }
      draggedEl = el;
      draggedRealIndex = parseInt(el.dataset.index, 10);
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(draggedRealIndex));
    });

    plList.addEventListener('dragend', () => {
      if (draggedEl) draggedEl.classList.remove('dragging');
      plList.querySelectorAll('.pl-item').forEach(i => i.classList.remove('drag-over'));
      draggedEl = null;
      draggedRealIndex = -1;
      stopAutoScroll();
    });

    plList.addEventListener('dragover', (e) => {
      const el = e.target.closest('.pl-item');
      if (!el) return;
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (el !== draggedEl) el.classList.add('drag-over');

      const scrollerRect = plListScroller.getBoundingClientRect();
      const mouseY = e.clientY;
      
      const threshold = 60;
      let scrollSpeed = 0;

      if (mouseY - scrollerRect.top < threshold) {
        const ratio = Math.max(0, (mouseY - scrollerRect.top) / threshold);
        scrollSpeed = -15 * (1 - ratio) - 3;
      } else if (scrollerRect.bottom - mouseY < threshold) {
        const ratio = Math.max(0, (scrollerRect.bottom - mouseY) / threshold);
        scrollSpeed = 15 * (1 - ratio) + 3;
      }

      if (scrollSpeed !== 0) {
        if (!autoScrollRaf) {
          const step = () => {
            if (scrollSpeed !== 0) {
              plListScroller.scrollTop += scrollSpeed;
              autoScrollRaf = requestAnimationFrame(step);
            } else {
              autoScrollRaf = null;
            }
          };
          autoScrollRaf = requestAnimationFrame(step);
        }
      } else {
        stopAutoScroll();
      }
    });

    plList.addEventListener('dragleave', (e) => {
      if (!plListScroller.contains(e.relatedTarget)) {
        stopAutoScroll();
      }
      const el = e.target.closest('.pl-item');
      if (el) el.classList.remove('drag-over');
    });

    plList.addEventListener('drop', async (e) => {
      stopAutoScroll();
      const el = e.target.closest('.pl-item');
      if (!el) return;
      e.preventDefault();
      el.classList.remove('drag-over');
      if (draggedEl === el || draggedRealIndex < 0) return;
      const toRealIndex = parseInt(el.dataset.index, 10);
      await reorderPlaylist(draggedRealIndex, toRealIndex);
    });
  }

  async function reorderPlaylist(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const movedItem = MB.playlist.splice(fromIdx, 1)[0];
    MB.playlist.splice(toIdx, 0, movedItem);

    if (MB.currentIndex === fromIdx) {
      MB.currentIndex = toIdx;
    } else if (fromIdx < MB.currentIndex && toIdx >= MB.currentIndex) {
      MB.currentIndex--;
    } else if (fromIdx > MB.currentIndex && toIdx <= MB.currentIndex) {
      MB.currentIndex++;
    }

    try {
      const baseTime = Date.now();
      for (let i = 0; i < MB.playlist.length; i++) {
        const song = MB.playlist[i];
        if (song.createdAt !== baseTime + i) {
          song.createdAt = baseTime + i;
          const rec = await MB.idbGet(MB.STORE_TRACKS, song.id);
          if (rec) {
            rec.createdAt = song.createdAt;
            await MB.idbPut(MB.STORE_TRACKS, rec);
          }
        }
      }
      renderPlaylist(true);
    } catch (err) {
      console.error('排序保存失败', err);
      MB.showToast('排序保存失败', true);
    }
  }

  function updateCurrentHighlight() {
    const currentSong = MB.playlist[MB.currentIndex];
    if (!currentSong) return;
    if (npName) npName.textContent = currentSong.title || '未知标题';
    if (!virtualList) return;

    for (const [idx, el] of virtualList.mountedMap) {
      const song = virtualList.items[idx];
      if (!song) continue;
      const realIdx = MB.playlist.findIndex(s => s.id === song.id);
      const isCurrent = realIdx === MB.currentIndex;
      el.classList.toggle('active', isCurrent);
      const nameEl = el.querySelector('.pl-name');
      if (nameEl) nameEl.style.color = isCurrent ? '#38bdf8' : '';
    }
  }

  function updateSortBtnUI() {
    const asc = MB.playSettings.defaultSortOrder === 'asc';
    plSortBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2;">
        ${asc ? '<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>' : '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>'}
      </svg>
      ${asc ? '正序' : '倒序'}
    `;
  }

  function updateStorageInfo() {
    const totalSize = MB.playlist.reduce((sum, s) => sum + (s.size || 0), 0);
    storageCount.textContent = `已导入 ${MB.playlist.length} 首`;
    storageSize.textContent = `占用 ${MB.formatBytes(totalSize)}`;
    if (dashCount) dashCount.textContent = `${MB.playlist.length} 首`;
    if (dashSize) dashSize.textContent = MB.formatBytes(totalSize);
    if (clearAllBtn) clearAllBtn.disabled = MB.playlist.length === 0;
    if (clearAllBtnData) clearAllBtnData.disabled = MB.playlist.length === 0;
  }

  async function refreshPlaylistFromDB() {
    try {
      const tracks = await MB.idbGetAll(MB.STORE_TRACKS);
      const sorted = tracks.slice().sort((a, b) =>
        MB.playSettings.defaultSortOrder === 'desc' ?
        (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0)
      );
      MB.playlist = sorted.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album || null,
        year: t.year || null,
        genre: t.genre || null,
        track: t.track || null,
        duration: t.duration,
        cover: t.cover || MB.DEFAULT_COVER,
        source: t.source || 'local',
        filePath: t.filePath || null,
        createdAt: t.createdAt,
        size: t.size,
        lyrics: t.lyrics || null,
        playCount: t.playCount || 0,
        lastPlayedAt: t.lastPlayedAt || null,
        pinyin: t.pinyin || null
      }));
      if (MB.currentIndex >= MB.playlist.length) MB.currentIndex = Math.max(0, MB.playlist.length - 1);
      renderPlaylist(true);
      updateStorageInfo();
    } catch (err) {
      console.error('refreshPlaylistFromDB failed', err);
    }
  }

  async function migratePinyinIndex() {
    const MIGRATED_KEY = 'melodybox_pinyin_migrated_v1';
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const lib = window.pinyinPro || window.PinyinPro || window.pinyin;
    if (!lib || typeof lib.pinyin !== 'function') return;
    try {
      const tracks = await MB.idbGetAll(MB.STORE_TRACKS);
      let updated = 0;
      for (const t of tracks) {
        if (t.pinyin && t.pinyin.title && t.pinyin.artist) continue;
        const rec = await MB.idbGet(MB.STORE_TRACKS, t.id);
        if (!rec) continue;
        rec.pinyin = {
          title: MB.buildPinyinIndex(rec.title || ''),
          artist: MB.buildPinyinIndex(rec.artist || ''),
          album: rec.album ? MB.buildPinyinIndex(rec.album) : { full: '', initials: '' }
        };
        await MB.idbPut(MB.STORE_TRACKS, rec);
        updated++;
      }
      if (updated > 0) {
        console.log(`[拼音迁移] 已为 ${updated} 首歌曲补充拼音索引`);
        await refreshPlaylistFromDB();
      }
      localStorage.setItem(MIGRATED_KEY, '1');
    } catch (e) {
      console.warn('拼音迁移失败', e);
    }
  }

  const pickFolderBtn = document.getElementById('pickFolderBtn');
  const pickFolderHint = document.getElementById('pickFolderHint');
  const currentFolderPathEl = document.getElementById('currentFolderPath');
  const FOLDER_PATH_KEY = 'melodybox_last_folder_path';

  function updateFolderPathUI(path) {
    if (!currentFolderPathEl) return;
    if (path) {
      currentFolderPathEl.textContent = path;
      currentFolderPathEl.style.display = 'inline-block';
      currentFolderPathEl.title = path;
      try { localStorage.setItem(FOLDER_PATH_KEY, path); } catch (e) {}
    } else {
      currentFolderPathEl.textContent = '尚未选择文件夹';
      currentFolderPathEl.style.display = 'none';
      try { localStorage.removeItem(FOLDER_PATH_KEY); } catch (e) {}
    }
  }

  try {
    const lastPath = localStorage.getItem(FOLDER_PATH_KEY);
    if (lastPath) updateFolderPathUI(lastPath);
  } catch (e) {}

  if (pickFolderBtn) {
    pickFolderBtn.addEventListener('click', async () => {
      if (!window.__TAURI__ || !window.__TAURI__.dialog || !window.__TAURI__.fs) {
        MB.showToast('当前环境不支持文件夹引用', true);
        return;
      }
      try {
        const selected = await window.__TAURI__.dialog.open({
          directory: true, multiple: false, title: '请选择音乐文件夹'
        });
        if (!selected) return;
        updateFolderPathUI(selected);
        pickFolderHint.textContent = '正在扫描...';
        const audioExts = /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i;
        const collected = [];
        async function walk(dir) {
          const entries = await window.__TAURI__.fs.readDir(dir, { dir: 'ltr' });
          for (const entry of entries) {
            const name = entry.name;
            const path = dir.replace(/[/\\]$/, '') + '/' + name;
            const isDir = entry.isDirectory !== undefined ? entry.isDirectory : (!audioExts.test(name) && name.indexOf('.') === -1);
            if (isDir) await walk(path);
            else if (audioExts.test(name)) collected.push({ name: name, path: path, size: entry.size || 0 });
          }
        }
        await walk(selected);
        if (collected.length === 0) {
          pickFolderHint.textContent = '未发现音频文件';
          MB.showToast('该文件夹内没有音频文件', true);
          return;
        }
        pickFolderHint.textContent = `扫描到 ${collected.length} 首，正在解析标签入库...`;
        let added = 0;
        
        for (const file of collected) {
          try {
            const trackId = 'folder-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
            const parsed = MB.parseArtistTitleFromName(file.name);
            
            let title = parsed.title || MB.titleFromFileName(file.name);
            let artist = parsed.artist || '未知艺术家';
            let album = null, year = null, genre = null, track = null;
            let cover = MB.DEFAULT_COVER;
            let lyrics = '';
            let duration = 0;
            const source = 'folder';

            try {
              const buffer = await window.__TAURI__.fs.readFile(file.path); 
              const blob = new Blob([buffer], { type: 'audio/mpeg' });
              duration = await MB.readDuration(blob);
              const virtualFile = new File([blob], file.name, { type: 'audio/mpeg' });
              const tags = await MB.parseTags(virtualFile);
              if (tags) {
                title = tags.title || title;
                artist = tags.artist || artist;
                album = tags.album || null;
                year = tags.year || null;
                genre = tags.genre || null;
                track = tags.track || null;
                lyrics = tags.lyrics || '';
                cover = tags.cover || MB.DEFAULT_COVER;
              }
            } catch (readErr) {
              console.warn('读取临时元数据失败，仅使用路径:', readErr);
            }

            const titlePinyin = MB.buildPinyinIndex(title);
            const artistPinyin = MB.buildPinyinIndex(artist);
            const albumPinyin = album ? MB.buildPinyinIndex(album) : { full: '', initials: '' };

            const trackData = {
              id: trackId,
              title: title,
              artist: artist,
              album: album,
              year: year,
              genre: genre,
              track: track,
              duration: duration,
              cover: cover,
              source: source,
              filePath: file.path,
              size: file.size || 0,
              mimeType: 'audio/mpeg',
              lyrics: lyrics,
              pinyin: { title: titlePinyin, artist: artistPinyin, album: albumPinyin },
              createdAt: Date.now(),
              lastPlayedAt: null,
              playCount: 0
            };

            await MB.idbPut(MB.STORE_TRACKS, trackData);
            added++;
          } catch (e) {
            console.warn('入库失败:', file.name, e);
          }
        }
        await refreshPlaylistFromDB();
        pickFolderHint.textContent = `已引用 ${added} 首`;
        MB.showToast(`成功引用 ${added} 首本地歌曲`);
        setTimeout(() => { pickFolderHint.textContent = ''; }, 3000);
      } catch (err) {
        console.error('文件夹扫描失败:', err);
        pickFolderHint.textContent = '读取失败';
        MB.showToast('读取文件夹失败，请检查权限', true);
      }
    });
  }

  function openEditModal(song) {
    editingTrackId = song.id;
    editingCoverBase64 = song.cover || MB.DEFAULT_COVER;
    editTitleInput.value = song.title || '';
    editArtistInput.value = song.artist || '';
    editAlbumInput.value = song.album || '';
    editCoverPreview.innerHTML = `<img src="${editingCoverBase64}" alt="cover">`;
    editModal.classList.add('show');
  }

  function closeEditModal() {
    editModal.classList.remove('show');
    editingTrackId = null;
    editingCoverBase64 = null;
  }

  editUploadCoverBtn.addEventListener('click', () => editCoverInput.click());
  editCoverInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editingCoverBase64 = reader.result;
      editCoverPreview.innerHTML = `<img src="${editingCoverBase64}" alt="cover">`;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  editCancelBtn.addEventListener('click', closeEditModal);
  editSaveBtn.addEventListener('click', async () => {
    if (!editingTrackId) return;
    try {
      const rec = await MB.idbGet(MB.STORE_TRACKS, editingTrackId);
      if (!rec) throw new Error('记录不存在');
      rec.title = editTitleInput.value.trim() || '未知标题';
      rec.artist = editArtistInput.value.trim() || '未知艺术家';
      rec.album = editAlbumInput.value.trim() || null;
      rec.cover = editingCoverBase64;
      rec.pinyin = {
        title: MB.buildPinyinIndex(rec.title),
        artist: MB.buildPinyinIndex(rec.artist),
        album: rec.album ? MB.buildPinyinIndex(rec.album) : { full: '', initials: '' }
      };
      await MB.idbPut(MB.STORE_TRACKS, rec);

      const idx = MB.playlist.findIndex(s => s.id === editingTrackId);
      if (idx >= 0) {
        MB.playlist[idx] = {
          ...MB.playlist[idx],
          title: rec.title, artist: rec.artist, album: rec.album, cover: rec.cover,
          pinyin: rec.pinyin
        };
        if (idx === MB.currentIndex) {
          document.getElementById('songTitle').textContent = rec.title;
          document.getElementById('artistName').textContent = rec.artist;
          document.getElementById('coverImage').src = rec.cover;
        }
      }
      renderPlaylist(true);
      closeEditModal();
      MB.showToast('歌曲信息已更新');
    } catch (err) {
      console.error(err);
      MB.showToast('保存失败', true);
    }
  });

  editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

  function syncPlaySettingsUI() {
    rememberProgress.checked = !!MB.playSettings.rememberProgress;
    restoreLastTrack.checked = !!MB.playSettings.restoreLastTrack;
    autoPlayOnStart.checked = !!MB.playSettings.autoPlayOnStart;
  }

  rememberProgress.addEventListener('change', () => {
    MB.playSettings.rememberProgress = rememberProgress.checked;
    MB.savePlaySettings();
    if (!MB.playSettings.rememberProgress) { try { localStorage.removeItem('melodybox_progress'); } catch (e) {} }
    MB.showToast(MB.playSettings.rememberProgress ? '已开启记住进度' : '已关闭记住进度');
  });

  restoreLastTrack.addEventListener('change', () => {
    MB.playSettings.restoreLastTrack = restoreLastTrack.checked;
    MB.savePlaySettings();
    MB.showToast(MB.playSettings.restoreLastTrack ? '启动时恢复上次歌曲' : '启动时不恢复');
  });

  autoPlayOnStart.addEventListener('change', () => {
    MB.playSettings.autoPlayOnStart = autoPlayOnStart.checked;
    MB.savePlaySettings();
    MB.showToast(MB.playSettings.autoPlayOnStart ? '启动时将自动播放' : '启动时保持暂停');
  });

  resetPlaySettingsBtn.addEventListener('click', () => {
    MB.playSettings.rememberProgress = true;
    MB.playSettings.restoreLastTrack = true;
    MB.playSettings.autoPlayOnStart = false;
    MB.savePlaySettings();
    syncPlaySettingsUI();
    MB.showToast('已恢复默认行为设置');
  });

  function syncShortcutBadges() {
    const mapping = { 'playBtn': 'playPause', 'prevBtn': 'prevTrack', 'nextBtn': 'nextTrack', 'loopBtn': 'toggleLoopMode', 'muteBtn': 'mute', 'listBtn': 'openPlaylist' };
    const isShow = MB.playSettings.showUiShortcuts !== false;
    document.querySelectorAll('.shortcut-badge').forEach(el => el.remove());

    for (const [btnId, action] of Object.entries(mapping)) {
      const btn = document.getElementById(btnId);
      if (!btn) continue;
      const shortcutText = MB.formatShortcut(MB.shortcuts[action]);
      if (!shortcutText || shortcutText === '未绑定') continue;
      const badge = document.createElement('span');
      badge.className = 'shortcut-badge';
      badge.textContent = shortcutText.split(' + ').pop();
      badge.dataset.target = btnId;
      badge.style.display = isShow ? 'block' : 'none';
      const parent = btn.parentElement;
      parent.style.position = 'relative';
      parent.appendChild(badge);
      const left = btn.offsetLeft + (btn.offsetWidth / 2);
      badge.style.left = `${left}px`;
    }
    if (showUiShortcuts) showUiShortcuts.checked = isShow;
  }

  window.addEventListener('resize', () => {
    document.querySelectorAll('.shortcut-badge').forEach(badge => {
      const btn = document.getElementById(badge.dataset.target);
      if (btn) badge.style.left = `${btn.offsetLeft + (btn.offsetWidth / 2)}px`;
    });
  });

  function renderShortcutList() {
    const labels = MB.SHORTCUT_LABELS;
    if (!shortcutList) return;
    shortcutList.innerHTML = Object.keys(labels).map(action => {
      const sc = MB.shortcuts[action];
      const isRecording = recordingAction === action;
      return `<div class="shortcut-row">
          <span class="shortcut-name">${labels[action]}</span>
          <button class="shortcut-key-btn ${isRecording ? 'recording' : ''}" data-action="${action}" type="button">
            ${isRecording ? '按下新组合键…' : MB.formatShortcut(sc)}
          </button>
        </div>`;
    }).join('');
  }

  if (shortcutList) {
    shortcutList.addEventListener('click', (e) => {
      const btn = e.target.closest('.shortcut-key-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      if (recordingAction === action) { recordingAction = null; renderShortcutList(); return; }
      recordingAction = action; renderShortcutList();
      const newBtn = shortcutList.querySelector(`[data-action="${action}"]`);
      newBtn?.focus();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!recordingAction) return;
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); recordingAction = null; renderShortcutList(); return; }
    if (['ControlLeft','ControlRight','ShiftLeft','ShiftRight','AltLeft','AltRight','MetaLeft','MetaRight'].includes(e.code)) return;
    e.preventDefault(); e.stopPropagation();
    const candidate = { code: e.code, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey };
    const conflictAction = Object.keys(MB.shortcuts).find(a => a !== recordingAction && MB.matchShortcut(e, MB.shortcuts[a]));
    if (conflictAction) {
      MB.showToast(`与「${MB.SHORTCUT_LABELS[conflictAction]}」冲突`, true);
      const curBtn = shortcutList.querySelector(`[data-action="${recordingAction}"]`);
      curBtn?.classList.add('conflict');
      setTimeout(() => curBtn?.classList.remove('conflict'), 600);
      return;
    }
    MB.shortcuts[recordingAction] = candidate;
    MB.saveShortcuts();
    MB.showToast(`已绑定「${MB.SHORTCUT_LABELS[recordingAction]}」`);
    recordingAction = null;
    renderShortcutList();
    syncShortcutBadges();
  }, true);

  if (resetShortcutsBtn) {
    resetShortcutsBtn.addEventListener('click', async () => {
      if (!(await window.showConfirm('恢复默认', '确定恢复默认快捷键吗？', false))) return;
      MB.resetShortcuts();
      renderShortcutList();
      syncShortcutBadges();
      MB.showToast('已恢复默认快捷键');
    });
  }

  if (showUiShortcuts) {
    showUiShortcuts.addEventListener('change', () => {
      MB.playSettings.showUiShortcuts = showUiShortcuts.checked;
      MB.savePlaySettings();
      syncShortcutBadges();
    });
  }

  settingsBtn.addEventListener('click', () => settingsModal.classList.add('show'));
  closeModalBtn.addEventListener('click', () => settingsModal.classList.remove('show'));
  settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('show'); });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const pane = document.getElementById(item.dataset.target);
      if (pane) pane.classList.add('active');
      
      if (item.dataset.target === 'tab-stats') {
        renderStats();
      }
    });
  });

  plSearchInput.addEventListener('input', (e) => {
    MB.searchKeyword = e.target.value;
    plSearchClear.style.display = MB.searchKeyword.trim() ? 'block' : 'none';
    renderPlaylist(true);
  });

  plSearchClear.addEventListener('click', () => {
    plSearchInput.value = '';
    MB.searchKeyword = '';
    plSearchClear.style.display = 'none';
    renderPlaylist(true);
    plSearchInput.focus();
  });

  plLocateBtn.addEventListener('click', () => {
    if (MB.searchKeyword.trim()) {
      MB.searchKeyword = '';
      plSearchInput.value = '';
      plSearchClear.style.display = 'none';
      renderPlaylist(true);
    }
    const currentSong = MB.playlist[MB.currentIndex];
    if (!currentSong) { MB.showToast('当前没有正在播放的歌曲', true); return; }
    if (!virtualList) return;
    const idx = virtualList.items.findIndex(s => s.id === currentSong.id);
    if (idx < 0) { MB.showToast('当前歌曲不在列表中', true); return; }
    virtualList.flashIndex(idx);
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.pl-menu') || 
        e.target.closest('.pl-actions') || 
        e.target.closest('.pl-more-btn')) {
      return;
    }
    
    document.querySelectorAll('.pl-menu.show').forEach(m => {
      m.classList.remove('show');
      if (m.previousElementSibling) {
        m.previousElementSibling.classList.remove('active');
      }
    });
  });

  plList.addEventListener('click', async (e) => {
    const moreBtn = e.target.closest('.pl-more-btn');
    if (moreBtn) {
      e.stopPropagation(); 
      e.preventDefault();
      
      const menu = moreBtn.nextElementSibling;
      const isShowing = menu.classList.contains('show');
      
      document.querySelectorAll('.pl-menu.show').forEach(m => {
        m.classList.remove('show');
        if (m.previousElementSibling) m.previousElementSibling.classList.remove('active');
      });
      
      if (!isShowing) {
        menu.classList.add('show'); 
        moreBtn.classList.add('active');
        
        const rect = moreBtn.getBoundingClientRect();
        if (window.innerHeight - rect.bottom < 180) {
          menu.style.top = 'auto';
          menu.style.bottom = '100%';
          menu.style.marginBottom = '8px';
          menu.style.marginTop = '0';
        } else {
          menu.style.top = '100%';
          menu.style.bottom = 'auto';
          menu.style.marginTop = '8px';
          menu.style.marginBottom = '0';
        }
      }
      return;
    }

    const delBtn = e.target.closest('[data-del]');
    if (delBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      const idx = parseInt(delBtn.dataset.del, 10);
      const song = MB.playlist[idx];
      if (!song) return;
      if (!(await window.showConfirm('删除歌曲', `确定删除《${song.title}》吗？此操作不可恢复。`, true))) return;
      
      try {
        await MB.idbDelete(MB.STORE_TRACKS, song.id);
        await MB.idbDelete(MB.STORE_AUDIO, song.id);
        MB.showToast('已删除：' + song.title);
        const wasCurrent = idx === MB.currentIndex;
        const audio = MB.player.getAudio();
        const wasPlaying = !audio.paused;
        await refreshPlaylistFromDB();
        if (MB.playlist.length === 0) await MB.player.loadSong(0, false);
        else if (wasCurrent) {
          if (MB.currentIndex >= MB.playlist.length) MB.currentIndex = Math.max(0, MB.playlist.length - 1);
          await MB.player.loadSong(MB.currentIndex, wasPlaying);
        }
      } catch (err) { MB.showToast('删除失败', true); }
      return;
    }

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      const song = MB.playlist.find(s => s.id === editBtn.dataset.edit);
      if (song) openEditModal(song);
      return;
    }

    const lrcBtn = e.target.closest('[data-import-lrc]');
    if (lrcBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      lrcFileInput.dataset.trackId = lrcBtn.dataset.importLrc;
      lrcFileInput.click();
      return;
    }

    const item = e.target.closest('.pl-item');
    if (item && !e.target.closest('.pl-actions')) {
      const idx = parseInt(item.dataset.index, 10);
      if (idx === MB.currentIndex) MB.player.togglePlay();
      else MB.player.loadSong(idx, true);
    }
  });

  lrcFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const trackId = e.target.dataset.trackId;
    if (!file || !trackId) return;
    try {
      const lyricsText = await file.text();
      const rec = await MB.idbGet(MB.STORE_TRACKS, trackId);
      if (!rec) throw new Error('找不到歌曲记录');
      rec.lyrics = lyricsText;
      await MB.idbPut(MB.STORE_TRACKS, rec);
      const idx = MB.playlist.findIndex(s => s.id === trackId);
      if (idx >= 0) MB.playlist[idx].lyrics = lyricsText;
      MB.showToast('歌词导入成功');
      if (idx === MB.currentIndex) MB.player.loadSong(MB.currentIndex, !MB.player.getAudio().paused);
    } catch (err) { MB.showToast('导入歌词失败', true); }
    finally { e.target.value = ''; delete e.target.dataset.trackId; }
  });

  plSortBtn.addEventListener('click', () => {
    MB.playSettings.defaultSortOrder = MB.playSettings.defaultSortOrder === 'asc' ? 'desc' : 'asc';
    MB.savePlaySettings();
    const curId = MB.playlist[MB.currentIndex] ? MB.playlist[MB.currentIndex].id : null;
    const sorted = MB.playlist.slice().sort((a, b) =>
      MB.playSettings.defaultSortOrder === 'desc' ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0)
    );
    MB.playlist = sorted;
    if (curId) MB.currentIndex = MB.playlist.findIndex(s => s.id === curId);
    if (MB.currentIndex < 0) MB.currentIndex = 0;
    updateSortBtnUI(); renderPlaylist();
    MB.showToast('排序：' + (MB.playSettings.defaultSortOrder === 'asc' ? '正序' : '倒序'));
  });

  listBtn.addEventListener('click', openPlaylist);
  plCloseBtn.addEventListener('click', closePlaylist);

  const handleClearAll = async () => {
    if (MB.playlist.length === 0) return;
    if (!(await window.showConfirm('危险操作', `确定删除全部 ${MB.playlist.length} 首本地音乐吗？此操作不可恢复。`, true))) return;
    try {
      for (const s of MB.playlist) {
        await MB.idbDelete(MB.STORE_AUDIO, s.id);
        await MB.idbDelete(MB.STORE_TRACKS, s.id);
      }
      MB.showToast('已清空全部本地音乐');
      MB.playlist = []; MB.currentIndex = 0;
      updateFolderPathUI(null);
      await MB.player.loadSong(0, false);
      await refreshPlaylistFromDB();
    } catch (err) { MB.showToast('清空失败', true); }
  };

  if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAll);
  if (clearAllBtnData) clearAllBtnData.addEventListener('click', handleClearAll);

  exportDataBtn.addEventListener('click', () => {
    if (MB.playlist.length === 0) { MB.showToast('播放列表为空，无数据可导出', true); return; }
    try {
      const data = JSON.stringify(MB.playlist, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `MelodyBox_Backup_${new Date().getTime()}.json`;
      a.click(); URL.revokeObjectURL(url);
      MB.showToast('数据导出成功！');
    } catch (err) { MB.showToast('导出失败', true); }
  });

  importDataBtn.addEventListener('click', () => dataFileInput.click());
  dataFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedList = JSON.parse(text);
      if (!Array.isArray(importedList)) throw new Error('数据格式错误');
      MB.showToast(`成功读取了 ${importedList.length} 首歌曲的备份信息（暂不支持跨设备恢复音频实体）`);
    } catch (err) { MB.showToast('导入数据失败，文件格式有误', true); }
    e.target.value = '';
  });

  exportZipBtn.addEventListener('click', async () => {
    if (MB.playlist.length === 0) { MB.showToast('播放列表为空', true); return; }
    if (typeof JSZip === 'undefined') { MB.showToast('JSZip 未加载，请检查本地文件', true); return; }
    exportZipBtn.disabled = true;
    dataProgressWrap.classList.add('show');
    dataProgressLabel.textContent = '正在打包...';
    dataProgressFill.style.width = '0%';
    try {
      const zip = new JSZip();
      const total = MB.playlist.length;
      for (let i = 0; i < total; i++) {
        const song = MB.playlist[i];
        const folder = zip.folder(song.id);
        if (song.source !== 'folder') {
          const audioRec = await MB.idbGet(MB.STORE_AUDIO, song.id);
          if (audioRec && audioRec.blob) {
            let ext = 'mp3';
            if (song.mimeType) ext = song.mimeType.split('/')[1] || 'mp3';
            folder.file(`audio.${ext}`, audioRec.blob);
          }
        }
        if (song.cover && song.cover.startsWith('data:image')) {
          const base64Data = song.cover.split(',')[1];
          const mime = song.cover.split(';')[0].split(':')[1] || 'image/jpeg';
          folder.file(`cover.${mime.split('/')[1] || 'jpg'}`, base64Data, { base64: true });
        }
        if (song.lyrics) folder.file('lyrics.lrc', song.lyrics);
        const meta = { ...song }; delete meta.cover; delete meta.lyrics;
        folder.file('meta.json', JSON.stringify(meta, null, 2));
        dataProgressLabel.textContent = `正在整理文件 (${i+1}/${total})...`;
        dataProgressFill.style.width = `${Math.round(((i + 1) / total) * 50)}%`;
      }
      dataProgressLabel.textContent = `正在生成 ZIP 压缩包...`;
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        dataProgressFill.style.width = `${50 + Math.round(metadata.percent / 2)}%`;
      });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url; a.download = `MelodyBox_FullBackup_${new Date().getTime()}.zip`;
      a.click(); URL.revokeObjectURL(url);
      MB.showToast('完整备份已下载！');
    } catch (err) {
      console.error(err);
      MB.showToast('打包失败：' + err.message, true);
    } finally {
      exportZipBtn.disabled = false;
      setTimeout(() => dataProgressWrap.classList.remove('show'), 1000);
    }
  });

  importZipBtn.addEventListener('click', () => zipFileInput.click());
  zipFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof JSZip === 'undefined') { MB.showToast('JSZip 未加载，请检查本地文件', true); return; }
    if (!(await window.showConfirm('导入备份', '导入备份将合并到现有播放列表，继续吗？', false))) { e.target.value = ''; return; }
    importZipBtn.disabled = true;
    dataProgressWrap.classList.add('show');
    dataProgressLabel.textContent = '正在读取备份文件...';
    dataProgressFill.style.width = '0%';
    let ok = 0; let failList = [];
    try {
      const zip = await JSZip.loadAsync(file);
      const folderNames = Object.keys(zip.files).filter(name => name.endsWith('/') && name !== '/');
      if (folderNames.length === 0) throw new Error('备份文件中没有找到任何歌曲文件夹');
      const total = folderNames.length;
      dataProgressLabel.textContent = `正在恢复数据 (0/${total})...`;
      for (let i = 0; i < total; i++) {
        const folderName = folderNames[i];
        const folder = zip.folder(folderName);
        let meta = null;
        try {
          const metaFile = folder.file('meta.json');
          if (!metaFile) throw new Error('缺少 meta.json 元数据文件');
          const metaStr = await metaFile.async('string');
          try { meta = JSON.parse(metaStr); } catch (parseErr) { throw new Error('meta.json 格式损坏，无法解析'); }
          const allFiles = Object.keys(folder.files).filter(n => !folder.files[n].dir);
          const audioFile = allFiles.find(n => /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(n));
          let audioBlob = null;
          if (audioFile) {
            const audioObj = folder.file(audioFile.split('/').pop());
            if (audioObj) audioBlob = await audioObj.async('blob');
          }
          if (!audioBlob && meta.source !== 'folder') throw new Error('文件夹内未找到有效音频文件');

          let coverData = meta.cover || MB.DEFAULT_COVER;
          const coverFile = allFiles.find(n => /\.(jpg|jpeg|png)$/i.test(n));
          if (coverFile) {
            try {
              const coverObj = folder.file(coverFile.split('/').pop());
              if (coverObj) {
                const coverBase64 = await coverObj.async('base64');
                if (coverBase64 && coverBase64.length > 10) {
                  const mime = coverFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
                  coverData = `data:${mime};base64,${coverBase64}`;
                }
              }
            } catch (coverErr) {}
          }
          let lyricsText = meta.lyrics || '';
          const lyricFile = allFiles.find(n => n.endsWith('.lrc'));
          if (lyricFile) {
            try {
              const lyricObj = folder.file(lyricFile.split('/').pop());
              if (lyricObj) {
                const text = await lyricObj.async('string');
                if (text) lyricsText = text;
              }
            } catch (lyricErr) {}
          }
          let newId = 'restored-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));

          let pinyinData = meta.pinyin;
          if (!pinyinData) {
            pinyinData = {
              title: MB.buildPinyinIndex(meta.title || ''),
              artist: MB.buildPinyinIndex(meta.artist || ''),
              album: meta.album ? MB.buildPinyinIndex(meta.album) : { full: '', initials: '' }
            };
          }

          const finalMeta = {
            id: newId, title: meta.title || '未知标题', artist: meta.artist || '未知艺术家',
            album: meta.album || null, year: meta.year || null, genre: meta.genre || null,
            track: meta.track || null, duration: meta.duration || 0,
            source: meta.source || 'local', filePath: meta.filePath || null,
            size: meta.size || (audioBlob ? audioBlob.size : 0), createdAt: Date.now(),
            lastPlayedAt: null, playCount: 0,
            mimeType: meta.mimeType || 'audio/mpeg', cover: coverData, lyrics: lyricsText,
            pinyin: pinyinData
          };
          if (audioBlob) await MB.idbPut(MB.STORE_AUDIO, { id: newId, blob: audioBlob });
          await MB.idbPut(MB.STORE_TRACKS, finalMeta);
          ok++;
        } catch (err) {
          failList.push(`${(meta && meta.title) ? meta.title : folderName} : ${err.message}`);
        }
        dataProgressLabel.textContent = `正在恢复数据 (${i+1}/${total})...`;
        dataProgressFill.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
      }
      await refreshPlaylistFromDB();
      reportSuccessCount.textContent = ok; reportFailCount.textContent = failList.length;
      if (failList.length > 0) {
        reportEmptyMsg.style.display = 'none';
        reportFailList.innerHTML = failList.map(msg => `<li>• ${msg}</li>`).join('');
      } else {
        reportFailList.innerHTML = ''; reportEmptyMsg.style.display = 'block';
      }
      restoreReportModal.classList.add('show');
    } catch (err) {
      MB.showToast('恢复失败：' + err.message, true);
    } finally {
      importZipBtn.disabled = false;
      setTimeout(() => dataProgressWrap.classList.remove('show'), 1000);
      e.target.value = '';
    }
  });

  closeReportBtn.addEventListener('click', () => restoreReportModal.classList.remove('show'));

  let dragCounter = 0;
  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
    dragCounter++; dropOverlay.classList.add('show');
  });
  window.addEventListener('dragover', (e) => { if (Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault(); });
  window.addEventListener('dragleave', () => { dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dropOverlay.classList.remove('show'); } });
  window.addEventListener('drop', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault(); dragCounter = 0; dropOverlay.classList.remove('show');
    if (e.target.closest && e.target.closest('#importZone')) return;
    MB.player.importFiles(e.dataTransfer.files);
  });

  document.addEventListener('keydown', (e) => {
    if (recordingAction) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const sc = MB.shortcuts;
    const audio = MB.player.getAudio();

    if (document.getElementById('confirmModal').classList.contains('show')) {
      if (e.code === 'Escape') {
        document.getElementById('confirmCancelBtn').click();
        return;
      }
    }

    if (MB.matchShortcut(e, sc.escape)) {
      settingsModal.classList.remove('show');
      closePlaylist(); closeEditModal(); restoreReportModal.classList.remove('show');
      document.querySelectorAll('.pl-menu.show').forEach(m => { m.classList.remove('show'); m.previousElementSibling.classList.remove('active'); });
      return;
    }
    if (MB.matchShortcut(e, sc.playPause)) { e.preventDefault(); MB.player.togglePlay(); }
    else if (MB.matchShortcut(e, sc.toggleLoopMode)) { e.preventDefault(); document.getElementById('loopBtn').click(); }
    else if (MB.matchShortcut(e, sc.seekForward)) { e.preventDefault(); if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); }
    else if (MB.matchShortcut(e, sc.seekBackward)) { e.preventDefault(); if (audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 5); }
    else if (MB.matchShortcut(e, sc.volumeUp)) { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); MB.playSettings.defaultVolume = audio.volume; MB.savePlaySettings(); }
    else if (MB.matchShortcut(e, sc.volumeDown)) { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); MB.playSettings.defaultVolume = audio.volume; MB.savePlaySettings(); }
    else if (MB.matchShortcut(e, sc.nextTrack)) { e.preventDefault(); if (MB.playlist.length) MB.player.loadSong(MB.currentIndex + 1, true); }
    else if (MB.matchShortcut(e, sc.prevTrack)) { e.preventDefault(); if (MB.playlist.length) MB.player.loadSong(MB.currentIndex - 1, true); }
    else if (MB.matchShortcut(e, sc.mute)) { e.preventDefault(); audio.muted = !audio.muted; if (!audio.muted && audio.volume === 0) audio.volume = 0.8; }
    else if (MB.matchShortcut(e, sc.openSettings)) { e.preventDefault(); settingsModal.classList.add('show'); }
    else if (MB.matchShortcut(e, sc.openPlaylist)) { e.preventDefault(); openPlaylist(); }
  });

  window.addEventListener('beforeunload', () => {
    const song = MB.playlist[MB.currentIndex];
    const audio = MB.player.getAudio();
    if (song && audio.currentTime > 0) MB.saveProgress(song.id, audio.currentTime);
  });

  async function init() {
    Ripple.bind();

    MB.loadBgSettings(); MB.loadBgGallery();
    MB.player.syncBgUI(); MB.player.applyBgSettings();
    MB.loadPlaySettings(); syncPlaySettingsUI();
    MB.loadLyricSettings(); 
    
    const isTauri = !!window.__TAURI__;
    const showSpectrumInput = document.getElementById('showSpectrum');
    if (isTauri && showSpectrumInput) {
      showSpectrumInput.checked = false;
      showSpectrumInput.disabled = true;
      MB.lyricSettings.showSpectrum = false;
      
      const descEl = showSpectrumInput.closest('.setting-item')?.querySelector('.s-desc');
      if (descEl) {
        descEl.textContent = '桌面端使用本地引用模式时，受安全策略限制，自动禁用频谱。';
        descEl.style.color = '#f87171';
      }
    }

    MB.loadLyricOffsets(); MB.player.applyLyricSettings();
    MB.loadShortcuts(); renderShortcutList(); syncShortcutBadges();

    const audio = MB.player.getAudio();
    audio.volume = MB.playSettings.defaultVolume;
    document.querySelectorAll('input[type=range]').forEach(el => {
      if (el.id === 'volumeSlider') el.value = MB.playSettings.defaultVolume;
      MB.player.updateRangeFill(el);
    });

    const vSlider = document.getElementById('volumeSlider');
    if (vSlider) {
      vSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        let v = audio.volume;
        if (e.deltaY < 0) v = Math.min(1, v + 0.05);
        else v = Math.max(0, v - 0.05);
        audio.volume = v;
        audio.muted = v === 0;
        MB.playSettings.defaultVolume = v;
        MB.savePlaySettings();
        vSlider.value = v;
        MB.player.updateRangeFill(vSlider);
        if (window.MB && MB.player.syncVolumeUI) MB.player.syncVolumeUI();
      }, { passive: false });
    }

    MB.loopMode = MB.playSettings.defaultLoopMode;
    const loopBtn = document.getElementById('loopBtn');
    loopBtn.classList.toggle('mode-one', MB.loopMode === 1);
    loopBtn.title = MB.LOOP_LABELS[MB.loopMode];

    updateSortBtnUI();
    MB.player.updatePlayIcon(); updateStorageInfo();

    try { await refreshPlaylistFromDB(); } catch (e) { console.error(e); }
    await migratePinyinIndex();

    if (MB.playlist.length > 0) {
      let startIndex = 0;
      const lastId = MB.loadLastTrack();
      if (MB.playSettings.restoreLastTrack && lastId) {
        const idx = MB.playlist.findIndex(s => s.id === lastId);
        if (idx >= 0) startIndex = idx;
      }
      await MB.player.loadSong(startIndex, !!MB.playSettings.autoPlayOnStart);
    } else {
      await MB.player.loadSong(0, false);
    }

    if (window.matchMedia('(max-width: 900px)').matches) {
      const hint = document.querySelector('.shortcut-mobile-hint');
      if (hint) hint.style.display = 'block';
    }
  }

  MB.ui = {
    renderPlaylist, refreshPlaylistFromDB, updateCurrentHighlight, syncShortcutBadges
  };

  init();
})();