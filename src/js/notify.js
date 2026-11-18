/**
 * 系统通知（Windows 通知中心）集成
 * ------------------------------------------------------------
 * 发送顺序（自动降级）：
 *   1. Tauri 通知插件  window.__TAURI__.notification（PakePlus 已内置，需勾选「全局 TauriApi」）
 *   2. 浏览器 Web Notification（非 Tauri 环境 / node 调试环境）
 *   3. 应用内 toast（仅“测试通知”按钮使用，后台时不可见所以切歌时不降级）
 *
 * 触发条件：切歌 + 设置已开启 + 窗口不在前台，避免每首歌都打扰。
 * 本文件不修改 player.js / ui.js 的播放逻辑，只监听 #songTitle 文本变化和 play 事件。
 */
(function () {
  'use strict';

  const MB = window.MB;
  if (!MB) return;

  const titleEl = document.getElementById('songTitle');
  const audio = document.getElementById('audio');
  const UNKNOWN_ARTIST = '未知艺术家';
  const MIN_GAP = 1200;          // 两次通知的最小间隔，防止连点刷屏

  let lastSongId = null;
  let lastSentAt = 0;
  let tauriGranted = null;       // null = 还没查过
  let rafPending = 0;

  function currentSong() {
    const list = MB.playlist;
    if (!list || !list.length) return null;
    return list[MB.currentIndex] || null;
  }

  function settingEnabled() {
    return !!(MB.playSettings && MB.playSettings.notifyOnSong);
  }

  function tauriApi() {
    const t = window.__TAURI__;
    return (t && t.notification && typeof t.notification.sendNotification === 'function') ? t.notification : null;
  }

  async function ensureTauriPermission(api) {
    if (tauriGranted !== null) return tauriGranted;
    try {
      let ok = await api.isPermissionGranted();
      if (!ok && typeof api.requestPermission === 'function') {
        ok = (await api.requestPermission()) === 'granted';
      }
      tauriGranted = !!ok;
    } catch (e) {
      tauriGranted = false;
    }
    return tauriGranted;
  }

  function bodyOf(song) {
    const parts = [];
    if (song.artist && song.artist !== UNKNOWN_ARTIST) parts.push(song.artist);
    if (song.album) parts.push(song.album);
    return parts.join(' · ') || 'MelodyBox';
  }

  async function send(title, body) {
    const api = tauriApi();
    if (api) {
      if (!(await ensureTauriPermission(api))) return false;
      try {
        await api.sendNotification({ title: title, body: body });
        return true;
      } catch (e) {
        console.warn('[notify] Tauri 通知发送失败', e);
        return false;
      }
    }

    if (typeof window.Notification === 'function') {
      try {
        let perm = window.Notification.permission;
        if (perm === 'default') perm = await window.Notification.requestPermission();
        if (perm !== 'granted') return false;
        const n = new window.Notification(title, {
          body: body,
          tag: 'melodybox-now-playing',   // 同 tag 原地覆盖，不在通知中心堆历史
          silent: true
        });
        n.onclick = function () { window.focus(); n.close(); };
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function notifySong(song) {
    if (!song) return;
    send(song.title || '未知标题', bodyOf(song)).then(function (ok) {
      if (!ok) console.info('[notify] 当前环境无法发送系统通知，已跳过');
    });
  }

  // 歌曲变化检测：只认 id，同一首歌的重复事件不会重复通知
  function checkSong() {
    const song = currentSong();
    if (!song) { lastSongId = null; return; }
    if (song.id === lastSongId) return;
    lastSongId = song.id;

    if (!settingEnabled()) return;
    if (!document.hidden && document.hasFocus()) return;   // 前台看着播放器就不打扰
    const now = Date.now();
    if (now - lastSentAt < MIN_GAP) return;
    lastSentAt = now;
    notifySong(song);
  }

  function schedule() {
    if (rafPending) return;
    rafPending = requestAnimationFrame(function () {
      rafPending = 0;
      checkSong();
    });
  }

  if (titleEl && typeof MutationObserver === 'function') {
    new MutationObserver(schedule).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  if (audio) audio.addEventListener('play', schedule);

  // 供设置面板的「测试」按钮调用
  async function test() {
    const song = currentSong();
    const ok = await send(
      song ? (song.title || '未知标题') : 'MelodyBox',
      song ? bodyOf(song) : '通知测试成功'
    );
    if (!ok) {
      MB.showToast('无法发送系统通知：桌面端请确认已开启「全局 TauriApi」', true);
    } else {
      MB.showToast('已发送测试通知');
    }
    return ok;
  }

  window.MBNotify = {
    test: test,
    notifyCurrent: function () { notifySong(currentSong()); },
    isSupported: function () { return !!tauriApi() || typeof window.Notification === 'function'; }
  };
})();
