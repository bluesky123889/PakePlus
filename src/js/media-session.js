/**
 * 任务栏 / 系统媒体控制集成
 * ------------------------------------------------------------
 * 1) 窗口标题同步：Windows 任务栏按钮的悬停提示与标题栏显示「歌名 - 歌手」
 * 2) Media Session（Windows SMTC）：系统媒体浮层、锁屏界面、耳机线控与键盘媒体键
 *
 * 本文件不修改 player.js 的任何逻辑，只监听 audio 元素事件和 #songTitle 的文本变化，
 * 因此可以安全地放在 ui.js 之后加载。
 */
(function () {
  'use strict';

  const MB = window.MB;
  if (!MB) return;

  const audio = document.getElementById('audio');
  const titleEl = document.getElementById('songTitle');
  if (!audio) return;

  const BASE_TITLE = 'MelodyBox · 全屏双栏音乐播放器';
  const UNKNOWN_ARTIST = '未知艺术家';
  const ms = (typeof navigator !== 'undefined' && 'mediaSession' in navigator) ? navigator.mediaSession : null;

  let lastKey = null;
  let lastPosAt = 0;
  let pendingRaf = 0;

  function currentSong() {
    const list = MB.playlist;
    if (!list || !list.length) return null;
    return list[MB.currentIndex] || null;
  }

  function displayTitle(song) {
    if (!song) return BASE_TITLE;
    const title = (song.title || '未知标题').trim();
    const artist = (song.artist && song.artist !== UNKNOWN_ARTIST) ? song.artist.trim() : '';
    return (artist ? title + ' - ' + artist : title) + ' · MelodyBox';
  }

  function applyTitle(song) {
    const next = displayTitle(song);
    if (document.title !== next) document.title = next;

    // Tauri 桌面端：同步原生窗口标题（任务栏上显示的就是它）
    const win = window.__TAURI__ && window.__TAURI__.window;
    if (win && typeof win.getCurrent === 'function') {
      try {
        const p = win.getCurrent().setTitle(next);
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } catch (e) {}
    }
  }

  function artworkOf(song) {
    const cover = song && song.cover;
    if (!cover || typeof cover !== 'string' || cover.indexOf('data:image/') !== 0) return [];
    // 只接受 base64 的位图；默认的 SVG 封面（非 base64）交给系统会解析失败，直接不传
    const m = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(cover);
    if (!m) return [];
    return [{ src: cover, sizes: '512x512', type: m[1] }];
  }

  function applyState(song) {
    if (!ms) return;
    try {
      ms.playbackState = !song ? 'none' : (audio.paused ? 'paused' : 'playing');
    } catch (e) {}
  }

  function applyPosition(force) {
    if (!ms || typeof ms.setPositionState !== 'function') return;
    const duration = audio.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const now = performance.now();
    if (!force && now - lastPosAt < 900) return;
    lastPosAt = now;
    const position = Math.min(Math.max(audio.currentTime || 0, 0), duration);
    try {
      ms.setPositionState({
        duration: duration,
        playbackRate: audio.playbackRate || 1,
        position: position
      });
    } catch (e) {}
  }

  function applyMetadata(force) {
    const song = currentSong();
    const key = song
      ? [song.id, song.title, song.artist, song.album, song.cover ? song.cover.length : 0].join('\u0001')
      : '';

    applyTitle(song);

    if (!force && key === lastKey) {
      applyState(song);
      return;
    }
    lastKey = key;

    if (ms && typeof window.MediaMetadata === 'function') {
      try {
        ms.metadata = song ? new window.MediaMetadata({
          title: song.title || '未知标题',
          artist: song.artist || UNKNOWN_ARTIST,
          album: song.album || '',
          artwork: artworkOf(song)
        }) : null;
      } catch (e) {}
    }

    applyState(song);
    applyPosition(true);
  }

  // 合并同一帧内的多次触发，避免 loadSong 连续赋值时重复构造 MediaMetadata
  function schedule() {
    if (pendingRaf) return;
    pendingRaf = requestAnimationFrame(function () {
      pendingRaf = 0;
      applyMetadata(false);
    });
  }

  function bindAction(name, handler) {
    if (!ms || typeof ms.setActionHandler !== 'function') return;
    try { ms.setActionHandler(name, handler); } catch (e) {}
  }

  function seekBy(delta) {
    const duration = audio.duration;
    if (!isFinite(duration) || duration <= 0) return;
    audio.currentTime = Math.min(duration, Math.max(0, audio.currentTime + delta));
    applyPosition(true);
  }

  bindAction('play', function () {
    if (audio.paused) MB.player.togglePlay();
  });
  bindAction('pause', function () {
    if (!audio.paused) audio.pause();
  });
  bindAction('stop', function () {
    audio.pause();
    try { audio.currentTime = 0; } catch (e) {}
  });
  bindAction('previoustrack', function () {
    if (MB.playlist.length) MB.player.loadSong(MB.currentIndex - 1, true);
  });
  bindAction('nexttrack', function () {
    if (MB.playlist.length) MB.player.loadSong(MB.currentIndex + 1, true);
  });
  bindAction('seekbackward', function (details) {
    seekBy(-((details && details.seekOffset) || 10));
  });
  bindAction('seekforward', function (details) {
    seekBy((details && details.seekOffset) || 10);
  });
  bindAction('seekto', function (details) {
    if (!details || typeof details.seekTime !== 'number') return;
    try {
      if (details.fastSeek && typeof audio.fastSeek === 'function') audio.fastSeek(details.seekTime);
      else audio.currentTime = details.seekTime;
    } catch (e) {}
    applyPosition(true);
  });

  audio.addEventListener('loadedmetadata', function () {
    applyMetadata(true);
    applyPosition(true);
  });
  audio.addEventListener('durationchange', function () {
    applyPosition(true);
  });
  audio.addEventListener('play', function () {
    applyMetadata(false);
    applyState(currentSong());
  });
  audio.addEventListener('pause', function () {
    applyState(currentSong());
    applyPosition(true);
  });
  audio.addEventListener('ended', function () {
    applyState(currentSong());
  });
  audio.addEventListener('timeupdate', function () {
    applyPosition(false);
  });
  // 清空播放列表时 loadSong 会移除 src，此时把标题和元数据复原
  audio.addEventListener('emptied', function () {
    applyMetadata(true);
  });

  // 歌曲信息变化（标题文本被 loadSong 重写）时立即同步
  if (titleEl && typeof MutationObserver === 'function') {
    new MutationObserver(schedule).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  applyMetadata(true);

  // 供外部手动刷新（例如以后支持歌词作为副标题）
  window.MBMediaSession = {
    refresh: function () { applyMetadata(true); },
    setPosition: function () { applyPosition(true); }
  };
})();
