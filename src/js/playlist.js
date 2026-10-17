/* ============================================================
 * playlist.js —— 播放列表：渲染、排序、搜索、标签、增删、拖拽、文件夹
 * 依赖：core.js, env.js, player.js
 * ============================================================ */

(function (VP) {
  'use strict';

  const { dom } = VP;

  // ===== 元数据持久化 =====
  VP.savePlaylistMeta = async function () {
    try {
      const meta = VP.playlist.map(v => ({
        id: v.id, name: v.name, type: v.type, size: v.size,
        addedAt: v.addedAt, path: v.path, isFileRef: v.isFileRef,
        isDir: VP.isDirNode(v), missing: !!v.missing
      }));
      localStorage.setItem(VP.PLAYLIST_KEY, JSON.stringify(meta));
      localStorage.setItem(VP.CURRENT_KEY, VP.currentVideoId || '');
    } catch (e) {}
  };

  VP.loadPlaylistMeta = function () {
    try {
      const raw = localStorage.getItem(VP.PLAYLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  };

  VP.loadRenames = function () {
    try {
      const raw = localStorage.getItem(VP.RENAME_KEY);
      VP.renameMap = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.renameMap = {}; }
  };

  VP.saveRenames = function () {
    try { localStorage.setItem(VP.RENAME_KEY, JSON.stringify(VP.renameMap)); } catch (e) {}
  };

  VP.loadDirNames = function () {
    try {
      const raw = localStorage.getItem(VP.DIR_NAMES_KEY);
      VP.dirNames = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.dirNames = {}; }
  };

  VP.saveDirNames = function () {
    try { localStorage.setItem(VP.DIR_NAMES_KEY, JSON.stringify(VP.dirNames)); } catch (e) {}
  };

  VP.getDirDisplayName = function (dirPath, fallbackName) {
    return VP.dirNames[dirPath] || fallbackName;
  };

  VP.loadTags = function () {
    try {
      const raw = localStorage.getItem(VP.TAGS_KEY);
      VP.tagMap = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.tagMap = {}; }
  };

  VP.saveTags = function () {
    try { localStorage.setItem(VP.TAGS_KEY, JSON.stringify(VP.tagMap)); } catch (e) {}
  };

  VP.getDisplayName = function (item) {
    return VP.renameMap[item.id] || item.name;
  };

  VP.getItemTags = function (id) {
    return VP.tagMap[id] || [];
  };

  // ===== 排序 / 密度 =====
  VP.loadDensity = function () {
    try { VP.isCompact = localStorage.getItem(VP.DENSITY_KEY) === '1'; } catch (e) {}
    VP.applyDensity();
  };

  VP.applyDensity = function () {
    dom.playlistPanel.classList.toggle('compact', VP.isCompact);
    dom.densityIcon.innerHTML = VP.isCompact ? VP.ICONS.densityCompact : VP.ICONS.density;
    dom.densityBtn.classList.toggle('active', VP.isCompact);
    dom.densityBtn.title = VP.isCompact ? '紧凑模式（点击切换为宽松）' : '宽松模式（点击切换为紧凑）';
  };

  VP.saveDensity = function () {
    try { localStorage.setItem(VP.DENSITY_KEY, VP.isCompact ? '1' : '0'); } catch (e) {}
  };

  VP.loadSort = function () {
    try {
      VP.sortMode = localStorage.getItem(VP.SORT_KEY) || 'manual';
      VP.sortDir = localStorage.getItem(VP.SORT_DIR_KEY) || 'asc';
    } catch (e) {}
    dom.sortSelect.value = VP.sortMode;
    VP.updateSortDirIcon();
  };

  VP.updateSortDirIcon = function () {
    dom.sortDirIcon.innerHTML = VP.sortDir === 'asc' ? VP.ICONS.arrowUp : VP.ICONS.arrowDown;
  };

  VP.saveSort = function () {
    try {
      localStorage.setItem(VP.SORT_KEY, VP.sortMode);
      localStorage.setItem(VP.SORT_DIR_KEY, VP.sortDir);
    } catch (e) {}
  };

  // ===== 标签 / 搜索过滤 =====
  VP.getAllTags = function () {
    const tagSet = new Set();
    Object.values(VP.tagMap).forEach(tags => {
      tags.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  };

  VP.matchesFilters = function (item) {
    if (VP.isDirNode(item)) return false;
    if (VP.activeTag) {
      const tags = VP.getItemTags(item.id);
      if (!tags.includes(VP.activeTag)) return false;
    }
    if (VP.searchQuery) {
      const q = VP.searchQuery.toLowerCase();
      const name = VP.getDisplayName(item).toLowerCase();
      const path = (item.path || '').toLowerCase();
      if (!name.includes(q) && !path.includes(q)) return false;
    }
    return true;
  };

  VP.getSortedPlaylist = function () {
    if (VP.sortMode === 'manual') return VP.playlist.slice();

    const arr = VP.playlist.slice();
    arr.sort((a, b) => {
      const aDir = VP.isDirNode(a) ? 0 : 1;
      const bDir = VP.isDirNode(b) ? 0 : 1;
      if (aDir !== bDir) return aDir - bDir;

      let va, vb;
      if (VP.sortMode === 'addedAt') {
        va = a.addedAt || 0;
        vb = b.addedAt || 0;
      } else if (VP.sortMode === 'name') {
        va = VP.getDisplayName(a).toLowerCase();
        vb = VP.getDisplayName(b).toLowerCase();
      } else if (VP.sortMode === 'size') {
        va = a.size || 0;
        vb = b.size || 0;
      }
      if (va < vb) return VP.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return VP.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  };

  // ===== 选择态 =====
  VP.updateSelectAllCheckbox = function () {
    const total = VP.playlist.filter(v => !VP.isDirNode(v)).length;
    const selected = VP.selectedIds.size;
    if (total > 0 && selected === total) {
      dom.selectAllCheckbox.checked = true;
      dom.selectAllCheckbox.indeterminate = false;
    } else if (selected > 0) {
      dom.selectAllCheckbox.checked = false;
      dom.selectAllCheckbox.indeterminate = true;
    } else {
      dom.selectAllCheckbox.checked = false;
      dom.selectAllCheckbox.indeterminate = false;
    }
    dom.selectAllLabel.textContent = selected > 0 ? `已选 ${selected}/${total}` : '全选';
  };

  // ===== 标签栏 =====
  VP.renderTagBar = function () {
    const allTags = VP.getAllTags();
    if (allTags.length === 0) {
      dom.tagBar.style.display = 'none';
      return;
    }
    dom.tagBar.style.display = 'flex';

    const counts = {};
    allTags.forEach(tag => {
      counts[tag] = VP.playlist.filter(v => !VP.isDirNode(v) && VP.getItemTags(v.id).includes(tag)).length;
    });

    const totalVideos = VP.playlist.filter(v => !VP.isDirNode(v)).length;
    let html = `<div class="tag-chip all ${!VP.activeTag ? 'active' : ''}" data-tag="">全部 <span class="tag-count">${totalVideos}</span></div>`;
    allTags.forEach(tag => {
      html += `<div class="tag-chip ${VP.activeTag === tag ? 'active' : ''}" data-tag="${VP.escapeHtml(tag)}">${VP.escapeHtml(tag)} <span class="tag-count">${counts[tag]}</span></div>`;
    });
    dom.tagBar.innerHTML = html;

    dom.tagBar.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        VP.activeTag = chip.dataset.tag || null;
        VP.renderTagBar();
        VP.renderPlaylist();
      });
    });
  };

  // ===== 路径导航 =====
  VP.enterFolder = function (dirPath) {
    VP.currentPath = dirPath;
    try { localStorage.setItem(VP.LAST_VIEW_KEY, dirPath || ''); } catch (e) {}
    VP.renderPlaylist();
    VP.updateFolderPathBar();
  };

  VP.goBackFolder = function () {
    if (!VP.currentPath) return;

    if (VP.rootDirs.includes(VP.currentPath)) {
      VP.currentPath = null;
      try { localStorage.setItem(VP.LAST_VIEW_KEY, ''); } catch (e) {}
      VP.renderPlaylist();
      VP.updateFolderPathBar();
      return;
    }

    const parent = VP.dirname(VP.currentPath);
    if (!parent || parent.length < 3) {
      VP.currentPath = null;
    } else {
      VP.currentPath = parent;
    }
    try { localStorage.setItem(VP.LAST_VIEW_KEY, VP.currentPath || ''); } catch (e) {}
    VP.renderPlaylist();
    VP.updateFolderPathBar();
  };

  VP.goAllView = function () {
    VP.currentPath = null;
    try { localStorage.setItem(VP.LAST_VIEW_KEY, ''); } catch (e) {}
    VP.renderPlaylist();
    VP.updateFolderPathBar();
  };

  VP.getCurrentViewItems = VP.getViewItems;

  // ===== 列表渲染 =====
  VP.renderPlaylist = function () {
    const videoCount = VP.playlist.filter(v => !VP.isDirNode(v)).length;
    dom.playlistCount.textContent = videoCount;

    dom.playlistItems.innerHTML = '';
    dom.playlistItems.appendChild(dom.playlistNoResult);
    dom.playlistNoResult.classList.remove('show');

    if (VP.playlist.length === 0) {
      dom.playlistItems.insertAdjacentHTML('afterbegin', `
        <div class="playlist-empty">
          <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>
          <div>播放列表为空<br>
          ${VP.env.isTauri ? '点击 <strong style="color:#7d8cff">📁</strong> 打开文件夹，或点击 <strong style="color:#7d8cff">+</strong> 导入视频' : '点击上方 <strong style="color:#7d8cff">+</strong> 导入视频'}</div>
        </div>`);
      VP.updateSelectAllCheckbox();
      return;
    }

    const view = VP.getViewItems();

    if (view.dirs.length === 0 && view.videos.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'playlist-empty';
      if (VP.searchQuery) {
        empty.innerHTML = `<div>没有匹配的视频</div>`;
      } else if (VP.currentPath === null) {
        empty.innerHTML = `<div>还没有添加任何根目录<br><span style="font-size:12px;color:rgba(255,255,255,0.35)">点击上方 📁 按钮添加文件夹，或点击 + 导入视频</span></div>`;
      } else {
        empty.innerHTML = `<div>这个文件夹是空的</div>`;
      }
      dom.playlistItems.appendChild(empty);
      VP.updateSelectAllCheckbox();
      return;
    }

    // === 先渲染文件夹行 ===
    view.dirs.forEach(dir => {
      const el = document.createElement('div');
      el.className = 'playlist-item dir-item';
      el.dataset.id = dir.id;

      const isRoot = VP.rootDirs.includes(dir.path);
      if (isRoot) el.dataset.root = '1';

      const prefix1 = dir.path + '\\';
      const prefix2 = dir.path + '/';
      const count = VP.playlist.filter(v =>
        !VP.isDirNode(v) && (v.path.startsWith(prefix1) || v.path.startsWith(prefix2))
      ).length;

      const dirDisplayName = VP.getDirDisplayName(dir.path, dir.name);

      el.innerHTML = `
        <span class="item-index dir-icon">
          <svg viewBox="0 0 24 24">${VP.ICONS.folder}</svg>
        </span>
        <div class="item-info">
          <div class="item-name" title="${VP.escapeHtml(dir.path)}">${VP.escapeHtml(dirDisplayName)}</div>
          <div class="item-meta">
            <span>${count} 个视频</span>
            ${isRoot ? '<span class="dot"></span><span style="color:#7d8cff">根目录</span>' : ''}
          </div>
        </div>
        <button class="item-menu-btn" data-menu="${dir.id}" title="更多操作">
          <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      `;

      const menuBtn = el.querySelector('[data-menu]');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        VP.openContextMenu(dir.id, menuBtn);
      });

      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-menu]')) return;
        VP.enterFolder(dir.path);
      });

      if (VP.currentPath === null) {
        el.draggable = true;

        el.addEventListener('dragstart', (e) => {
          VP.rootDragId = dir.id;
          VP.rootDragPath = dir.path;
          el.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', dir.id); } catch (err) {}
        });
        el.addEventListener('dragend', () => {
          el.classList.remove('dragging');
          VP.rootDragId = null;
          VP.rootDragPath = null;
          dom.playlistItems.querySelectorAll('.drop-before, .drop-after').forEach(x => {
            x.classList.remove('drop-before', 'drop-after');
          });
        });
        el.addEventListener('dragover', (e) => {
          if (!VP.rootDragId || VP.rootDragId === dir.id) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = el.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const position = e.clientY < midpoint ? 'before' : 'after';
          dom.playlistItems.querySelectorAll('.drop-before, .drop-after').forEach(x => {
            x.classList.remove('drop-before', 'drop-after');
          });
          el.classList.add(position === 'before' ? 'drop-before' : 'drop-after');
        });
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!VP.rootDragId || VP.rootDragId === dir.id) return;
          const rect = el.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const position = e.clientY < midpoint ? 'before' : 'after';
          VP.reorderRootDir(VP.rootDragPath, dir.path, position);
        });
      }

      dom.playlistItems.appendChild(el);
    });

    // === 再渲染视频 ===
    const sortedAll = VP.getSortedPlaylist();
    let sortedVideos;
    if (VP.searchQuery) {
      sortedVideos = sortedAll.filter(v => !VP.isDirNode(v));
    } else if (VP.currentPath === null) {
      sortedVideos = sortedAll.filter(v => !VP.isDirNode(v) && !v.path);
    } else {
      sortedVideos = sortedAll.filter(v => !VP.isDirNode(v) && VP.dirname(v.path) === VP.currentPath);
    }

    let visibleCount = 0;

    sortedVideos.forEach((item, viewIndex) => {
      const el = document.createElement('div');
      const isCurrent = item.id === VP.currentVideoId;
      const isSelected = VP.selectedIds.has(item.id);
      const isWatched = VP.watchedSet.has(item.id);
      const matches = VP.matchesFilters(item);
      const isCurrentButFiltered = isCurrent && !matches;
      const isRef = VP.isFileRef(item);

      el.className = 'playlist-item' +
        (isCurrent ? ' active' : '') +
        (isSelected ? ' selected' : '') +
        (isCurrentButFiltered ? ' kept-active' : '') +
        (item.missing ? ' file-missing' : '') +
        (matches ? '' : (isCurrent ? '' : ' filtered-out'));
      el.dataset.id = item.id;

      if (matches || isCurrentButFiltered) visibleCount++;

      const index = viewIndex + 1;

      let searchPathHtml = '';
      if (VP.searchQuery && item.path) {
        const parent = VP.dirname(item.path);
        const parentName = parent.split(/[\\/]/).pop() || parent;
        searchPathHtml = `<span class="dot"></span><span style="color:rgba(255,255,255,0.45)" title="${VP.escapeHtml(parent)}">📁 ${VP.escapeHtml(parentName)}</span>`;
      }

      let metaExtra = '';
      if (VP.searchQuery && searchPathHtml) {
        metaExtra = searchPathHtml;
      } else if (isCurrent) {
        metaExtra = '<span class="dot"></span><span style="color:#7d8cff">正在播放</span>';
      } else if (isWatched) {
        metaExtra = `<span class="item-watched-text"><svg viewBox="0 0 24 24">${VP.ICONS.check}</svg>已看完</span>`;
      } else {
        const prog = VP.videoProgress[item.id];
        if (prog && prog.time > 3) {
          metaExtra = `<span class="dot"></span><span>上次看到 ${VP.formatTime(prog.time)}</span>`;
        }
      }

      const sourceBadge = isRef
        ? `<span class="item-source-badge" title="来自文件夹引用，不占用存储空间"><svg viewBox="0 0 24 24">${VP.ICONS.folder}</svg>文件</span>`
        : '';

      const sizeText = isRef
        ? (item.size > 0 ? VP.formatSize(item.size) : (item.size === -1 ? '大小未知' : '外部引用'))
        : VP.formatSize(item.size);

      const displayName = VP.getDisplayName(item);
      const itemTags = VP.getItemTags(item.id);

      let tagsHtml = '';
      if (itemTags.length > 0) {
        tagsHtml = `<div class="item-tags">${itemTags.map(t => `<span class="item-tag">${VP.escapeHtml(t)}</span>`).join('')}</div>`;
      }

      el.innerHTML = `
        <input type="checkbox" class="item-checkbox" data-checkbox="${item.id}" ${isSelected ? 'checked' : ''}>
        <span class="item-index">${index}</span>
        <div class="item-info">
          <div class="item-name" title="${VP.escapeHtml(displayName)}">${VP.escapeHtml(displayName)}</div>
          <div class="item-meta">
            <span>${sizeText}</span>
            ${sourceBadge}
            ${metaExtra}
          </div>
          ${tagsHtml}
        </div>
        <button class="item-menu-btn" data-menu="${item.id}" title="更多操作">
          <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>`;

      const checkbox = el.querySelector('[data-checkbox]');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        if (checkbox.checked) VP.selectedIds.add(item.id);
        else VP.selectedIds.delete(item.id);
        el.classList.toggle('selected', checkbox.checked);
        VP.updateSelectAllCheckbox();
      });

      const menuBtn = el.querySelector('[data-menu]');
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        VP.openContextMenu(item.id, menuBtn);
      });

      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-menu]')) return;
        if (e.target.closest('[data-checkbox]')) return;
        if (VP.selectionMode) {
          if (VP.selectedIds.has(item.id)) {
            VP.selectedIds.delete(item.id);
            checkbox.checked = false;
            el.classList.remove('selected');
          } else {
            VP.selectedIds.add(item.id);
            checkbox.checked = true;
            el.classList.add('selected');
          }
          VP.updateSelectAllCheckbox();
          return;
        }

        if (VP.searchQuery) {
          VP.searchQuery = '';
          if (dom.playlistSearchInput) dom.playlistSearchInput.value = '';
          if (dom.playlistSearchClear) dom.playlistSearchClear.classList.remove('show');
        }

        VP.switchToVideo(item.id);
      });

      const canDrag = !VP.selectionMode && VP.sortMode === 'manual';
      el.draggable = canDrag;
      el.addEventListener('dragstart', (e) => {
        if (!canDrag) { e.preventDefault(); return; }
        VP.dragItemId = item.id;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', item.id); } catch (err) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        VP.dragItemId = null;
        VP.clearDragHints();
        VP.stopAutoScroll();
      });

      el.addEventListener('dragover', (e) => {
        if (!VP.dragItemId || VP.dragItemId === item.id) return;
        if (VP.sortMode !== 'manual') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = el.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const position = e.clientY < midpoint ? 'before' : 'after';

        if (VP.dragOverItemId !== item.id || VP.dragOverPosition !== position) {
          VP.clearDragHints();
          VP.dragOverItemId = item.id;
          VP.dragOverPosition = position;
          el.classList.add(position === 'before' ? 'drop-before' : 'drop-after');
        }
      });

      el.addEventListener('dragleave', (e) => {
        if (e.relatedTarget && el.contains(e.relatedTarget)) return;
        el.classList.remove('drop-before', 'drop-after');
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        VP.handleReorderDrop(item.id, VP.dragOverPosition);
      });

      dom.playlistItems.appendChild(el);
    });

    if (visibleCount === 0 && (VP.searchQuery || VP.activeTag)) {
      dom.playlistNoResult.classList.add('show');
    } else {
      dom.playlistNoResult.classList.remove('show');
    }

    VP.updateSelectAllCheckbox();
  };

  // ===== 自动滚动 =====
  let autoScrollRAF = null;
  let autoScrollDir = 0;

  VP.startAutoScroll = function (dir) {
    if (autoScrollDir === dir && autoScrollRAF) return;
    autoScrollDir = dir;
    if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
    const step = () => {
      if (autoScrollDir === 0) return;
      dom.playlistItems.scrollTop += autoScrollDir * 8;
      autoScrollRAF = requestAnimationFrame(step);
    };
    autoScrollRAF = requestAnimationFrame(step);
  };

  VP.stopAutoScroll = function () {
    autoScrollDir = 0;
    if (autoScrollRAF) {
      cancelAnimationFrame(autoScrollRAF);
      autoScrollRAF = null;
    }
  };

  VP.clearDragHints = function () {
    dom.playlistItems.querySelectorAll('.drop-before, .drop-after').forEach(el => {
      el.classList.remove('drop-before', 'drop-after');
    });
    VP.dragOverItemId = null;
    VP.dragOverPosition = null;
  };

  VP.handleReorderDrop = function (targetId, position) {
    if (!VP.dragItemId || VP.dragItemId === targetId) {
      VP.clearDragHints();
      return;
    }

    const fromIdx = VP.playlist.findIndex(v => v.id === VP.dragItemId);
    let toIdx = VP.playlist.findIndex(v => v.id === targetId);
    if (fromIdx < 0 || toIdx < 0) {
      VP.clearDragHints();
      return;
    }

    const dragItem = VP.playlist[fromIdx];
    const targetItem = VP.playlist[toIdx];
    const dragDir = dragItem.path ? VP.dirname(dragItem.path) : null;
    const targetDir = targetItem.path ? VP.dirname(targetItem.path) : null;
    if (dragDir !== targetDir) {
      VP.clearDragHints();
      VP.showOSD(VP.ICONS.info, '只能在同一目录内排序');
      return;
    }

    const [moved] = VP.playlist.splice(fromIdx, 1);
    toIdx = VP.playlist.findIndex(v => v.id === targetId);
    if (toIdx < 0) toIdx = VP.playlist.length;

    const insertIdx = position === 'before' ? toIdx : toIdx + 1;
    VP.playlist.splice(insertIdx, 0, moved);

    VP.savePlaylistMeta();
    VP.renderPlaylist();

    const displayName = VP.getDisplayName(moved);
    VP.showOSD(VP.ICONS.check, '顺序已更新',
      displayName.length > 20 ? displayName.slice(0, 20) + '…' : displayName);

    VP.clearDragHints();
    VP.dragItemId = null;
  };

  VP.reorderRootDir = function (fromPath, toPath, position) {
    if (!fromPath || !toPath || fromPath === toPath) return;
    const fromIdx = VP.rootDirs.indexOf(fromPath);
    const toIdx = VP.rootDirs.indexOf(toPath);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = VP.rootDirs.splice(fromIdx, 1);
    const newToIdx = VP.rootDirs.indexOf(toPath);
    const insertIdx = position === 'before' ? newToIdx : newToIdx + 1;
    VP.rootDirs.splice(insertIdx, 0, moved);

    VP.saveRootDirs();
    VP.renderPlaylist();
    VP.showOSD(VP.ICONS.check, '根目录顺序已更新');
  };

  // ===== 右键菜单 =====
  VP.openContextMenu = function (id, anchorEl) {
    VP.menuTargetId = id;

    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;

    const isDir = VP.isDirNode(item);
    const isRoot = isDir && VP.rootDirs.includes(item.path);

    dom.menuOpenFolderBtn.style.display = isDir ? 'flex' : 'none';
    dom.menuRenameDirBtn.style.display = isDir ? 'flex' : 'none';
    dom.menuPlayBtn.style.display = isDir ? 'none' : 'flex';
    dom.menuInfoBtn.style.display = isDir ? 'none' : 'flex';
    dom.menuTagsBtn.style.display = isDir ? 'none' : 'flex';
    dom.menuRenameBtn.style.display = isDir ? 'none' : 'flex';

    if (isRoot) {
      dom.menuDeleteText.textContent = '移除根目录';
    } else if (isDir) {
      dom.menuDeleteText.textContent = '移除文件夹';
    } else {
      dom.menuDeleteText.textContent = '删除';
    }

    const rect = anchorEl.getBoundingClientRect();
    dom.itemContextMenu.classList.add('show');

    const menuRect = dom.itemContextMenu.getBoundingClientRect();
    let left = rect.right - menuRect.width;
    let top = rect.bottom + 4;

    if (left < 8) left = 8;
    if (top + menuRect.height > window.innerHeight - 8) {
      top = rect.top - menuRect.height - 4;
    }
    if (top < 8) top = 8;

    dom.itemContextMenu.style.left = left + 'px';
    dom.itemContextMenu.style.top = top + 'px';
  };

  VP.closeContextMenu = function () {
    dom.itemContextMenu.classList.remove('show');
    VP.menuTargetId = null;
  };

  // ===== 详情 =====
  VP.showVideoInfo = async function (id) {
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;
    const isRef = VP.isFileRef(item);

    VP.showToast('正在读取详情…');

    let width = '—', height = '—', duration = '—';
    let tempSrc = null;
    let tempBlob = null;
    let tempVideo = null;

    try {
      if (isRef) {
        tempSrc = VP.pathToVideoUrl(item.path);
      } else {
        const record = await VP.dbGet(id);
        if (record && record.blob) {
          tempBlob = record.blob;
          tempSrc = URL.createObjectURL(record.blob);
        }
      }

      if (tempSrc) {
        tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.muted = true;
        tempVideo.src = tempSrc;
        await new Promise((resolve) => {
          tempVideo.onloadedmetadata = resolve;
          tempVideo.onerror = resolve;
          setTimeout(resolve, 3000);
        });
        if (tempVideo.videoWidth) {
          width = tempVideo.videoWidth + ' px';
          height = tempVideo.videoHeight + ' px';
        }
        if (tempVideo.duration && !isNaN(tempVideo.duration)) {
          duration = VP.formatTime(tempVideo.duration);
        }
      }
    } catch (e) {
      console.warn('读取元数据失败:', e);
    } finally {
      if (tempVideo) {
        try { tempVideo.removeAttribute('src'); tempVideo.load(); } catch (e) {}
      }
      if (tempBlob && tempSrc) {
        try { URL.revokeObjectURL(tempSrc); } catch (e) {}
      }
    }

    VP.hideToast();

    const tags = VP.getItemTags(id);
    const sizeDisplay = item.size === -1
      ? '未知（点"重新扫描"可读取）'
      : VP.formatSize(item.size);

    const html = `
      <div class="detail-row">
        <div class="detail-label">文件名</div>
        <div class="detail-value">${VP.escapeHtml(item.name)}</div>
      </div>
      ${VP.renameMap[id] ? `
      <div class="detail-row">
        <div class="detail-label">显示名</div>
        <div class="detail-value">${VP.escapeHtml(VP.renameMap[id])}</div>
      </div>` : ''}
      ${isRef ? `
      <div class="detail-row">
        <div class="detail-label">来源</div>
        <div class="detail-value">文件夹引用（不占用存储空间）</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">完整路径</div>
        <div class="detail-value" style="font-size:11px">${VP.escapeHtml(item.path)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">文件大小</div>
        <div class="detail-value">${sizeDisplay}</div>
      </div>` : `
      <div class="detail-row">
        <div class="detail-label">文件大小</div>
        <div class="detail-value">${sizeDisplay}</div>
      </div>`}
      <div class="detail-row">
        <div class="detail-label">文件类型</div>
        <div class="detail-value">${VP.escapeHtml(item.type || VP.getMimeFromName(item.name))}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">分辨率</div>
        <div class="detail-value">${width} × ${height}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">时长</div>
        <div class="detail-value">${duration}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">添加时间</div>
        <div class="detail-value">${VP.formatDate(item.addedAt)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">标签</div>
        <div class="detail-value">${tags.length ? tags.map(t => `<span class="item-tag" style="margin-right:4px">${VP.escapeHtml(t)}</span>`).join('') : '无'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">视频 ID</div>
        <div class="detail-value" style="font-size:11px">${VP.escapeHtml(item.id)}</div>
      </div>
    `;

    await VP.showDialog({
      type: 'alert',
      title: '视频详情',
      customHTML: html,
      okText: '关闭'
    });
  };

  // ===== 标签编辑 =====
  VP.showTagEditor = function (id) {
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;
    const displayName = VP.getDisplayName(item);
    const currentTags = VP.getItemTags(id).slice();

    const html = `
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:8px">为「${VP.escapeHtml(displayName)}」设置标签</div>
      <div class="tag-edit-wrap" id="tagEditWrap"></div>
      <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:8px">提示：输入标签后按 Enter 添加，点击标签上的 × 删除。可添加多个。</div>
    `;

    return VP.showDialog({
      type: 'alert',
      title: '编辑标签',
      customHTML: html,
      okText: '保存',
      onOk: () => {
        if (currentTags.length > 0) VP.tagMap[id] = currentTags.slice();
        else delete VP.tagMap[id];
        VP.saveTags();
        VP.renderPlaylist();
        VP.renderTagBar();
        VP.showOSD(VP.ICONS.check, '标签已更新');
        return true;
      },
      onOpen: () => {
        const wrap = document.getElementById('tagEditWrap');
        if (!wrap) return;

        function renderTags() {
          wrap.innerHTML = '';
          currentTags.forEach((tag, idx) => {
            const chip = document.createElement('div');
            chip.className = 'tag-edit-chip';
            chip.innerHTML = `
              <span>${VP.escapeHtml(tag)}</span>
              <button data-idx="${idx}"><svg viewBox="0 0 24 24">${VP.ICONS.close}</svg></button>
            `;
            chip.querySelector('button').addEventListener('click', () => {
              currentTags.splice(idx, 1);
              renderTags();
            });
            wrap.appendChild(chip);
          });

          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'tag-edit-input';
          input.placeholder = '输入标签…';
          input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' && input.value.trim()) {
              e.preventDefault();
              e.stopPropagation();
              const newTag = input.value.trim();
              if (!currentTags.includes(newTag)) currentTags.push(newTag);
              input.value = '';
              renderTags();
              setTimeout(() => {
                const newInput = wrap.querySelector('.tag-edit-input');
                if (newInput) newInput.focus();
              }, 0);
            }
          });
          wrap.appendChild(input);
          setTimeout(() => input.focus(), 0);
        }

        renderTags();
      }
    });
  };

  // ===== 清理子项辅助（#3 新增） =====
  VP.purgeChildData = async function (ids) {
    let dbCount = 0;
    for (const id of ids) {
      const it = VP.playlist.find(v => v.id === id);
      if (it && !VP.isFileRef(it) && !VP.isDirNode(it)) {
        try { await VP.dbDelete(id); dbCount++; } catch (e) {}
      }
      if (VP.videoProgress[id]) delete VP.videoProgress[id];
      if (VP.watchedSet.has(id)) VP.watchedSet.delete(id);
      if (VP.renameMap[id]) delete VP.renameMap[id];
      if (VP.tagMap[id]) delete VP.tagMap[id];
      if (VP.subtitleMap[id]) delete VP.subtitleMap[id];
      VP.selectedIds.delete(id);
    }
    if (ids.length > 0) {
      VP.saveVideoProgress();
      VP.saveWatched();
      VP.saveRenames();
      VP.saveTags();
      VP.saveSubtitles();
    }
    return dbCount;
  };

  // ===== 删除单个 =====
  VP.removeVideo = async function (id) {
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;

    // 文件夹节点
    if (VP.isDirNode(item)) {
      const prefix1 = item.path + '\\';
      const prefix2 = item.path + '/';
      const toRemove = VP.playlist.filter(v =>
        v.id === id || v.path === item.path ||
        (v.path && (v.path.startsWith(prefix1) || v.path.startsWith(prefix2)))
      );

      const isRoot = VP.rootDirs.includes(item.path);
      const ok = await VP.dlgConfirm(
        `确定要从列表移除${isRoot ? '根目录' : '文件夹'}「${item.name}」及其 ${toRemove.length - 1} 个子项吗？\n（不会删除原文件）`,
        isRoot ? '移除根目录' : '移除文件夹',
        { danger: true, okText: '移除' }
      );
      if (!ok) return;

      if (isRoot) {
        VP.rootDirs = VP.rootDirs.filter(r => r !== item.path);
        VP.saveRootDirs();
      }

      const idsToRemove = new Set(toRemove.map(v => v.id));

      // 【#3 修复】清理所有子项的进度/已看/重命名/标签/字幕/DB 记录
      const childIds = Array.from(idsToRemove);
      await VP.purgeChildData(childIds);

      // 如果当前播放的视频在删除范围内，重置播放器
      const removingCurrent = VP.currentVideoId && idsToRemove.has(VP.currentVideoId);

      VP.playlist = VP.playlist.filter(v => !idsToRemove.has(v.id));

      if (removingCurrent) {
        if (VP.currentObjectURL) {
          URL.revokeObjectURL(VP.currentObjectURL);
          VP.currentObjectURL = null;
        }
        dom.video.removeAttribute('src');
        dom.video.load();
        VP.hasVideo = false;
        VP.currentVideoId = null;
        VP.setControlsEnabled(false);
        dom.placeholder.classList.remove('hidden');
        dom.progressPlayed.style.width = '0%';
        dom.progressThumb.style.left = '0%';
        dom.currentTimeDisplay.textContent = '0:00';
        dom.durationDisplay.textContent = '0:00';
        VP.updatePlayPauseIcon();
        VP.resetPreviewThumbnail();
      }

      await VP.savePlaylistMeta();
      VP.renderPlaylist();
      VP.renderTagBar();
      VP.updateFolderPathBar();
      VP.updateStorageInfo();
      VP.showOSD(VP.ICONS.check, isRoot ? '根目录已移除' : '文件夹已移除');

      if (VP.currentPath && (VP.currentPath === item.path ||
          VP.currentPath.startsWith(prefix1) || VP.currentPath.startsWith(prefix2))) {
        VP.goAllView();
      } else if (!VP.hasVideo && playlistLength() > 0) {
        await switchToFirstVideo();
      }
      return;
    }

    // 视频节点
    const displayName = VP.getDisplayName(item);
    const isRef = VP.isFileRef(item);

    const canDeleteSource = VP.env.isTauri && isRef;

    let confirmResult;
    if (canDeleteSource) {
      confirmResult = await VP.dlgConfirm(
        `确定要从列表移除「${displayName}」吗？`,
        '移除视频',
        {
          danger: true,
          okText: '移除',
          checkbox: {
            label: '同时删除源文件（不可恢复）',
            defaultChecked: false,
            danger: true
          }
        }
      );
      if (!confirmResult || !confirmResult.ok) return;
    } else {
      const ok = await VP.dlgConfirm(
        `确定要从列表移除「${displayName}」吗？`,
        '移除视频',
        { danger: true, okText: '移除' }
      );
      if (!ok) return;
      confirmResult = { ok: true, checked: false };
    }

    const deleteSource = canDeleteSource && confirmResult.checked;

    const el = dom.playlistItems.querySelector(`.playlist-item[data-id="${CSS.escape(id)}"]`);
    if (el) {
      el.classList.add('removing');
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    let sourceDeleteFailed = false;
    if (deleteSource) {
      try {
        const fs = VP.env.tauriFs;
        if (typeof fs.remove === 'function') {
          await fs.remove(item.path);
          VP.showOSD(VP.ICONS.check, '源文件已删除');
        } else {
          sourceDeleteFailed = true;
        }
      } catch (err) {
        console.error('删除源文件失败:', err);
        sourceDeleteFailed = true;
      }
    }

    await VP.purgeChildData([id]);

    VP.playlist = VP.playlist.filter(v => v.id !== id);

    if (VP.currentVideoId === id) {
      if (VP.currentObjectURL) {
        URL.revokeObjectURL(VP.currentObjectURL);
        VP.currentObjectURL = null;
      }
      dom.video.removeAttribute('src');
      dom.video.load();
      VP.hasVideo = false;
      VP.currentVideoId = null;
      VP.setControlsEnabled(false);
      dom.placeholder.classList.remove('hidden');
      dom.progressPlayed.style.width = '0%';
      dom.progressThumb.style.left = '0%';
      dom.currentTimeDisplay.textContent = '0:00';
      dom.durationDisplay.textContent = '0:00';
      VP.updatePlayPauseIcon();
      VP.resetPreviewThumbnail();
    }

    await VP.savePlaylistMeta();
    VP.renderPlaylist();
    VP.renderTagBar();
    VP.updateStorageInfo();
    VP.updateFolderPathBar();

    if (sourceDeleteFailed) {
      VP.dlgAlert('列表项已移除，但源文件删除失败。\n可能原因：文件被占用、权限不足或文件不存在。', '源文件删除失败');
    }

    if (!VP.hasVideo && playlistLength() > 0) {
      await switchToFirstVideo();
    } else {
      VP.updateNavButtons();
    }
  };

  function playlistLength() {
    return VP.playlist.filter(v => !VP.isDirNode(v)).length;
  }

  async function switchToFirstVideo() {
    const first = VP.playlist.find(v => !VP.isDirNode(v));
    if (first) await VP.switchToVideo(first.id);
  }

  // ===== 添加视频 =====
  VP.addVideos = async function (files) {
    const videoFiles = Array.from(files).filter(f =>
      f.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|flv|wmv|m4v|ogv)$/i.test(f.name)
    );

    if (videoFiles.length === 0) {
      VP.dlgAlert('请选择视频文件（mp4、webm、mov、mkv 等）', '提示');
      return;
    }

    VP.showToast(`正在添加 ${videoFiles.length} 个视频…`);
    let addedCount = 0;
    const failedNames = [];

    for (const file of videoFiles) {
      const id = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      const record = { id, name: file.name, type: file.type, size: file.size, blob: file, addedAt: Date.now() };
      try {
        await VP.dbPut(record);
      } catch (err) {
        console.error('保存视频失败:', err);
        failedNames.push(file.name);
        continue;
      }
      try {
        VP.playlist.push({
          id: record.id,
          type: 'video',
          name: record.name,
          size: record.size,
          addedAt: record.addedAt
        });
        addedCount++;
      } catch (err) {
        try { await VP.dbDelete(id); } catch (e) {}
        failedNames.push(file.name);
      }
    }

    await VP.savePlaylistMeta();
    VP.renderPlaylist();
    VP.renderTagBar();

    if (!VP.hasVideo && playlistLength() > 0) {
      await switchToFirstVideo();
    }

    VP.hideToast();
    VP.updateStorageInfo();

    if (failedNames.length > 0) {
      const preview = failedNames.slice(0, 5).join('\n');
      const more = failedNames.length > 5 ? `\n…等 ${failedNames.length} 个` : '';
      VP.dlgAlert(
        `成功添加 ${addedCount} 个视频，${failedNames.length} 个失败（可能是存储空间不足）：\n\n${preview}${more}`,
        '部分添加失败'
      );
    }
  };

  // ===== 文件夹引用 =====
  VP.openFolder = async function () {
    if (!VP.env.isTauri) {
      VP.dlgAlert(
        '「打开文件夹」功能仅在 PakePlus 打包的桌面版可用。\n\n' +
        '浏览器版本请使用「导入视频」按钮。',
        '仅桌面版支持'
      );
      return;
    }

    if (!VP.env.tauriDialog || !VP.env.tauriFs) {
      VP.dlgAlert(
        'Tauri 文件系统插件未正确加载。\n\n' +
        '请在 PakePlus 配置中确认已启用 dialog:allow-open 和 fs:allow-read-dir 权限。',
        '环境错误'
      );
      return;
    }

    let dir;
    try {
      dir = await VP.env.tauriDialog.open({
        directory: true,
        multiple: false,
        title: '选择视频文件夹'
      });
    } catch (err) {
      console.error('打开文件夹失败:', err);
      VP.dlgAlert('打开文件夹失败：' + (err && err.message ? err.message : err), '错误');
      return;
    }

    if (!dir) return;
    await VP.scanFolder(dir, true);
  };

  // ===== 自动匹配字幕（#14 新增） =====
  const SUBTITLE_EXT_RE = /\.(srt|vtt|ass|ssa)$/i;
  const VIDEO_EXT_RE = /\.(mp4|webm|mov|mkv|avi|flv|wmv|m4v|ogv)$/i;

  async function readSubtitleText(path) {
    if (!VP.env.tauriFs) return '';
    try {
      if (typeof VP.env.tauriFs.readFile === 'function') {
        const bytes = await VP.env.tauriFs.readFile(path);
        const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        // 先试 UTF-8（严格模式）
        try {
          let text = new TextDecoder('utf-8', { fatal: true }).decode(u8);
          if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
          return text;
        } catch (e) {
          // 回退 GBK
          try {
            let text = new TextDecoder('gbk').decode(u8);
            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
            return text;
          } catch (e2) {
            let text = new TextDecoder('utf-8').decode(u8);
            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
            return text;
          }
        }
      }
      if (typeof VP.env.tauriFs.readTextFile === 'function') {
        let text = await VP.env.tauriFs.readTextFile(path);
        if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        return text || '';
      }
    } catch (err) {
      console.warn('读取字幕失败:', path, err);
    }
    return '';
  }

  VP.autoMatchSubtitles = async function (videos, subtitles) {
    const LANG_SUFFIXES = [
      '',
      '.zh', '.zh-CN', '.zh-Hans', '.zh-Hant', '.chs', '.cht', '.cn', '.sc', '.tc', '.chi', '.zho',
      '.en', '.eng', '.en-US', '.en-GB',
      '.ja', '.jp', '.jpn',
      '.ko', '.kr', '.kor'
    ];

    const subsByDir = new Map();
    for (const sub of subtitles) {
      if (!subsByDir.has(sub.parentDir)) subsByDir.set(sub.parentDir, []);
      subsByDir.get(sub.parentDir).push(sub);
    }

    let matched = 0;
    let skipped = 0;

    for (const video of videos) {
      const videoId = VP.FILE_REF_PREFIX + video.fullPath;

      if (VP.subtitleMap[videoId]) {
        skipped++;
        continue;
      }

      const dirSubs = subsByDir.get(video.parentDir);
      if (!dirSubs || dirSubs.length === 0) continue;

      const videoBase = video.name.replace(/\.[^.]+$/, '');
      let found = null;

      for (const suffix of LANG_SUFFIXES) {
        const targetBase = (videoBase + suffix).toLowerCase();
        const hit = dirSubs.find(s => {
          const subBase = s.name.replace(/\.[^.]+$/, '').toLowerCase();
          return subBase === targetBase;
        });
        if (hit) { found = hit; break; }
      }

      if (!found) continue;

      const content = await readSubtitleText(found.fullPath);
      if (!content || content.trim() === '') continue;

      let captions;
      if (content.includes('[Script Info]')) {
        captions = VP.parseASS(content);
      } else {
        captions = VP.parseSRT(content);
      }
      if (!captions || captions.length === 0) {
        console.warn('字幕解析为空，跳过:', found.fullPath);
        continue;
      }

      VP.subtitleMap[videoId] = content;
      matched++;
    }

    if (matched > 0) VP.saveSubtitles();

    return { matched, skipped };
  };

  // ===== 扫描文件夹 =====
  VP.scanFolder = async function (dirPath, asRoot) {
    if (!dirPath) return;

    if (asRoot && !VP.rootDirs.includes(dirPath)) {
      VP.rootDirs.push(dirPath);
      VP.saveRootDirs();
    }

    VP.showToast('正在扫描文件夹…');

    const MAX_DEPTH = 8;
    const MAX_FILES = 5000;

    const videoEntries = [];
    const dirSet = new Set();
    const subtitleEntries = []; // 【#14】收集字幕文件

    async function walk(dir, depth) {
      if (depth > MAX_DEPTH) return;
      if (videoEntries.length >= MAX_FILES) return;

     let entries;
      try {
        entries = await VP.env.tauriFs.readDir(dir);
      } catch (err) {
        console.warn('跳过无法读取的目录:', dir, err);
        failedDirs.push(dir);
        return;
      }

      for (const e of entries) {
        if (videoEntries.length >= MAX_FILES) return;

        const name = e.name || '';
        const isFile = e.isFile === true || (e.isFile === undefined && !e.children);
        const fullPath = VP.joinPath(dir, name);

        if (isFile) {
          if (SUBTITLE_EXT_RE.test(name)) {
            subtitleEntries.push({ name, fullPath, parentDir: dir });
          } else if (VIDEO_EXT_RE.test(name)) {
            videoEntries.push({ name, fullPath, parentDir: dir });
            let d = dir;
            while (d && d.length >= dirPath.length) {
              dirSet.add(d);
              if (d === dirPath) break;
              const parent = VP.dirname(d);
              if (!parent || parent === d) break;
              d = parent;
            }
          }
        } else if (depth < MAX_DEPTH) {
          await walk(fullPath, depth + 1);
        }
      }
    }

    await walk(dirPath, 1);

    if (videoEntries.length === 0) {
      VP.hideToast();
      VP.dlgAlert('该文件夹及其子文件夹下没有找到视频文件', '提示');
      return;
    }

    videoEntries.sort((a, b) =>
      a.name.localeCompare(b.name, 'zh-CN', { numeric: true, sensitivity: 'base' })
    );

    VP.showToast(`正在读取 ${videoEntries.length} 个文件的大小…`);
    const sizeMap = new Map();
    const CONCURRENCY = 8;
    for (let i = 0; i < videoEntries.length; i += CONCURRENCY) {
      const batch = videoEntries.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (v) => {
        const size = await VP.getFileSize(v.fullPath);
        sizeMap.set(v.fullPath, size);
      }));
    }

    // 【#14】匹配字幕
    let subtitleMatchResult = { matched: 0, skipped: 0 };
    if (subtitleEntries.length > 0) {
      VP.showToast(`正在匹配字幕…`);
      try {
        subtitleMatchResult = await VP.autoMatchSubtitles(videoEntries, subtitleEntries);
      } catch (e) {
        console.warn('字幕匹配失败:', e);
      }
    }

    let addedVideos = 0;
    let addedDirs = 0;

    const sortedDirs = Array.from(dirSet).sort((a, b) => a.length - b.length);
    for (const d of sortedDirs) {
      const dirId = VP.DIR_PREFIX + d;
      if (VP.playlist.find(p => p.id === dirId)) continue;

      const rel = d.slice(dirPath.length).replace(/^[\\/]+/, '');
      const segs = rel ? rel.split(/[\\/]/) : [];
      const displayName = segs.length > 0 ? segs[segs.length - 1] : d.split(/[\\/]/).pop();

      VP.playlist.push({
        id: dirId,
        type: 'dir',
        name: displayName,
        path: d,
        addedAt: Date.now(),
        isFileRef: false
      });
      addedDirs++;
    }

    for (const v of videoEntries) {
      const id = VP.FILE_REF_PREFIX + v.fullPath;
      if (VP.playlist.find(p => p.id === id)) continue;

      const size = sizeMap.get(v.fullPath);
      VP.playlist.push({
        id,
        type: 'video',
        name: v.name,
        path: v.fullPath,
        size: size === undefined ? -1 : size,
        addedAt: Date.now(),
        isFileRef: true
      });
      addedVideos++;
    }

    try { localStorage.setItem(VP.LAST_DIR_KEY, dirPath); } catch (e) {}

    await VP.savePlaylistMeta();
    VP.renderPlaylist();
    VP.renderTagBar();
    VP.updateFolderPathBar();
    VP.hideToast();

        const truncated = videoEntries.length >= MAX_FILES;
    if (addedVideos === 0 && addedDirs === 0 && subtitleMatchResult.matched === 0) {
      VP.showOSD(VP.ICONS.info, '文件夹内容已在列表中');
    } else {
      let msg = '';
      if (addedDirs > 0) msg += `${addedDirs} 个文件夹`;
      if (addedVideos > 0) msg += (msg ? '、' : '') + `${addedVideos} 个视频`;
      if (subtitleMatchResult.matched > 0) msg += (msg ? '、' : '') + `${subtitleMatchResult.matched} 个字幕`;
      if (truncated) msg += `（已达上限 ${MAX_FILES}）`;
      if (failedDirs.length > 0) msg += `，${failedDirs.length} 个目录无法读取`;
      VP.showOSD(VP.ICONS.check, `已添加 ${msg}`);
    }

    if (!VP.hasVideo && playlistLength() > 0) {
      await switchToFirstVideo();
    }
  };

  VP.refreshFolder = async function () {
    if (VP.rootDirs.length === 0) {
      VP.dlgAlert('还没有添加任何根目录，请先「打开文件夹」', '提示');
      return;
    }
    for (const dir of VP.rootDirs) {
      await VP.scanFolder(dir, false);
    }
  };

  VP.checkAllFileRefs = async function () {
    if (!VP.env.isTauri) return;
    const refs = VP.playlist.filter(p => VP.isFileRef(p));
    if (refs.length === 0) {
      VP.dlgAlert('当前没有文件夹引用的视频可检查', '提示');
      return;
    }

    VP.showToast(`正在检查 ${refs.length} 个文件…`);

    const missingIds = [];
    const CONCURRENCY = 8;
    for (let i = 0; i < refs.length; i += CONCURRENCY) {
      const batch = refs.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (ref) => {
        const exists = await VP.fileExists(ref.path);
        if (!exists) missingIds.push(ref.id);
      }));
    }

    VP.hideToast();

    VP.playlist.forEach(v => {
      if (!VP.isFileRef(v)) return;
      v.missing = missingIds.includes(v.id);
    });
    await VP.savePlaylistMeta();

    dom.playlistItems.querySelectorAll('.playlist-item').forEach(el => {
      el.classList.remove('file-missing');
    });
    missingIds.forEach(id => {
      const el = dom.playlistItems.querySelector(`.playlist-item[data-id="${CSS.escape(id)}"]`);
      if (el) el.classList.add('file-missing');
    });

    VP.updateCheckFilesButton(missingIds.length);

    if (missingIds.length === 0) {
      VP.showOSD(VP.ICONS.check, `全部 ${refs.length} 个文件都正常`);
    } else {
      const ok = await VP.dlgConfirm(
        `发现 ${missingIds.length} 个视频文件已丢失（原文件被删除或移动）。\n\n是否从列表中移除这些失效的引用？`,
        '文件丢失',
        { danger: true, okText: '移除失效项', cancelText: '保留' }
      );
      if (ok) {
        VP.showToast(`正在移除 ${missingIds.length} 个失效项…`);
        await VP.purgeChildData(missingIds);
        VP.playlist = VP.playlist.filter(p => !missingIds.includes(p.id));

        if (!VP.hasVideo) {
          if (VP.currentObjectURL) {
            URL.revokeObjectURL(VP.currentObjectURL);
            VP.currentObjectURL = null;
          }
          dom.video.removeAttribute('src');
          dom.video.load();
          VP.setControlsEnabled(false);
          dom.placeholder.classList.remove('hidden');
          VP.updatePlayPauseIcon();
        }

        await VP.savePlaylistMeta();
        VP.renderPlaylist();
        VP.renderTagBar();
        VP.updateFolderPathBar();
        VP.updateStorageInfo();
        VP.updateCheckFilesButton(0);

        VP.hideToast();
        VP.showOSD(VP.ICONS.check, `已移除 ${missingIds.length} 个失效项`);

        if (!VP.hasVideo && playlistLength() > 0) {
          await switchToFirstVideo();
        }
      }
    }
  };

  VP.updateCheckFilesButton = function (missingCount) {
    if (!dom.checkFilesBtn) return;
    if (missingCount > 0) {
      dom.checkFilesBtn.classList.add('has-alert');
      dom.checkFilesBtn.title = `${missingCount} 个文件丢失，点击查看`;
    } else {
      dom.checkFilesBtn.classList.remove('has-alert');
      dom.checkFilesBtn.title = '检查所有引用文件是否存在';
    }
  };

  // ===== 路径栏 =====
  VP.updateFolderPathBar = function () {
    if (!VP.env.isTauri) return;
    if (!dom.folderPathBar || !dom.folderPathText) return;

    if (VP.searchQuery) {
      const count = VP.playlist.filter(v => !VP.isDirNode(v) && VP.matchesFilters(v)).length;
      dom.folderPathBar.style.display = 'flex';
      dom.folderPathBackBtn.style.display = 'none';
      dom.folderPathText.innerHTML =
        `<span class="folder-path-crumb active">搜索「${VP.escapeHtml(VP.searchQuery)}」 · ${count} 个结果</span>`;
      return;
    }

    const hasAny = VP.playlist.some(p => VP.isDirNode(p) || VP.isFileRef(p));
    if (!hasAny) {
      dom.folderPathBar.style.display = 'none';
      return;
    }

    dom.folderPathBar.style.display = 'flex';
    dom.folderPathBackBtn.style.display = VP.currentPath === null ? 'none' : 'flex';

    if (VP.currentPath === null) {
      const n = VP.rootDirs.length;
      dom.folderPathText.innerHTML = n > 0
        ? `<span class="folder-path-crumb active">${n} 个根目录</span>`
        : `<span class="folder-path-crumb">未添加文件夹</span>`;
      return;
    }

    const sep = VP.currentPath.includes('\\') ? '\\' : '/';
    const segs = VP.splitPath(VP.currentPath);
    if (segs.length === 0) {
      dom.folderPathText.innerHTML = `<span class="folder-path-crumb active">${VP.escapeHtml(VP.currentPath)}</span>`;
      return;
    }

    const rootDir = VP.rootDirs.find(r =>
      VP.currentPath === r || VP.currentPath.startsWith(r + sep)
    );

    let displaySegs = segs;
    if (rootDir) {
      const rootSegs = VP.splitPath(rootDir);
      displaySegs = segs.slice(rootSegs.length - 1);
    }

    let acc = rootDir || (segs.length > 0 ? segs[0] + sep : '');

    const parts = [];
    displaySegs.forEach((seg, idx) => {
      if (idx > 0 || !rootDir) {
        acc = acc.endsWith(sep) ? acc + seg : acc + sep + seg;
      } else {
        acc = rootDir + sep + seg;
      }

      const isLast = idx === displaySegs.length - 1;
      const isRoot = rootDir && acc === rootDir;
      const displaySeg = VP.getDirDisplayName(acc, seg);

      if (parts.length > 0) {
        parts.push(`<span class="folder-path-sep">${sep}</span>`);
      }
      parts.push(
        `<span class="folder-path-crumb ${isLast ? 'active' : ''}" data-path="${VP.escapeHtml(acc)}"${isRoot ? ' data-root="1"' : ''}>${VP.escapeHtml(displaySeg)}</span>`
      );
    });

    if (displaySegs.length === 0 && rootDir) {
      const rootName = VP.getDirDisplayName(rootDir, rootDir.split(/[\\/]/).pop() || rootDir);
      parts.push(`<span class="folder-path-crumb active">${VP.escapeHtml(rootName)}</span>`);
    }

    dom.folderPathText.innerHTML = parts.join('');
  };

})(window.VP);