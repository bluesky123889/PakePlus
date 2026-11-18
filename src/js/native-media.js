/**
 * 桌面端系统媒体控制（Windows SMTC）桥接
 * ------------------------------------------------------------
 * 只在 Tauri 外壳里生效（window.__TAURI__ 存在且注册了 media 插件）。
 * 浏览器 / PakePlus 里第一行就会退出，不影响任何现有逻辑。
 *
 * 与 js/media-session.js 的分工：
 *   - media-session.js 走标准 navigator.mediaSession（浏览器 / Edge PWA 用）
 *   - 本文件走 tauri-plugin-media 的原生命令（桌面壳用，能进 Windows 快捷设置与蓝牙耳机）
 */
(function () {
  'use strict';

  const MB = window.MB;
  if (!MB) return;

  const tauri = window.__TAURI__;
  const invokeRaw = tauri && tauri.core && tauri.core.invoke;
  if (typeof invokeRaw !== 'function') return;

  const audio = document.getElementById('audio');
  const titleEl = document.getElementById('songTitle');
  if (!audio) return;

  const UNKNOWN_ARTIST = '未知艺术家';
  const PLUGIN = 'plugin:media|';
  const SEEK_STEP = 10;

  let ready = false;
  let lastSongId = null;
  let lastPositionAt = 0;
  let rafPending = 0;

  function invoke(cmd, args) {
    return invokeRaw(PLUGIN + cmd, args || {});
  }

  function currentSong() {
    const list = MB.playlist;
    if (!list || !list.length) return null;
    return list[MB.currentIndex] || null;
  }

  function statusOf() {
    if (!audio.src) return 'stopped';
    return audio.paused ? 'paused' : 'playing';
  }

  function repeatOf(mode) {
    if (mode === 1) return 'track';
    if (mode === 2) return 'none';
    return 'list';
  }

  // 封面：只接受 base64 的 data URL，转成纯 base64 交给插件
  function coverBase64(cover) {
    if (typeof cover !== 'string') return null;
    if (cover.indexOf('data:image/') !== 0) return null;
    const marker = ';base64,';
    const at = cover.indexOf(marker);
    if (at < 0) return null;
    const b64 = cover.slice(at + marker.length);
    if (!b64 || b64.length > 2_000_000) return null;
    return b64;
  }

  function clampedPosition() {
    const pos = audio.currentTime || 0;
    const dur = audio.duration;
    if (isFinite(dur) && dur > 0) return Math.min(Math.max(pos, 0), dur);
    return Math.max(pos, 0);
  }

  function pushMetadata(song) {
    if (!song) {
      invoke('clear_metadata').catch(function () {});
      return;
    }
    const metadata = {
      title: song.title || '未知标题',
      artist: song.artist && song.artist !== UNKNOWN_ARTIST ? song.artist : null,
      album: song.album || null,
      albumArtist: null,
      duration: (typeof song.duration === 'number' && isFinite(song.duration) && song.duration > 0) ? song.duration : null,
      artworkUrl: null,
      artworkData: coverBase64(song.cover)
    };
    invoke('set_metadata', { metadata: metadata }).catch(function (e) {
      console.warn('[native-media] set_metadata 失败', e);
    });
    pushPlayback();
  }

  function pushPlayback() {
    const song = currentSong();
    if (!song) return;
    const info = {
      status: statusOf(),
      position: clampedPosition(),
      shuffle: false,
      repeatMode: repeatOf(MB.loopMode),
      playbackRate: audio.playbackRate || 1
    };
    invoke('set_playback_info', { info: info }).catch(function (e) {
      console.warn('[native-media] set_playback_info 失败', e);
    });
  }

  // 进度用单独的超轻命令推送，节流到 ~1 秒一次
  function pushPosition(force) {
    const now = Date.now();
    if (!force && now - lastPositionAt < 900) return;
    lastPositionAt = now;
    const dur = audio.duration;
    if (!isFinite(dur) || dur <= 0) return;
    invoke('set_position', { position: clampedPosition() }).catch(function () {});
  }

  function seekBy(delta) {
    const dur = audio.duration;
    if (!isFinite(dur) || dur <= 0) return;
    audio.currentTime = Math.min(dur, Math.max(0, audio.currentTime + delta));
    pushPlayback();
  }

  function applyControl(type, value) {
    switch (type) {
      case 'play':
        if (audio.paused) MB.player.togglePlay();
        break;
      case 'pause':
        if (!audio.paused) audio.pause();
        break;
      case 'playPause':
        MB.player.togglePlay();
        break;
      case 'stop':
        audio.pause();
        try { audio.currentTime = 0; } catch (e) {}
        pushPlayback();
        break;
      case 'next':
        if (MB.playlist.length) MB.player.loadSong(MB.currentIndex + 1, true);
        break;
      case 'previous':
        if (MB.playlist.length) MB.player.loadSong(MB.currentIndex - 1, true);
        break;
      case 'fastForward':
        seekBy(SEEK_STEP);
        break;
      case 'rewind':
        seekBy(-SEEK_STEP);
        break;
      case 'seekTo':
      case 'setPosition':
        if (typeof value === 'number' && isFinite(value)) {
          const dur = audio.duration;
          audio.currentTime = Math.max(0, isFinite(dur) && dur > 0 ? Math.min(value, dur) : value);
          pushPlayback();
        }
        break;
      case 'setPlaybackRate':
        if (typeof value === 'number' && isFinite(value) && value > 0) {
          audio.playbackRate = value;
          pushPlayback();
        }
        break;
      default:
        break;
    }
  }

  // Rust 侧 serialize 后：单元变体是字符串 "next"，带参变体是对象 { "seekTo": 12.3 }
  function handleControl(payload) {
    if (!payload || !payload.eventType) return;
    const raw = payload.eventType;
    if (typeof raw === 'string') {
      applyControl(raw, null);
      return;
    }
    if (typeof raw === 'object') {
      const keys = Object.keys(raw);
      if (!keys.length) return;
      applyControl(keys[0], raw[keys[0]]);
    }
  }

  function listenControls() {
    const ev = tauri.event;
    if (!ev || typeof ev.listen !== 'function') return;
    try {
      const p = ev.listen('media-control-event', function (event) {
        handleControl(event && event.payload);
      });
      if (p && typeof p.catch === 'function') p.catch(function (e) {
        console.warn('[native-media] 订阅 media-control-event 失败', e);
      });
    } catch (e) {
      console.warn('[native-media] 订阅媒体事件失败', e);
    }
  }

  // 歌曲变化检测：与 media-session.js 相同，只认 id
  function checkSong() {
    const song = currentSong();
    if (!song) {
      if (lastSongId !== null) {
        lastSongId = null;
        invoke('clear_metadata').catch(function () {});
      }
      return;
    }
    if (song.id === lastSongId) return;
    lastSongId = song.id;
    pushMetadata(song);
  }

  function schedule() {
    if (rafPending) return;
    rafPending = requestAnimationFrame(function () {
      rafPending = 0;
      checkSong();
    });
  }

  function bindAudio() {
    audio.addEventListener('loadedmetadata', function () {
      checkSong();
      pushPosition(true);
    });
    audio.addEventListener('durationchange', function () { pushPosition(true); });
    audio.addEventListener('play', function () {
      checkSong();
      pushPlayback();
    });
    audio.addEventListener('pause', function () { pushPlayback(); pushPosition(true); });
    audio.addEventListener('ended', function () { pushPlayback(); });
    audio.addEventListener('timeupdate', function () { pushPosition(false); });
    audio.addEventListener('emptied', function () { checkSong(); });
  }

  async function init() {
    // 插件没装或没放行权限时，invoke 会 reject，这里静默退出
    try {
      await invoke('is_enabled');
    } catch (e) {
      console.info('[native-media] 未检测到 media 插件，跳过系统媒体控制');
      return;
    }

    try {
      await invoke('initialize_session', {
        request: { appId: 'com.melodybox.desktop', appName: 'MelodyBox' }
      });
    } catch (e) {
      console.warn('[native-media] initialize_session 失败', e);
    }

    ready = true;
    listenControls();
    bindAudio();

    if (titleEl && typeof MutationObserver === 'function') {
      new MutationObserver(schedule).observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    checkSong();
  }

  window.MBNativeMedia = {
    isReady: function () { return ready; },
    refresh: function () { checkSong(); pushPlayback(); }
  };

  init();
})();
