/* ============================================================
 * app.js —— 设置、快捷键、配置导入导出、事件绑定、启动编排
 * 依赖：core.js, env.js, player.js, playlist.js
 * ============================================================ */

(function (VP) {
  'use strict';

  const { dom } = VP;

  // ===== 通用点击波纹 =====
  function attachRipple(el) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = wave.style.height = size + 'px';
      wave.style.left = (e.clientX - rect.left - size / 2) + 'px';
      wave.style.top = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    });
  }

  // ===== 设置 =====
  VP.saveSettings = function () {
    try { localStorage.setItem(VP.SETTINGS_KEY, JSON.stringify(VP.settings)); } catch (e) {}
  };

  VP.loadSettings = function () {
    try {
      const raw = localStorage.getItem(VP.SETTINGS_KEY);
      if (raw) VP.settings = { ...VP.settings, ...JSON.parse(raw) };
    } catch (e) {}
    VP.applySettings();
    VP.updateSettingsUI();
  };

  VP.applySettings = function () {
    const video = dom.video;
    video.playbackRate = VP.settings.speed;
    video.className = '';
    if (VP.settings.ratio === 'fill') video.classList.add('ratio-fill');
    else if (VP.settings.ratio === '16-9') video.classList.add('ratio-16-9');
    else if (VP.settings.ratio === '4-3') video.classList.add('ratio-4-3');
    else if (VP.settings.ratio === '21-9') video.classList.add('ratio-21-9');

    const filters = [];
    if (VP.settings.brightness !== 100) filters.push(`brightness(${VP.settings.brightness}%)`);
    if (VP.settings.contrast !== 100) filters.push(`contrast(${VP.settings.contrast}%)`);
    if (VP.settings.saturation !== 100) filters.push(`saturate(${VP.settings.saturation}%)`);
    video.style.filter = filters.length ? filters.join(' ') : 'none';
  };

  VP.updateSettingsUI = function () {
    document.querySelectorAll('#speedControl button').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.speed) === VP.settings.speed);
    });
    
    const speedValEl = document.getElementById('speedValue');
    if (speedValEl) {
      speedValEl.textContent = VP.settings.speed === 1 ? '1x' : VP.settings.speed + 'x';
    }

    document.querySelectorAll('#ratioControl button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ratio === VP.settings.ratio);
    });

    const bSlider = document.getElementById('brightnessSlider');
    if (bSlider) bSlider.value = VP.settings.brightness;
    const bVal = document.getElementById('brightnessValue');
    if (bVal) bVal.textContent = VP.settings.brightness + '%';

    const cSlider = document.getElementById('contrastSlider');
    if (cSlider) cSlider.value = VP.settings.contrast;
    const cVal = document.getElementById('contrastValue');
    if (cVal) cVal.textContent = VP.settings.contrast + '%';

    const sSlider = document.getElementById('saturationSlider');
    if (sSlider) sSlider.value = VP.settings.saturation;
    const sVal = document.getElementById('saturationValue');
    if (sVal) sVal.textContent = VP.settings.saturation + '%';
  };

  // ===== 根目录持久化 =====
  VP.loadRootDirs = function () {
    try {
      const raw = localStorage.getItem(VP.ROOT_DIRS_KEY);
      VP.rootDirs = raw ? JSON.parse(raw) : [];
    } catch (e) { VP.rootDirs = []; }

    try {
      const lastDir = localStorage.getItem(VP.LAST_DIR_KEY);
      if (lastDir && !VP.rootDirs.includes(lastDir)) {
        VP.rootDirs.push(lastDir);
        localStorage.setItem(VP.ROOT_DIRS_KEY, JSON.stringify(VP.rootDirs));
      }
    } catch (e) {}
  };

  VP.saveRootDirs = function () {
    try {
      localStorage.setItem(VP.ROOT_DIRS_KEY, JSON.stringify(VP.rootDirs));
    } catch (e) {}
  };

  // ===== 存储空间 =====
  VP.updateStorageInfo = async function () {
    if (!navigator.storage || !navigator.storage.estimate) {
      dom.storageUsed.textContent = '当前浏览器不支持';
      dom.storageQuota.textContent = '—';
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? (usage / quota) * 100 : 0;

      dom.storageBarFill.style.width = Math.min(percent, 100) + '%';
      if (percent > 80) dom.storageBarFill.classList.add('warning');
      else dom.storageBarFill.classList.remove('warning');

      dom.storageUsed.textContent = `已用 ${VP.formatSize(usage)}`;
      dom.storageQuota.textContent = `总量 ${VP.formatSize(quota)}（${percent.toFixed(1)}%）`;
    } catch (e) {
      dom.storageUsed.textContent = '无法获取';
      dom.storageQuota.textContent = '—';
    }
  };

  // ===== 快捷键 =====
  VP.saveShortcuts = function () {
    try {
      const toSave = {};
      Object.keys(VP.shortcuts).forEach(key => {
        toSave[key] = { code: VP.shortcuts[key].code };
      });
      localStorage.setItem(VP.SHORTCUTS_KEY, JSON.stringify(toSave));
    } catch (e) {}
  };

  VP.loadShortcuts = function () {
    const cloned = JSON.parse(JSON.stringify(VP.DEFAULT_SHORTCUTS));
    try {
      const raw = localStorage.getItem(VP.SHORTCUTS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.keys(cloned).forEach(key => {
          if (saved[key] && saved[key].code) {
            cloned[key].code = saved[key].code;
            cloned[key].label = VP.keyToLabel(saved[key].code);
          }
        });
      }
    } catch (e) {}
    VP.shortcuts = cloned;
    VP.saveShortcuts();
  };

  VP.keyToLabel = function (code) {
    if (!code) return '—';
    if (code === 'Space') return 'Space';
    if (code === 'Enter') return '回车';
    if (code === 'Escape') return 'Esc';
    if (code === 'Tab') return 'Tab';
    if (code === 'Backspace') return '退格';
    if (code === 'Delete') return 'Del';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Arrow')) {
      const map = { Left: '←', Right: '→', Up: '↑', Down: '↓' };
      return map[code.slice(5)] || code;
    }
    const symbolMap = {
      'Comma': ',', 'Period': '.', 'Slash': '/', 'Semicolon': ';',
      'Quote': "'", 'BracketLeft': '[', 'BracketRight': ']',
      'Backslash': '\\', 'Minus': '-', 'Equal': '=', 'Backquote': '`'
    };
    if (symbolMap[code]) return symbolMap[code];
    if (code.startsWith('F') && code.length <= 3) return code;
    return code;
  };

  VP.findConflictName = function (code, excludeKey) {
    const conflictKey = Object.keys(VP.shortcuts).find(k => {
      if (k === excludeKey) return false;
      return VP.shortcuts[k].code === code;
    });
    return conflictKey ? VP.shortcuts[conflictKey].name : null;
  };

  VP.renderShortcuts = function () {
    const list = dom.shortcutList;
    list.innerHTML = '';
    Object.keys(VP.shortcuts).forEach(key => {
      const item = VP.shortcuts[key];
      const isEditing = VP.editingShortcut === key;

      const row = document.createElement('div');
      row.className = 'shortcut-row' + (isEditing ? ' editing' : '');
      row.dataset.key = key;
      row.innerHTML = `
        <div class="shortcut-name">
          <svg viewBox="0 0 24 24">${item.icon}</svg>
          <div class="shortcut-name-text">
            <span class="shortcut-name-label">${item.name}</span>
            <span class="shortcut-conflict-msg"></span>
          </div>
        </div>
        <div class="shortcut-key">
          <span class="shortcut-badge">${isEditing ? '按下按键…' : item.label}</span>
          <button class="shortcut-edit-btn" data-edit="${key}" title="${isEditing ? '取消' : '修改'}">
            ${isEditing
              ? `<svg viewBox="0 0 24 24">${VP.ICONS.close}</svg>`
              : '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'}
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.edit;
        VP.editingShortcut = VP.editingShortcut === key ? null : key;
        VP.renderShortcuts();
      });
    });
  };

  VP.trySetShortcut = function (key, code) {
    const conflictName = VP.findConflictName(code, key);
    if (conflictName) {
      const row = dom.shortcutList.querySelector(`.shortcut-row[data-key="${key}"]`);
      if (row) {
        const msg = row.querySelector('.shortcut-conflict-msg');
        if (msg) msg.textContent = `与「${conflictName}」冲突`;
        row.classList.add('conflict');
        row.style.animation = 'none';
        void row.offsetWidth;
        row.style.animation = '';
        setTimeout(() => row.classList.remove('conflict'), 2200);
      }
      return false;
    }
    VP.shortcuts[key].code = code;
    VP.shortcuts[key].label = VP.keyToLabel(code);
    VP.saveShortcuts();
    VP.updateKeyBadges();
    return true;
  };

  VP.resetShortcutsToDefault = async function () {
    const ok = await VP.dlgConfirm('确定要恢复默认快捷键吗？', '恢复默认');
    if (!ok) return;
    VP.shortcuts = JSON.parse(JSON.stringify(VP.DEFAULT_SHORTCUTS));
    VP.saveShortcuts();
    VP.renderShortcuts();
    VP.updateKeyBadges();
    VP.showOSD(VP.ICONS.check, '已恢复默认快捷键');
  };

  VP.updateKeyBadges = function () {
    if (!VP.showKeyBadges) {
      document.body.classList.add('hide-key-badges');
      return;
    }
    document.body.classList.remove('hide-key-badges');
    document.querySelectorAll('[data-badge]').forEach(badge => {
      const key = badge.dataset.badge;
      if (VP.shortcuts[key]) badge.textContent = VP.shortcuts[key].label;
    });
  };

  VP.saveBadgesSetting = function () {
    try { localStorage.setItem(VP.BADGES_KEY, VP.showKeyBadges ? '1' : '0'); } catch (e) {}
  };

  VP.loadBadgesSetting = function () {
    try {
      const raw = localStorage.getItem(VP.BADGES_KEY);
      VP.showKeyBadges = raw === null ? true : raw === '1';
    } catch (e) { VP.showKeyBadges = true; }
    dom.toggleBadges.classList.toggle('on', VP.showKeyBadges);
    VP.updateKeyBadges();
  };

  // ===== 播放列表折叠 =====
  VP.loadPlaylistCollapsed = function () {
    try {
      const raw = localStorage.getItem(VP.PLAYLIST_COLLAPSED_KEY);
      if (raw === '1') {
        dom.playlistPanel.classList.add('collapsed');
        dom.togglePlaylistBtn.classList.add('collapsed');
      }
    } catch (e) {}
  };

  VP.savePlaylistCollapsed = function (collapsed) {
    try { localStorage.setItem(VP.PLAYLIST_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (e) {}
  };

  VP.togglePlaylist = function () {
    const collapsed = dom.playlistPanel.classList.toggle('collapsed');
    dom.togglePlaylistBtn.classList.toggle('collapsed', collapsed);
    VP.savePlaylistCollapsed(collapsed);
  };

  // ===== 设置面板 =====
  VP.openSettings = function () {
    dom.settingsPanel.classList.add('show');
    dom.settingsOverlay.classList.add('show');
    VP.showControls();
    VP.updateStorageInfo();
    VP.updateAboutEnv();
    VP.syncSubtitleStyleUI();
  };

  VP.closeSettings = function () {
    dom.settingsPanel.classList.remove('show');
    dom.settingsOverlay.classList.remove('show');
    VP.editingShortcut = null;
    VP.renderShortcuts();
    VP.resetControlsTimer();
  };

  VP.toggleSettings = function () {
    if (dom.settingsPanel.classList.contains('show')) VP.closeSettings();
    else VP.openSettings();
  };

  VP.updateAboutEnv = function () {
    if (!dom.aboutEnvValue) return;
    dom.aboutEnvValue.textContent = VP.env.isTauri ? '桌面版（PakePlus）' : '浏览器';
  };

  // ===== 配置导出 / 导入 =====
  VP.buildConfigJson = function () {
    const lines = [];
    lines.push('{');
    lines.push('  "_readme": "这是视频播放器的配置文件。包含播放设置、字幕样式、快捷键配置、界面偏好。修改后可通过播放器设置 → 数据 → 导入配置来恢复。注意：所有以 _ 开头的字段都是中文注释，导入时会被自动忽略。",');
    lines.push('');
    lines.push('  "_导出时间": "' + new Date().toLocaleString('zh-CN') + '",');
    lines.push('');
    lines.push('  "version": ' + VP.CONFIG_VERSION + ',');
    lines.push('');
    lines.push('  "_version说明": "配置格式版本号，用于未来兼容性判断。当前版本为 ' + VP.CONFIG_VERSION + '。",');
    lines.push('');
    lines.push('  "exportedAt": "' + new Date().toISOString() + '",');
    lines.push('');
    lines.push('  "_exportedAt说明": "导出时的 ISO 时间戳。",');
    lines.push('');
    lines.push('  "_settings说明": "===== 播放设置 =====",');
    lines.push('');
    lines.push('  "settings": {');
    lines.push('');
    lines.push('    "_speed说明": "播放速度倍率，范围 0.5 ~ 2.0",');
    lines.push('    "speed": ' + VP.settings.speed + ',');
    lines.push('');
    lines.push('    "_ratio说明": "画面比例。可选值：contain(适应) / fill(铺满) / 16-9 / 4-3 / 21-9",');
    lines.push('    "ratio": "' + VP.settings.ratio + '",');
    lines.push('');
    lines.push('    "_brightness说明": "亮度百分比，范围 50 ~ 150，100 表示原亮度",');
    lines.push('    "brightness": ' + VP.settings.brightness + ',');
    lines.push('');
    lines.push('    "_contrast说明": "对比度百分比，范围 50 ~ 150，100 表示原对比度",');
    lines.push('    "contrast": ' + VP.settings.contrast + ',');
    lines.push('');
    lines.push('    "_saturation说明": "饱和度百分比，范围 0 ~ 200，100 表示原饱和度",');
    lines.push('    "saturation": ' + VP.settings.saturation);
    lines.push('  },');
    lines.push('');
    lines.push('  "_subtitleStyle说明": "===== 字幕样式 =====",');
    lines.push('');
    lines.push('  "subtitleStyle": {');
    lines.push('');
    lines.push('    "_fontSize说明": "字号（px），范围 12 ~ 48",');
    lines.push('    "fontSize": ' + VP.subtitleStyle.fontSize + ',');
    lines.push('');
    lines.push('    "_color说明": "字体颜色，十六进制如 #ffffff",');
    lines.push('    "color": "' + VP.subtitleStyle.color + '",');
    lines.push('');
    lines.push('    "_bgOpacity说明": "背景不透明度，0 ~ 100",');
    lines.push('    "bgOpacity": ' + VP.subtitleStyle.bgOpacity + ',');
    lines.push('');
    lines.push('    "_outline说明": "文字描边宽度（px），0 ~ 6",');
    lines.push('    "outline": ' + VP.subtitleStyle.outline + ',');
    lines.push('');
    lines.push('    "_position说明": "垂直位置，可选 bottom / middle / top",');
    lines.push('    "position": "' + VP.subtitleStyle.position + '"');
    lines.push('  },');
    lines.push('');
    lines.push('  "_shortcuts说明": "===== 快捷键配置 =====",');
    lines.push('');
    lines.push('  "_shortcuts_code说明": "code 字段是键盘事件的 code 值，例如 Space（空格）、ArrowLeft（左箭头）、KeyM（M 键）、Digit1（数字 1）等。如需修改，请通过播放器界面操作，不建议手动改。",');
    lines.push('');
    lines.push('  "shortcuts": {');

    const shortcutKeys = Object.keys(VP.shortcuts);
    shortcutKeys.forEach((key, idx) => {
      const item = VP.shortcuts[key];
      lines.push('');
      lines.push('    "_' + key + '说明": "' + item.name + '",');
      lines.push('    "' + key + '": { "code": "' + item.code + '" }' + (idx < shortcutKeys.length - 1 ? ',' : ''));
    });

    lines.push('  },');
    lines.push('');
    lines.push('  "_preferences说明": "===== 界面偏好 =====",');
    lines.push('');
    lines.push('  "preferences": {');
    lines.push('');
    lines.push('    "_showKeyBadges说明": "是否在控制栏按钮上显示快捷键角标。true = 显示，false = 隐藏。",');
    lines.push('    "showKeyBadges": ' + VP.showKeyBadges);
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
  };

  VP.stripComments = function (obj) {
    if (Array.isArray(obj)) return obj.map(VP.stripComments);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const k of Object.keys(obj)) {
        if (k.startsWith('_')) continue;
        out[k] = VP.stripComments(obj[k]);
      }
      return out;
    }
    return obj;
  };

  VP.exportConfig = function () {
    const json = VP.buildConfigJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const filename = `video-player-config-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    VP.showOSD(VP.ICONS.check, '配置已导出');
  };

  VP.importConfig = function (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawConfig = JSON.parse(e.target.result);
        if (!rawConfig || typeof rawConfig !== 'object') throw new Error('文件格式错误');
        if (!rawConfig.version) throw new Error('缺少版本号字段');
        if (rawConfig.version > VP.CONFIG_VERSION) {
          throw new Error('配置来自更高版本（v' + rawConfig.version + '），请升级播放器');
        }

        const config = VP.stripComments(rawConfig);
        const newSettings = config.settings || null;
        const newSubtitleStyle = config.subtitleStyle || null;
        const newShortcuts = config.shortcuts || null;
        const newPreferences = config.preferences || null;

        if (!newSettings && !newShortcuts && !newSubtitleStyle) throw new Error('配置内容为空');

        if (newSettings) {
          VP.settings = {
            speed: typeof newSettings.speed === 'number' ? newSettings.speed : 1,
            ratio: typeof newSettings.ratio === 'string' ? newSettings.ratio : 'contain',
            brightness: typeof newSettings.brightness === 'number' ? newSettings.brightness : 100,
            contrast: typeof newSettings.contrast === 'number' ? newSettings.contrast : 100,
            saturation: typeof newSettings.saturation === 'number' ? newSettings.saturation : 100
          };
          localStorage.setItem(VP.SETTINGS_KEY, JSON.stringify(VP.settings));
        }

        if (newSubtitleStyle) {
          VP.subtitleStyle = {
            fontSize: typeof newSubtitleStyle.fontSize === 'number' ? newSubtitleStyle.fontSize : 24,
            color: typeof newSubtitleStyle.color === 'string' ? newSubtitleStyle.color : '#ffffff',
            bgOpacity: typeof newSubtitleStyle.bgOpacity === 'number' ? newSubtitleStyle.bgOpacity : 75,
            outline: typeof newSubtitleStyle.outline === 'number' ? newSubtitleStyle.outline : 2,
            position: ['bottom', 'middle', 'top'].includes(newSubtitleStyle.position)
              ? newSubtitleStyle.position : 'bottom'
          };
          localStorage.setItem(VP.SUBTITLE_STYLE_KEY, JSON.stringify(VP.subtitleStyle));
        }

        if (newShortcuts) {
          const merged = JSON.parse(JSON.stringify(VP.DEFAULT_SHORTCUTS));
          Object.keys(merged).forEach(key => {
            if (newShortcuts[key] && newShortcuts[key].code) {
              merged[key].code = newShortcuts[key].code;
              merged[key].label = VP.keyToLabel(newShortcuts[key].code);
            }
          });
          VP.shortcuts = merged;
          const toSave = {};
          Object.keys(VP.shortcuts).forEach(k => { toSave[k] = { code: VP.shortcuts[k].code }; });
          localStorage.setItem(VP.SHORTCUTS_KEY, JSON.stringify(toSave));
        }

        if (newPreferences && typeof newPreferences.showKeyBadges === 'boolean') {
          VP.showKeyBadges = newPreferences.showKeyBadges;
          localStorage.setItem(VP.BADGES_KEY, VP.showKeyBadges ? '1' : '0');
        }

        VP.applySettings();
        VP.updateSettingsUI();
        VP.applySubtitleStyle();
        VP.syncSubtitleStyleUI();
        VP.renderShortcuts();
        VP.updateKeyBadges();
        dom.toggleBadges.classList.toggle('on', VP.showKeyBadges);

        VP.hideToast();
        setTimeout(async () => {
          await VP.dlgAlert('配置导入成功！页面将刷新以应用新配置。', '导入成功');
          location.reload();
        }, 200);
      } catch (err) {
        VP.hideToast();
        VP.dlgAlert('导入失败：' + err.message + '\n请确认选择的是本播放器导出的配置文件。', '导入失败');
      }
    };
    reader.onerror = () => {
      VP.hideToast();
      VP.dlgAlert('读取文件失败', '错误');
    };
    VP.showToast('正在读取配置…');
    reader.readAsText(file);
  };

  // ===== 启动恢复 =====
  VP.initFromDB = async function () {
    try {
      VP.loadRootDirs();
      VP.loadVideoProgress();
      VP.loadWatched();
      VP.loadRenames();
      VP.loadTags();
      VP.loadDirNames();
      VP.loadSubtitles();
      VP.loadSubtitleStyle();

      const metaList = VP.loadPlaylistMeta();
      if (metaList.length === 0) { VP.renderPlaylist(); VP.renderTagBar(); return; }

      VP.showToast('正在恢复播放列表…');

      const blobMeta = metaList.filter(m =>
        !m.isDir &&
        !(m.id && m.id.startsWith(VP.DIR_PREFIX)) &&
        !m.isFileRef &&
        !(m.id && m.id.startsWith(VP.FILE_REF_PREFIX))
      );

      const recordMap = new Map();
      if (blobMeta.length > 0) {
        try {
          const allRecords = await VP.dbGetAll();
          allRecords.forEach(r => recordMap.set(r.id, r));
        } catch (e) {
          console.error('【致命错误】读取 IndexedDB 失败！:', e);
          VP.dlgAlert('读取本地视频数据失败，可能是缓存损坏。\n请尝试清除软件缓存或重装。\n\n错误详情：' + e.message, '数据异常');
        }
      }

      VP.playlist = [];
      metaList.forEach(m => {
        if (m.isDir || (m.id && m.id.startsWith(VP.DIR_PREFIX))) {
          VP.playlist.push({
            id: m.id,
            type: 'dir',
            name: m.name,
            path: m.path,
            addedAt: m.addedAt,
            isFileRef: false
          });
        }
        else if (m.isFileRef || (m.id && m.id.startsWith(VP.FILE_REF_PREFIX))) {
          VP.playlist.push({
            id: m.id,
            type: 'video',
            name: m.name,
            path: m.path,
            size: m.size === -1 ? -1 : (m.size || 0),
            addedAt: m.addedAt,
            isFileRef: true,
            missing: !!m.missing
          });
        }
        else if (recordMap.has(m.id)) {
          const r = recordMap.get(m.id);
          VP.playlist.push({
            id: r.id,
            type: 'video',
            name: r.name,
            size: r.size,
            addedAt: r.addedAt
          });
        }
        else {
          VP.playlist.push({
            id: m.id,
            type: 'video',
            name: m.name,
            size: m.size || 0,
            addedAt: m.addedAt
          });
        }
      });

      try {
        const lastView = localStorage.getItem(VP.LAST_VIEW_KEY);
        if (lastView && VP.rootDirs.some(r =>
            lastView === r || lastView.startsWith(r + '\\') || lastView.startsWith(r + '/'))) {
          VP.currentPath = lastView;
        } else {
          VP.currentPath = null;
        }
      } catch (e) { VP.currentPath = null; }

      await VP.savePlaylistMeta();
      VP.renderPlaylist();
      VP.renderTagBar();
      VP.updateFolderPathBar();

      const savedCurrentId = localStorage.getItem(VP.CURRENT_KEY);
      if (savedCurrentId && VP.playlist.find(v => v.id === savedCurrentId)) {
        await VP.switchToVideo(savedCurrentId);
      } else if (VP.playlist.length > 0) {
        const firstVideo = VP.playlist.find(v => !VP.isDirNode(v));
        if (firstVideo) await VP.switchToVideo(firstVideo.id);
      }
      VP.hideToast();
    } catch (err) {
      console.error('初始化严重崩溃:', err);
      VP.hideToast();
      VP.renderPlaylist();
      VP.renderTagBar();
      VP.dlgAlert('启动初始化失败：' + err.message, '错误');
    }
  };

  // ===== 续播提示 =====
  VP.showResumeToastIfNeeded = function (id) {
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;
    if (VP.watchedSet.has(id)) return;

    const prog = VP.videoProgress[id];
    if (!prog || prog.time < 10) return;
    if (prog.duration && prog.time / prog.duration > VP.WATCH_THRESHOLD) return;

    const displayName = VP.getDisplayName(item);
    dom.resumeTitle.textContent = displayName;
    dom.resumeSubtitle.textContent = `上次看到 ${VP.formatTime(prog.time)} / ${VP.formatTime(prog.duration)}`;

    dom.resumeToast.classList.add('show');

    const newContinue = dom.resumeContinueBtn.cloneNode(true);
    const newRestart = dom.resumeRestartBtn.cloneNode(true);
    dom.resumeContinueBtn.parentNode.replaceChild(newContinue, dom.resumeContinueBtn);
    dom.resumeRestartBtn.parentNode.replaceChild(newRestart, dom.resumeRestartBtn);
    dom.resumeContinueBtn = newContinue;
    dom.resumeRestartBtn = newRestart;

    let dismissed = false;
    const hide = () => {
      if (dismissed) return;
      dismissed = true;
      dom.resumeToast.classList.remove('show');
    };

    newContinue.addEventListener('click', () => {
      try {
        const target = Math.min(prog.time, dom.video.duration - 1);
        dom.video.currentTime = target;
        VP.showOSD(VP.ICONS.play, '已恢复上次进度',
          VP.formatTime(target) + ' / ' + VP.formatTime(dom.video.duration));
      } catch (e) {}
      hide();
    });

    newRestart.addEventListener('click', () => {
      dom.video.currentTime = 0;
      if (VP.videoProgress[id]) {
        delete VP.videoProgress[id];
        VP.saveVideoProgress();
      }
      VP.showOSD(VP.ICONS.play, '从头开始播放');
      hide();
    });

    if (dom.resumeCloseBtn) {
      const newClose = dom.resumeCloseBtn.cloneNode(true);
      dom.resumeCloseBtn.parentNode.replaceChild(newClose, dom.resumeCloseBtn);
      dom.resumeCloseBtn = newClose;
      newClose.addEventListener('click', hide);
    }

    setTimeout(hide, 5000);
  };

  // ===== 日期时间显示 =====
  function updateClock() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} 周${weekdays[now.getDay()]}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const dateEl = document.getElementById('clockDate');
    const timeEl = document.getElementById('clockTime');
    if (dateEl) dateEl.textContent = dateStr;
    if (timeEl) timeEl.textContent = timeStr;

    if (VP.updateClockVisibility) VP.updateClockVisibility();
  }

  function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ===== 事件绑定 =====
  if (dom.openFolderBtn) dom.openFolderBtn.addEventListener('click', VP.openFolder);
  if (dom.checkFilesBtn) dom.checkFilesBtn.addEventListener('click', VP.checkAllFileRefs);
  if (dom.folderRefreshBtn) dom.folderRefreshBtn.addEventListener('click', VP.refreshFolder);
  if (dom.folderPathBackBtn) dom.folderPathBackBtn.addEventListener('click', VP.goBackFolder);

  dom.settingsBtn.addEventListener('click', VP.openSettings);
  dom.settingsClose.addEventListener('click', VP.closeSettings);
  dom.settingsOverlay.addEventListener('click', VP.closeSettings);

  dom.playerArea.addEventListener('mousemove', () => VP.showControls());
  dom.playerArea.addEventListener('mouseleave', () => {
    if (VP.controlsHideTimer) clearTimeout(VP.controlsHideTimer);
    VP.controlsHideTimer = setTimeout(VP.hideControls, 800);
  });

  dom.videoControls.addEventListener('mouseenter', () => {
    if (VP.controlsHideTimer) clearTimeout(VP.controlsHideTimer);
    dom.videoControls.classList.remove('hidden');
  });
  dom.videoControls.addEventListener('mouseleave', () => VP.resetControlsTimer());

  dom.togglePlaylistBtn.addEventListener('mouseenter', () => {
    if (VP.controlsHideTimer) clearTimeout(VP.controlsHideTimer);
    dom.togglePlaylistBtn.classList.remove('hidden');
    dom.videoControls.classList.remove('hidden');
  });
  dom.togglePlaylistBtn.addEventListener('mouseleave', () => VP.resetControlsTimer());

  dom.playerArea.addEventListener('touchstart', () => VP.showControls(), { passive: true });

  dom.video.addEventListener('play', () => {
    dom.centerPlayBtn.classList.remove('show');
    VP.resetControlsTimer();
  });
  dom.video.addEventListener('pause', () => {
    VP.showControls();
    if (VP.hasVideo) dom.centerPlayBtn.classList.add('show');
  });

  document.querySelectorAll('.settings-nav-item').forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. 切换左侧导航项状态
      document.querySelectorAll('.settings-nav-item').forEach(t => t.classList.remove('active'));
      // 2. 切换右侧内容区
      document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      const content = document.getElementById('tab-' + tabId);
      if (content) content.classList.add('active');

      // 3. 更新右侧顶部大标题
      const titleEl = document.getElementById('settingsMainTitle');
      if (titleEl) {
        titleEl.textContent = tab.textContent.trim();
      }

      // 4. 数据同步与刷新
      if (tabId === 'data') VP.updateStorageInfo();
      if (tabId === 'about') VP.updateAboutEnv();
      if (tabId === 'subtitle') VP.syncSubtitleStyleUI();
    });
  });

  document.querySelectorAll('#speedControl button').forEach(btn => {
    btn.addEventListener('click', () => {
      VP.settings.speed = parseFloat(btn.dataset.speed);
      dom.video.playbackRate = VP.settings.speed;
      VP.updateSettingsUI();
      VP.saveSettings();
    });
  });

  document.querySelectorAll('#ratioControl button').forEach(btn => {
    btn.addEventListener('click', () => {
      VP.settings.ratio = btn.dataset.ratio;
      VP.applySettings();
      VP.updateSettingsUI();
      VP.saveSettings();
    });
  });

  const brightnessSlider = document.getElementById('brightnessSlider');
  if (brightnessSlider) {
    brightnessSlider.addEventListener('input', (e) => {
      VP.settings.brightness = parseInt(e.target.value);
      const bVal = document.getElementById('brightnessValue');
      if (bVal) bVal.textContent = VP.settings.brightness + '%';
      VP.applySettings(); VP.saveSettings();
    });
  }

  const contrastSlider = document.getElementById('contrastSlider');
  if (contrastSlider) {
    contrastSlider.addEventListener('input', (e) => {
      VP.settings.contrast = parseInt(e.target.value);
      const cVal = document.getElementById('contrastValue');
      if (cVal) cVal.textContent = VP.settings.contrast + '%';
      VP.applySettings(); VP.saveSettings();
    });
  }

  const saturationSlider = document.getElementById('saturationSlider');
  if (saturationSlider) {
    saturationSlider.addEventListener('input', (e) => {
      VP.settings.saturation = parseInt(e.target.value);
      const sVal = document.getElementById('saturationValue');
      if (sVal) sVal.textContent = VP.settings.saturation + '%';
      VP.applySettings(); VP.saveSettings();
    });
  }

  dom.resetSettings.addEventListener('click', () => {
    VP.settings = { speed: 1, ratio: 'contain', brightness: 100, contrast: 100, saturation: 100 };
    VP.applySettings(); VP.updateSettingsUI(); VP.saveSettings();
    VP.showOSD(VP.ICONS.check, '已恢复默认设置');
  });

  // ===== 字幕样式配置（#11） =====
  if (dom.subtitleFontSizeSlider) {
    dom.subtitleFontSizeSlider.addEventListener('input', (e) => {
      VP.subtitleStyle.fontSize = parseInt(e.target.value);
      if (dom.subtitleFontSizeValue) dom.subtitleFontSizeValue.textContent = VP.subtitleStyle.fontSize + 'px';
      VP.applySubtitleStyle();
      VP.updateSubtitlePreview();
      VP.saveSubtitleStyle();
    });
  }

  if (dom.subtitleColorInput) {
    dom.subtitleColorInput.addEventListener('input', (e) => {
      VP.subtitleStyle.color = e.target.value;
      if (dom.subtitleColorValue) dom.subtitleColorValue.textContent = e.target.value.toUpperCase();
      if (dom.subtitleColorPresets) {
        dom.subtitleColorPresets.querySelectorAll('.color-preset').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.color.toLowerCase() === e.target.value.toLowerCase());
        });
      }
      VP.applySubtitleStyle();
      VP.updateSubtitlePreview();
      VP.saveSubtitleStyle();
    });
  }

  if (dom.subtitleColorPresets) {
    dom.subtitleColorPresets.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        VP.subtitleStyle.color = color;
        if (dom.subtitleColorInput) dom.subtitleColorInput.value = color;
        if (dom.subtitleColorValue) dom.subtitleColorValue.textContent = color.toUpperCase();
        dom.subtitleColorPresets.querySelectorAll('.color-preset').forEach(b => {
          b.classList.toggle('active', b.dataset.color.toLowerCase() === color.toLowerCase());
        });
        VP.applySubtitleStyle();
        VP.updateSubtitlePreview();
        VP.saveSubtitleStyle();
      });
    });
  }

  if (dom.subtitleBgOpacitySlider) {
    dom.subtitleBgOpacitySlider.addEventListener('input', (e) => {
      VP.subtitleStyle.bgOpacity = parseInt(e.target.value);
      if (dom.subtitleBgOpacityValue) dom.subtitleBgOpacityValue.textContent = VP.subtitleStyle.bgOpacity + '%';
      VP.applySubtitleStyle();
      VP.updateSubtitlePreview();
      VP.saveSubtitleStyle();
    });
  }

  if (dom.subtitleOutlineSlider) {
    dom.subtitleOutlineSlider.addEventListener('input', (e) => {
      VP.subtitleStyle.outline = parseInt(e.target.value);
      if (dom.subtitleOutlineValue) dom.subtitleOutlineValue.textContent = VP.subtitleStyle.outline + 'px';
      VP.applySubtitleStyle();
      VP.updateSubtitlePreview();
      VP.saveSubtitleStyle();
    });
  }

  if (dom.resetSubtitleSettings) {
    dom.resetSubtitleSettings.addEventListener('click', () => {
      VP.subtitleStyle = { ...VP.DEFAULT_SUBTITLE_STYLE };
      VP.applySubtitleStyle();
      VP.syncSubtitleStyleUI();
      VP.saveSubtitleStyle();
      VP.showOSD(VP.ICONS.check, '已恢复默认字幕样式');
    });
  }

  dom.resetShortcuts.addEventListener('click', VP.resetShortcutsToDefault);

  dom.toggleBadges.addEventListener('click', () => {
    VP.showKeyBadges = !VP.showKeyBadges;
    dom.toggleBadges.classList.toggle('on', VP.showKeyBadges);
    VP.saveBadgesSetting();
    VP.updateKeyBadges();
  });

  dom.playlistSearchInput.addEventListener('input', (e) => {
    VP.searchQuery = e.target.value.trim();
    dom.playlistSearchClear.classList.toggle('show', VP.searchQuery.length > 0);
    VP.renderPlaylist();
    VP.updateFolderPathBar();
  });

  dom.playlistSearchClear.addEventListener('click', () => {
    dom.playlistSearchInput.value = '';
    VP.searchQuery = '';
    dom.playlistSearchClear.classList.remove('show');
    VP.renderPlaylist();
    VP.updateFolderPathBar();
    dom.playlistSearchInput.focus();
  });

  dom.sortSelect.addEventListener('change', () => {
    VP.sortMode = dom.sortSelect.value;
    VP.saveSort();
    VP.renderPlaylist();
    if (VP.sortMode !== 'manual') {
      VP.showOSD(VP.ICONS.info, '已排序（拖动排序已禁用）');
    }
  });

  dom.sortDirBtn.addEventListener('click', () => {
    VP.sortDir = VP.sortDir === 'asc' ? 'desc' : 'asc';
    VP.updateSortDirIcon();
    VP.saveSort();
    if (VP.sortMode !== 'manual') VP.renderPlaylist();
  });

  dom.densityBtn.addEventListener('click', () => {
    VP.isCompact = !VP.isCompact;
    VP.applyDensity();
    VP.saveDensity();
    VP.showOSD(
      VP.ICONS.density,
      VP.isCompact ? '紧凑模式' : '宽松模式'
    );
  });

  dom.subtitleBtn.addEventListener('click', () => {
    if (!VP.hasVideo) {
      VP.showOSD(VP.ICONS.info, '请先播放视频再加载字幕');
      return;
    }
    dom.subtitleInput.click();
  });

  dom.subtitleInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      VP.loadSubtitle(e.target.files[0]);
    }
    dom.subtitleInput.value = '';
  });

  function enterSelectionMode() {
    VP.selectionMode = true;
    VP.selectedIds.clear();
    dom.playlistPanel.classList.add('selection-mode');
    dom.playlistToolbar.classList.add('active');
    VP.renderPlaylist();
  }

  function exitSelectionMode() {
    VP.selectionMode = false;
    VP.selectedIds.clear();
    dom.playlistPanel.classList.remove('selection-mode');
    dom.playlistToolbar.classList.remove('active');
    VP.renderPlaylist();
  }

  VP.enterSelectionMode = enterSelectionMode;
  VP.exitSelectionMode = exitSelectionMode;

  dom.selectModeBtn.addEventListener('click', () => {
    if (VP.selectionMode) exitSelectionMode();
    else enterSelectionMode();
  });

  dom.cancelSelectBtn.addEventListener('click', exitSelectionMode);

  dom.selectAllCheckbox.addEventListener('change', () => {
    if (dom.selectAllCheckbox.checked) {
      VP.playlist.forEach(v => {
        if (!VP.isDirNode(v) && VP.matchesFilters(v)) VP.selectedIds.add(v.id);
      });
    } else {
      VP.selectedIds.clear();
    }
    VP.renderPlaylist();
  });

  // ===== 批量删除 =====
  dom.batchDeleteBtn.addEventListener('click', async () => {
    const count = VP.selectedIds.size;
    if (count === 0) {
      VP.dlgAlert('请先选择要删除的视频', '提示');
      return;
    }

    const refCount = VP.playlist.filter(v =>
      VP.selectedIds.has(v.id) && VP.isFileRef(v)
    ).length;

    const showDeleteSource = VP.env.isTauri && refCount > 0;

    let confirmResult;
    if (showDeleteSource) {
      confirmResult = await VP.dlgConfirm(
        `确定要删除选中的 ${count} 个视频吗？\n其中 ${refCount} 个是文件引用。`,
        '批量删除',
        {
          danger: true,
          okText: '删除',
          checkbox: {
            label: `同时删除 ${refCount} 个源文件（不可恢复）`,
            defaultChecked: false,
            danger: true
          }
        }
      );
      if (!confirmResult || !confirmResult.ok) return;
    } else {
      const ok = await VP.dlgConfirm(`确定要删除选中的 ${count} 个视频吗？`, '批量删除', { danger: true, okText: '删除' });
      if (!ok) return;
      confirmResult = { ok: true, checked: false };
    }

    const deleteSource = showDeleteSource && confirmResult.checked;

    VP.showToast(`正在删除 ${count} 个视频…`);

    const ids = Array.from(VP.selectedIds);
    let deletedCurrent = false;
    const sourceDeleteFailed = [];

    for (const id of ids) {
      const it = VP.playlist.find(v => v.id === id);

      if (deleteSource && it && VP.isFileRef(it)) {
        try {
          const fs = VP.env.tauriFs;
          if (typeof fs.remove === 'function') {
            await fs.remove(it.path);
          } else {
            sourceDeleteFailed.push(it.name);
          }
        } catch (err) {
          console.error('删除源文件失败:', err);
          sourceDeleteFailed.push(it.name);
        }
      }

      if (it && !VP.isFileRef(it)) {
        try { await VP.dbDelete(id); } catch (err) {}
      }

      if (VP.videoProgress[id]) delete VP.videoProgress[id];
      if (VP.watchedSet.has(id)) VP.watchedSet.delete(id);
      if (VP.renameMap[id]) delete VP.renameMap[id];
      if (VP.tagMap[id]) delete VP.tagMap[id];
      if (VP.subtitleMap[id]) delete VP.subtitleMap[id];
      if (VP.currentVideoId === id) deletedCurrent = true;
    }
    VP.saveVideoProgress();
    VP.saveWatched();
    VP.saveRenames();
    VP.saveTags();
    VP.saveSubtitles();

    VP.playlist = VP.playlist.filter(v => !VP.selectedIds.has(v.id));

    if (deletedCurrent) {
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
    exitSelectionMode();
    VP.hideToast();

    if (deletedCurrent) {
      const first = VP.playlist.find(v => !VP.isDirNode(v));
      if (first) await VP.switchToVideo(first.id);
    }
    VP.renderTagBar();
    VP.updateStorageInfo();
    VP.updateFolderPathBar();

    if (sourceDeleteFailed.length > 0) {
      const preview = sourceDeleteFailed.slice(0, 5).join('\n');
      const more = sourceDeleteFailed.length > 5 ? `\n…等 ${sourceDeleteFailed.length} 个` : '';
      VP.dlgAlert(
        `列表项已移除，但以下 ${sourceDeleteFailed.length} 个源文件删除失败\n（可能被占用或权限不足）：\n\n${preview}${more}`,
        '部分源文件删除失败'
      );
    }
  });

  document.addEventListener('click', (e) => {
    if (!dom.itemContextMenu.classList.contains('show')) return;
    if (e.target.closest('#itemContextMenu')) return;
    if (e.target.closest('[data-menu]')) return;
    VP.closeContextMenu();
  });

  document.addEventListener('scroll', () => VP.closeContextMenu(), true);

  dom.menuOpenFolderBtn.addEventListener('click', () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    const item = VP.playlist.find(v => v.id === id);
    if (item && VP.isDirNode(item)) {
      VP.enterFolder(item.path);
    }
  });

  dom.menuRenameDirBtn.addEventListener('click', async () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    const item = VP.playlist.find(v => v.id === id);
    if (!item || !VP.isDirNode(item)) return;

    const currentDirName = VP.getDirDisplayName(item.path, item.name);
    const newName = await VP.dlgPrompt('输入新的目录名称：', currentDirName, '重命名目录');
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      VP.dlgAlert('名称不能为空', '提示');
      return;
    }
    if (trimmed === currentDirName) return;
    VP.dirNames[item.path] = trimmed;
    VP.saveDirNames();
    VP.renderPlaylist();
    VP.updateFolderPathBar();
    VP.showOSD(VP.ICONS.check, '目录已重命名',
      trimmed.length > 20 ? trimmed.slice(0, 20) + '…' : trimmed);
  });

  dom.menuPlayBtn.addEventListener('click', () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (id) VP.switchToVideo(id);
  });

  dom.menuInfoBtn.addEventListener('click', () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    VP.showVideoInfo(id);
  });

  dom.menuTagsBtn.addEventListener('click', () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    VP.showTagEditor(id);
  });

  dom.menuRenameBtn.addEventListener('click', async () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;

    if (VP.isDirNode(item)) {
      const currentDirName = VP.getDirDisplayName(item.path, item.name);
      const newName = await VP.dlgPrompt('输入新的目录名称：', currentDirName, '重命名目录');
      if (newName === null) return;
      const trimmed = newName.trim();
      if (!trimmed) {
        VP.dlgAlert('名称不能为空', '提示');
        return;
      }
      if (trimmed === currentDirName) return;
      VP.dirNames[item.path] = trimmed;
      VP.saveDirNames();
      VP.renderPlaylist();
      VP.updateFolderPathBar();
      VP.showOSD(VP.ICONS.check, '目录已重命名',
        trimmed.length > 20 ? trimmed.slice(0, 20) + '…' : trimmed);
      return;
    }

    const current = VP.getDisplayName(item);
    const newName = await VP.dlgPrompt('输入新的视频名称：', current, '重命名');
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      VP.dlgAlert('名称不能为空', '提示');
      return;
    }
    if (trimmed === current) return;
    VP.renameMap[id] = trimmed;
    VP.saveRenames();
    VP.renderPlaylist();
    VP.showOSD(VP.ICONS.check, '已重命名',
      trimmed.length > 20 ? trimmed.slice(0, 20) + '…' : trimmed);
  });

  dom.menuDeleteBtn.addEventListener('click', () => {
    const id = VP.menuTargetId;
    VP.closeContextMenu();
    if (!id) return;
    VP.removeVideo(id);
  });

  dom.importBtn.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) VP.addVideos(e.target.files);
    dom.fileInput.value = '';
  });

  dom.togglePlaylistBtn.addEventListener('click', VP.togglePlaylist);

  dom.centerPlayBtn.addEventListener('click', () => {
    VP.togglePlayPause();
    dom.centerPlayBtn.classList.remove('show');
  });

  function showVolumePopup() { dom.volumePopup.classList.add('show'); }

  function hideVolumePopup() {
    if (VP.volumeDragging) return;
    if (dom.volumePopup.matches(':hover')) return;
    if (dom.muteBtn.matches(':hover')) return;
    dom.volumePopup.classList.remove('show');
  }

  function setVolumeFromEvent(e) {
    const rect = dom.volumeVerticalSlider.getBoundingClientRect();
    let clientY;
    if (e.touches) clientY = e.touches[0].clientY;
    else clientY = e.clientY;

    let percent = ((rect.bottom - clientY) / rect.height) * 100;
    percent = Math.max(0, Math.min(100, percent));

    const vol = percent / 100;
    dom.video.volume = vol;
    dom.video.muted = vol === 0;

    VP.updateVolumeUI();
    VP.saveVolumeState();
  }

  dom.volumeVerticalSlider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    VP.volumeDragging = true;
    setVolumeFromEvent(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (VP.volumeDragging) setVolumeFromEvent(e);
  });

  document.addEventListener('mouseup', () => {
    if (VP.volumeDragging) {
      VP.volumeDragging = false;
      VP.saveVolumeState();
    }
  });

  dom.volumeVerticalSlider.addEventListener('touchstart', (e) => {
    e.preventDefault();
    VP.volumeDragging = true;
    setVolumeFromEvent(e);
  }, { passive: false });

  dom.volumeVerticalSlider.addEventListener('touchmove', (e) => {
    if (!VP.volumeDragging) return;
    e.preventDefault();
    setVolumeFromEvent(e);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (VP.volumeDragging) {
      VP.volumeDragging = false;
      VP.saveVolumeState();
    }
  });

  dom.volumePopupWrap.addEventListener('mouseenter', showVolumePopup);
  dom.volumePopupWrap.addEventListener('mouseleave', () => {
    setTimeout(hideVolumePopup, 120);
  });

  dom.muteBtn.addEventListener('click', () => {
    VP.toggleMute();
    VP.resetControlsTimer();
    showVolumePopup();
    setTimeout(hideVolumePopup, 1500);
  });

  dom.progressWrap.addEventListener('mousemove', (e) => {
    if (!VP.hasVideo || !dom.video.duration) return;
    const rect = dom.progressTrack.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));

    dom.progressHoverTime.style.left = clampedPercent + '%';
    dom.progressHoverTime.textContent = VP.formatTime((clampedPercent / 100) * dom.video.duration);
    dom.previewThumbnail.style.left = clampedPercent + '%';

    VP.requestPreviewAt(clampedPercent);
  });

  dom.progressWrap.addEventListener('mouseleave', () => {
    dom.previewThumbnail.classList.remove('show');
    if (VP.previewTimeout) {
      clearTimeout(VP.previewTimeout);
      VP.previewTimeout = null;
    }
    VP.lastPreviewTime = -1;
  });

  dom.progressWrap.addEventListener('mousedown', (e) => {
    if (!VP.hasVideo) return;
    VP.isDraggingProgress = true;
    dom.previewThumbnail.classList.remove('show');
    VP.seekFromEvent(e);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (VP.isDraggingProgress) VP.seekFromEvent(e);
  });

  document.addEventListener('mouseup', (e) => {
    if (VP.isDraggingProgress) {
      VP.isDraggingProgress = false;
      const percent = VP.seekFromEvent(e);
      if (percent !== undefined && dom.video.duration) {
        dom.video.currentTime = (percent / 100) * dom.video.duration;
        VP.recordCurrentProgress();
        VP.saveVideoProgress();
      }
      VP.resetControlsTimer();
    }
  });

  dom.progressWrap.addEventListener('touchstart', (e) => {
    if (!VP.hasVideo) return;
    VP.isDraggingProgress = true;
    VP.seekFromEvent(e);
  }, { passive: true });

  dom.progressWrap.addEventListener('touchmove', (e) => {
    if (!VP.isDraggingProgress) return;
    VP.seekFromEvent(e);
    e.preventDefault();
  }, { passive: false });

  dom.progressWrap.addEventListener('touchend', (e) => {
    if (!VP.isDraggingProgress) return;
    VP.isDraggingProgress = false;
    const t = e.changedTouches[0];
    if (t) {
      const rect = dom.progressTrack.getBoundingClientRect();
      let percent = ((t.clientX - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      if (dom.video.duration) {
        dom.video.currentTime = (percent / 100) * dom.video.duration;
        VP.recordCurrentProgress();
        VP.saveVideoProgress();
      }
    }
    VP.resetControlsTimer();
  });

  dom.playPauseBtn.addEventListener('click', () => { VP.togglePlayPause(); VP.resetControlsTimer(); });
  dom.lockBtn.addEventListener('click', () => { VP.toggleLock(); VP.resetControlsTimer(); });
  dom.fullscreenBtn.addEventListener('click', () => { VP.toggleFullscreen(); VP.resetControlsTimer(); });
  dom.prevBtn.addEventListener('click', () => { VP.playPrev(); VP.resetControlsTimer(); });
  dom.nextBtn.addEventListener('click', () => { VP.playNext(); VP.resetControlsTimer(); });

  document.addEventListener('fullscreenchange', VP.updateFullscreenIcon);

  let dragCounter = 0;
  dom.playerArea.addEventListener('dragenter', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter++;
    dom.dropOverlay.classList.add('active');
  });
  dom.playerArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
  dom.playerArea.addEventListener('dragleave', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) { dragCounter = 0; dom.dropOverlay.classList.remove('active'); }
  });
  dom.playerArea.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter = 0;
    dom.dropOverlay.classList.remove('active');
    if (e.dataTransfer.files.length > 0) VP.addVideos(e.dataTransfer.files);
  });

  let playlistDragCounter = 0;
  dom.playlistPanel.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault(); e.stopPropagation();
    playlistDragCounter++;
    dom.playlistDropOverlay.classList.add('active');
    dom.playlistPanel.classList.add('drag-over');
  });
  dom.playlistPanel.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault(); e.stopPropagation();
  });
  dom.playlistPanel.addEventListener('dragleave', (e) => {
    if (!e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault(); e.stopPropagation();
    playlistDragCounter--;
    if (playlistDragCounter <= 0) {
      playlistDragCounter = 0;
      dom.playlistDropOverlay.classList.remove('active');
      dom.playlistPanel.classList.remove('drag-over');
    }
  });
  dom.playlistPanel.addEventListener('drop', (e) => {
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    e.preventDefault(); e.stopPropagation();
    playlistDragCounter = 0;
    dom.playlistDropOverlay.classList.remove('active');
    dom.playlistPanel.classList.remove('drag-over');
    VP.addVideos(e.dataTransfer.files);
  });

  ['dragenter', 'dragover', 'drop'].forEach(name => {
    document.body.addEventListener(name, (e) => {
      if (dom.playerArea.contains(e.target) || dom.playlistPanel.contains(e.target)) return;
      e.preventDefault();
    });
  });

  document.addEventListener('dragover', (e) => {
    if (!VP.dragItemId) {
      VP.stopAutoScroll();
      return;
    }
    const rect = dom.playlistItems.getBoundingClientRect();
    const threshold = 60;
    if (e.clientY < rect.top + threshold && e.clientY > rect.top - 20) {
      VP.startAutoScroll(-1);
    } else if (e.clientY > rect.bottom - threshold && e.clientY < rect.bottom + 20) {
      VP.startAutoScroll(1);
    } else {
      VP.stopAutoScroll();
    }
  });

  document.addEventListener('dragend', VP.stopAutoScroll);
  document.addEventListener('drop', VP.stopAutoScroll);

  dom.video.addEventListener('loadedmetadata', () => {
    VP.updateDuration();
    VP.updateVolumeUI();
    VP.updateProgress();
    VP.updateNavButtons();
  });

  dom.video.addEventListener('timeupdate', () => {
    VP.updateProgress();
    VP.updateSubtitle();
  });

  dom.video.addEventListener('progress', VP.updateProgress);
  dom.video.addEventListener('play', VP.updatePlayPauseIcon);
  dom.video.addEventListener('pause', () => {
    VP.updatePlayPauseIcon();
    VP.recordCurrentProgress();
    VP.saveVideoProgress();
    VP.updateNavButtons();
  });
  dom.video.addEventListener('volumechange', () => {
    VP.updateVolumeUI();
    VP.saveVolumeState();
  });
  dom.video.addEventListener('waiting', () => dom.videoLoading.classList.add('show'));
  dom.video.addEventListener('playing', () => dom.videoLoading.classList.remove('show'));
  dom.video.addEventListener('canplay', () => dom.videoLoading.classList.remove('show'));
  dom.video.addEventListener('error', () => dom.videoLoading.classList.remove('show'));

  dom.video.addEventListener('ended', () => {
    if (VP.currentVideoId) {
      VP.markWatched(VP.currentVideoId);
      VP.renderPlaylist();
    }
    VP.updatePlayPauseIcon();
    const visible = VP.getVisibleVideos();
    const idx = visible.findIndex(v => v.id === VP.currentVideoId);
    if (idx >= 0 && idx < visible.length - 1) {
      VP.switchToVideo(visible[idx + 1].id);
    } else {
      dom.centerPlayBtn.classList.add('show');
    }
  });

  dom.video.addEventListener('dblclick', (e) => { e.stopPropagation(); VP.toggleFullscreen(); });

  let clickTimer = null;
  dom.video.addEventListener('click', (e) => {
    e.stopPropagation();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return; }
    clickTimer = setTimeout(() => { VP.togglePlayPause(); clickTimer = null; }, 200);
  });

  window.addEventListener('beforeunload', () => {
    if (VP.currentVideoId && VP.hasVideo) {
      VP.recordCurrentProgress();
      VP.saveVideoProgress();
    }
    VP.saveVolumeState();
  });

  dom.exportConfigBtn.addEventListener('click', VP.exportConfig);
  dom.importConfigBtn.addEventListener('click', () => dom.configInput.click());
  dom.configInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) VP.importConfig(e.target.files[0]);
    dom.configInput.value = '';
  });

  // ===== 键盘快捷键 =====
  document.addEventListener('keydown', (e) => {
    if (dom.dialogOverlay.classList.contains('show')) return;
    if (!dom.splash.classList.contains('hidden')) return;

    if (VP.editingShortcut) {
      e.preventDefault(); e.stopPropagation();
      if (e.code === 'Escape') {
        VP.editingShortcut = null;
        VP.renderShortcuts();
        return;
      }
      if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
           'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code)) return;
      const success = VP.trySetShortcut(VP.editingShortcut, e.code);
      if (success) {
        VP.editingShortcut = null;
        VP.renderShortcuts();
        VP.showOSD(VP.ICONS.check, '快捷键已更新');
      }
      return;
    }

    if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      dom.playlistSearchInput.focus();
      dom.playlistSearchInput.select();
      return;
    }

    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    if (e.code === 'Escape') {
      if (VP.selectionMode) { e.preventDefault(); exitSelectionMode(); return; }
      if (dom.settingsPanel.classList.contains('show')) { e.preventDefault(); VP.closeSettings(); return; }
      if (dom.resumeToast.classList.contains('show')) { dom.resumeToast.classList.remove('show'); return; }
      if (dom.itemContextMenu.classList.contains('show')) { VP.closeContextMenu(); return; }
      if (VP.isLocked) { e.preventDefault(); VP.toggleLock(); return; }
      if (VP.currentPath !== null) { e.preventDefault(); VP.goBackFolder(); return; }
    }

    const code = e.code;
    const action = Object.keys(VP.shortcuts).find(k => VP.shortcuts[k].code === code);
    if (!action) return;

    if (action === 'settings') { e.preventDefault(); VP.toggleSettings(); return; }
    if (action === 'togglePlaylist') { e.preventDefault(); VP.togglePlaylist(); return; }
    if (action === 'lock') { e.preventDefault(); VP.toggleLock(); return; }

    if (!VP.hasVideo) return;
    e.preventDefault();

    if (action === 'playPause') VP.showControls();

    switch (action) {
      case 'playPause': VP.togglePlayPause(); break;
      case 'seekBack':
        dom.video.currentTime = Math.max(0, dom.video.currentTime - 5);
        VP.showOSD(VP.shortcuts.seekBack.icon, '-5s', VP.currentTimeInfo());
        break;
      case 'seekForward':
        dom.video.currentTime = Math.min(dom.video.duration || 0, dom.video.currentTime + 5);
        VP.showOSD(VP.shortcuts.seekForward.icon, '+5s', VP.currentTimeInfo());
        break;
      case 'volumeUp':
        dom.video.volume = Math.min(1, dom.video.volume + 0.1);
        dom.video.muted = false; VP.updateVolumeUI(); VP.saveVolumeState();
        VP.showOSD(VP.shortcuts.volumeUp.icon, `音量 ${Math.round(dom.video.volume * 100)}%`, VP.currentTimeInfo());
        break;
      case 'volumeDown':
        dom.video.volume = Math.max(0, dom.video.volume - 0.1);
        if (dom.video.volume === 0) dom.video.muted = true;
        VP.updateVolumeUI(); VP.saveVolumeState();
        VP.showOSD(VP.shortcuts.volumeDown.icon, `音量 ${Math.round(dom.video.volume * 100)}%`, VP.currentTimeInfo());
        break;
      case 'mute': VP.toggleMute(); break;
      case 'fullscreen': VP.toggleFullscreen(); break;
      case 'next': VP.playNext(); break;
      case 'prev': VP.playPrev(); break;
    }
  });

  // ===== 清理旧格式快捷键 =====
  (function cleanupOldLabels() {
    try {
      const raw = localStorage.getItem(VP.SHORTCUTS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      let changed = false;
      Object.keys(saved).forEach(key => {
        if (saved[key] && (saved[key].label === '空格' || (!saved[key].code && saved[key].label))) {
          changed = true;
        }
      });
      if (changed) localStorage.removeItem(VP.SHORTCUTS_KEY);
    } catch (e) {
      localStorage.removeItem(VP.SHORTCUTS_KEY);
    }
  })();

  // ===== 初始化 =====
  VP.loadShortcuts();
  VP.renderShortcuts();
  VP.loadBadgesSetting();
  VP.loadVolumeState();
  VP.loadPlaylistCollapsed();
  VP.loadDensity();
  VP.loadSort();
  VP.setControlsEnabled(false);
  VP.updatePlayPauseIcon();
  VP.updateFullscreenIcon();
  VP.updateVolumeUI();
  VP.loadSettings();
  VP.loadSubtitleStyle();
  VP.updateAboutEnv();

  if (VP.env.isTauri) {
    if (dom.importBtn) dom.importBtn.style.display = 'none';
    if (dom.fileInput) dom.fileInput.remove();
  }

  VP.showControls();
  VP.updateStorageInfo();
  VP.renderTagBar();
  VP.updateFolderPathBar();

  // ===== 启动 =====
  (async function boot() {
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    startClock();

    let dataReady = false;
    let dismissed = false;

    function dismiss() {
      if (dismissed || !dataReady) return;
      dismissed = true;
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('touchstart', onTouch, true);
      dom.splash.classList.add('hidden');
      setTimeout(() => { dom.splash.style.display = 'none'; }, 700);
    }

    function onKey(e) {
      if (e.code === 'F12') return;
      if (e.ctrlKey && e.shiftKey) return;
      dismiss();
    }
    function onClick() { dismiss(); }
    function onTouch() { dismiss(); }

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('touchstart', onTouch, true);

    try {
      await VP.initFromDB();
    } catch (e) {
      console.warn('初始化失败:', e);
    }

    if (VP.env.isTauri) {
      const refs = VP.playlist.filter(p => VP.isFileRef(p));
      if (refs.length > 0) {
        setTimeout(async () => {
          const missingIds = [];
          const CONCURRENCY = 8;
          for (let i = 0; i < refs.length; i += CONCURRENCY) {
            const batch = refs.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(async (ref) => {
              const exists = await VP.fileExists(ref.path);
              if (!exists) missingIds.push(ref.id);
            }));
          }
          if (missingIds.length > 0) {
            VP.playlist.forEach(v => {
              if (!VP.isFileRef(v)) return;
              v.missing = missingIds.includes(v.id);
            });
            await VP.savePlaylistMeta();
            missingIds.forEach(id => {
              const el = dom.playlistItems.querySelector(`.playlist-item[data-id="${CSS.escape(id)}"]`);
              if (el) el.classList.add('file-missing');
            });
            VP.updateCheckFilesButton(missingIds.length);
            VP.showOSD(VP.ICONS.warning, `发现 ${missingIds.length} 个文件已丢失`,
              '点击播放列表的 ⓘ 按钮查看');
          }
        }, 800);
      }
    }

    dataReady = true;
    const hint = document.getElementById('splashHint');
    if (hint) hint.textContent = '按任意键进入';

    setTimeout(dismiss, 10000);
  })();

})(window.VP);