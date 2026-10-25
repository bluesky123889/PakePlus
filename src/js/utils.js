(function (global) {
  'use strict';

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

  function secToTime(sec) {
    if (!sec || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function timeToSec(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number(timeStr) || 0;
  }

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

  function debounce(fn, wait) {
    let t = null;
    const wrapped = function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
    wrapped.flush = function (...args) {
      clearTimeout(t);
      fn.apply(this, args);
    };
    wrapped.cancel = function () { clearTimeout(t); t = null; };
    return wrapped;
  }

  function normalizeAssetPath(p) {
    let s = String(p).replace(/\\/g, '/').replace(/\/+/g, '/');
    const segs = [];
    for (const seg of s.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') { segs.pop(); continue; }
      segs.push(seg);
    }
    return '/' + segs.join('/');
  }

  global.Utils = {
    formatTime,
    formatBytes,
    secToTime,
    timeToSec,
    formatKeyName,
    debounce,
    normalizeAssetPath
  };
})(window);