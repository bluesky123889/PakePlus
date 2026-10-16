/* ============================================================
 * env.js —— 运行环境检测 + Tauri 引用 + 路径/文件工具
 * 依赖：core.js（window.VP）
 * ============================================================ */

(function (VP) {
  'use strict';

  // ===== 运行环境状态（放在 VP 上，不碰 window）=====
  VP.env = {
    isTauri: false,
    tauriDialog: null,
    tauriFs: null,
    tauriCore: null
  };

  // ===== Tauri 引用初始化 =====
  VP.initTauriRefs = function () {
    if (!VP.env.isTauri) return;
    const T = window.__TAURI__ || {};
    VP.env.tauriDialog = T.dialog || (T.plugin && T.plugin.dialog) || null;
    VP.env.tauriFs = T.fs || (T.plugin && T.plugin.fs) || null;
    VP.env.tauriCore = T.core || null;
  };

  // ===== 环境检测（可重试）=====
  VP.detectTauri = function () {
    const detected = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
    if (detected && !VP.env.isTauri) {
      VP.env.isTauri = true;
      document.body.classList.add('is-tauri');
      VP.initTauriRefs();
      if (typeof VP.updateFolderPathBar === 'function') VP.updateFolderPathBar();
    }
    return VP.env.isTauri;
  };

  // 首次立即检测
  if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
    VP.env.isTauri = true;
    document.body.classList.add('is-tauri');
    VP.initTauriRefs();
  }

  document.addEventListener('DOMContentLoaded', VP.detectTauri);
  setTimeout(VP.detectTauri, 500);

  // ===== 路径工具 =====
  VP.isFileRef = function (item) {
    return !!(item && item.id && item.id.startsWith(VP.FILE_REF_PREFIX));
  };

  VP.joinPath = function (dir, name) {
    if (!dir) return name;
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir.endsWith(sep) ? dir + name : dir + sep + name;
  };

  VP.dirname = function (fullPath) {
    if (!fullPath) return '';
    const idx = Math.max(fullPath.lastIndexOf('\\'), fullPath.lastIndexOf('/'));
    return idx > 0 ? fullPath.slice(0, idx) : '';
  };

  VP.pathToVideoUrl = function (fullPath) {
    if (!fullPath) return '';
    const core = VP.env.tauriCore;
    if (core && typeof core.convertFileSrc === 'function') {
      try {
        return core.convertFileSrc(fullPath);
      } catch (e) {
        console.warn('convertFileSrc 失败，回退到 file://', e);
      }
    }
    let normalized = fullPath.replace(/\\/g, '/');
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    const encoded = normalized.split('/').map((seg, i) => {
      if (i === 1 && /^[A-Za-z]:$/.test(seg)) return seg;
      return encodeURIComponent(seg);
    }).join('/');
    return 'file://' + encoded;
  };

  VP.getMimeFromName = function (name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = {
      mp4: 'video/mp4', m4v: 'video/mp4',
      webm: 'video/webm', ogv: 'video/ogg',
      mov: 'video/quicktime', mkv: 'video/x-matroska',
      avi: 'video/x-msvideo', flv: 'video/x-flv',
      wmv: 'video/x-ms-wmv'
    };
    return map[ext] || 'video/mp4';
  };

  // ===== 文件工具 =====
  VP.fileExists = async function (path) {
    if (!VP.env.isTauri || !VP.env.tauriFs) return true;
    try {
      if (typeof VP.env.tauriFs.exists === 'function') {
        return await VP.env.tauriFs.exists(path);
      }
    } catch (e) {
      console.warn('exists 检测失败:', e);
    }
    return true;
  };

  VP.getFileSize = async function (path) {
    if (!VP.env.isTauri || !VP.env.tauriFs) return 0;
    try {
      if (typeof VP.env.tauriFs.stat === 'function') {
        const s = await VP.env.tauriFs.stat(path);
        if (s && typeof s.size === 'number') return s.size;
      }
      if (typeof VP.env.tauriFs.metadata === 'function') {
        const m = await VP.env.tauriFs.metadata(path);
        if (m && typeof m.size === 'number') return m.size;
      }
    } catch (e) {
      console.warn('读取文件大小失败:', path, e);
    }
    return 0;
  };

})(window.VP);