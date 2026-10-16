/* ============================================================
 * player.js —— 播放核心：播放控制、进度、音量、全屏、预览
 * 依赖：core.js, env.js
 * ============================================================ */

(function (VP) {
  'use strict';

  const { dom } = VP;

  // ===== 进度记忆 =====
  VP.loadVideoProgress = function () {
    try {
      const raw = localStorage.getItem(VP.PROGRESS_KEY);
      VP.videoProgress = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.videoProgress = {}; }
  };

  VP.saveVideoProgress = function () {
    try {
      localStorage.setItem(VP.PROGRESS_KEY, JSON.stringify(VP.videoProgress));
    } catch (e) {}
  };

  VP.recordCurrentProgress = function () {
    const video = dom.video;
    if (!VP.currentVideoId || !VP.hasVideo || !video.duration || isNaN(video.duration)) return;

    // 已到"看完"阈值，不再记录（避免和 markWatched 横跳）
    if (video.currentTime / video.duration >= VP.WATCH_THRESHOLD) return;

    const remaining = video.duration - video.currentTime;
    if (remaining < 5) {
      if (VP.videoProgress[VP.currentVideoId]) {
        delete VP.videoProgress[VP.currentVideoId];
        VP.saveVideoProgress();
      }
      return;
    }
    if (video.currentTime < 3) return;

    if (VP.watchedSet.has(VP.currentVideoId)) {
      VP.watchedSet.delete(VP.currentVideoId);
      VP.saveWatched();
    }

    VP.videoProgress[VP.currentVideoId] = {
      time: video.currentTime,
      duration: video.duration,
      updatedAt: Date.now()
    };
  };

  VP.scheduleProgressSave = function () {
    if (VP.progressSaveTimer) return;
    VP.progressSaveTimer = setTimeout(() => {
      VP.recordCurrentProgress();
      VP.saveVideoProgress();
      VP.progressSaveTimer = null;
    }, 2000);
  };

  VP.loadWatched = function () {
    try {
      const raw = localStorage.getItem(VP.WATCHED_KEY);
      VP.watchedSet = new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { VP.watchedSet = new Set(); }
  };

  VP.saveWatched = function () {
    try {
      localStorage.setItem(VP.WATCHED_KEY, JSON.stringify(Array.from(VP.watchedSet)));
    } catch (e) {}
  };

  VP.markWatched = function (id) {
    if (!id || VP.watchedSet.has(id)) return;
    VP.watchedSet.add(id);
    VP.saveWatched();
    if (VP.videoProgress[id]) {
      delete VP.videoProgress[id];
      VP.saveVideoProgress();
    }
  };

  // ===== 音量 =====
  VP.loadVolumeState = function () {
    try {
      const raw = localStorage.getItem(VP.VOLUME_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        dom.video.volume = typeof v.volume === 'number' ? Math.max(0, Math.min(1, v.volume)) : 1;
        dom.video.muted = !!v.muted;
      }
    } catch (e) {}
  };

  VP.saveVolumeState = function () {
    try {
      localStorage.setItem(VP.VOLUME_KEY, JSON.stringify({
        volume: dom.video.volume,
        muted: dom.video.muted
      }));
    } catch (e) {}
  };

  VP.updateVolumeFill = function () {
    const vol = dom.video.muted ? 0 : dom.video.volume;
    const percent = vol * 100;
    dom.volumeVerticalFill.style.height = percent + '%';
    dom.volumeVerticalThumb.style.bottom = percent + '%';
    dom.volumePercent.textContent = Math.round(percent) + '%';
  };

  VP.updateVolumeIcon = function () {
    const vol = dom.video.muted ? 0 : dom.video.volume;
    if (vol === 0 || dom.video.muted) {
      dom.volumeUpIcon.style.display = 'none';
      dom.volumeMuteIcon.style.display = 'block';
      dom.volumeMuteIcon.innerHTML = VP.ICONS.volumeMute;
    } else {
      dom.volumeUpIcon.style.display = 'block';
      dom.volumeMuteIcon.style.display = 'none';
      if (vol < 0.33) dom.volumeUpIcon.innerHTML = VP.ICONS.volumeLow;
      else if (vol < 0.67) dom.volumeUpIcon.innerHTML = VP.ICONS.volumeMid;
      else dom.volumeUpIcon.innerHTML = VP.ICONS.volumeHigh;
    }
  };

  VP.updateVolumeUI = function () {
    VP.updateVolumeIcon();
    VP.updateVolumeFill();
  };

  VP.toggleMute = function () {
    if (!VP.hasVideo) return;
    if (dom.video.muted || dom.video.volume === 0) {
      dom.video.muted = false;
      if (dom.video.volume === 0) dom.video.volume = 0.5;
    } else {
      dom.video.muted = true;
    }
    VP.updateVolumeUI();
    VP.saveVolumeState();
    VP.showOSD(
      dom.video.muted ? VP.ICONS.volumeMute : VP.ICONS.volumeHigh,
      dom.video.muted ? '静音' : '取消静音'
    );
  };

  // ===== 播放控制 =====
  VP.togglePlayPause = function () {
    if (!VP.hasVideo) return;
    if (dom.video.paused) dom.video.play().catch(() => {});
    else dom.video.pause();
  };

  VP.updatePlayPauseIcon = function () {
    if (dom.video.paused) {
      dom.playIcon.style.display = 'block';
      dom.pauseIcon.style.display = 'none';
    } else {
      dom.playIcon.style.display = 'none';
      dom.pauseIcon.style.display = 'block';
    }
  };

  VP.setControlsEnabled = function (enabled) {
    dom.playPauseBtn.disabled = !enabled;
    dom.muteBtn.disabled = !enabled;
    dom.fullscreenBtn.disabled = !enabled;
    VP.updateNavButtons();
  };

  VP.updateNavButtons = function () {
    if (!VP.hasVideo) {
      dom.prevBtn.disabled = true;
      dom.nextBtn.disabled = true;
      return;
    }
    const visible = VP.getVisibleVideos();
    const idx = visible.findIndex(v => v.id === VP.currentVideoId);
    if (idx < 0) {
      dom.prevBtn.disabled = true;
      dom.nextBtn.disabled = true;
      return;
    }
    dom.prevBtn.disabled = !(idx > 0 || dom.video.currentTime > 3);
    dom.nextBtn.disabled = !(idx < visible.length - 1);
  };

  VP.playNext = function () {
    const visible = VP.getVisibleVideos();
    const idx = visible.findIndex(v => v.id === VP.currentVideoId);
    if (idx < 0) return;
    if (idx >= visible.length - 1) {
      VP.showOSD(VP.ICONS.last, '已经是最后一个视频');
      return;
    }
    VP.switchToVideo(visible[idx + 1].id);
  };

  VP.playPrev = function () {
    const visible = VP.getVisibleVideos();
    if (dom.video.currentTime > 3) { dom.video.currentTime = 0; return; }
    const idx = visible.findIndex(v => v.id === VP.currentVideoId);
    if (idx <= 0) {
      VP.showOSD(VP.ICONS.first, '已经是第一个视频');
      return;
    }
    VP.switchToVideo(visible[idx - 1].id);
  };

  // ===== 进度条 =====
  VP.updateProgress = function () {
    const video = dom.video;
    if (!video.duration || isNaN(video.duration)) return;
    const percent = (video.currentTime / video.duration) * 100;
    if (!VP.isDraggingProgress) {
      dom.progressPlayed.style.width = percent + '%';
      dom.progressThumb.style.left = percent + '%';
    }
    dom.currentTimeDisplay.textContent = VP.formatTime(video.currentTime);
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      dom.progressBuffered.style.width = Math.min((bufferedEnd / video.duration) * 100, 100) + '%';
    }

    VP.scheduleProgressSave();
    VP.updateNavButtons();

    if (video.duration && video.currentTime / video.duration >= VP.WATCH_THRESHOLD) {
      VP.markWatched(VP.currentVideoId);
    }
  };

  VP.updateDuration = function () {
    const d = dom.video.duration;
    if (d && !isNaN(d) && d !== Infinity) {
      dom.durationDisplay.textContent = VP.formatTime(d);
    } else {
      dom.durationDisplay.textContent = '0:00';
    }
  };

  VP.seekFromEvent = function (e) {
    if (!VP.hasVideo || !dom.video.duration) return;
    const rect = dom.progressTrack.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    dom.progressPlayed.style.width = percent + '%';
    dom.progressThumb.style.left = percent + '%';
    dom.currentTimeDisplay.textContent = VP.formatTime((percent / 100) * dom.video.duration);
    return percent;
  };

  // ===== 全屏 =====
  VP.toggleFullscreen = function () {
    if (!document.fullscreenElement) dom.app.requestFullscreen().catch(err => console.warn('全屏失败:', err));
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  VP.updateFullscreenIcon = function () {
    if (document.fullscreenElement) {
      dom.fullscreenIcon.style.display = 'none';
      dom.exitFullscreenIcon.style.display = 'block';
    } else {
      dom.fullscreenIcon.style.display = 'block';
      dom.exitFullscreenIcon.style.display = 'none';
    }
  };

  // ===== 时钟显隐统一入口 =====
  // 规则：
  //   1) 整点 / 半点前后各 15 秒 → 强制显示（不管鼠标、不管锁定）
  //   2) 锁定状态 → 隐藏
  //   3) 平时 → 跟控制栏一致（鼠标控制）
  VP.updateClockVisibility = function () {
    const overlay = document.getElementById('clockOverlay');
    if (!overlay) return;

    const now = new Date();
    const sec = now.getSeconds();
    const min = now.getMinutes();

    // 整点前 15 秒 ~ 整点后 15 秒：59:45 ~ 00:15
    const nearHour = (min === 59 && sec >= 45) || (min === 0 && sec <= 15);
    // 半点前 15 秒 ~ 半点后 15 秒：29:45 ~ 30:15
    const nearHalf = (min === 29 && sec >= 45) || (min === 30 && sec <= 15);

    if (nearHour || nearHalf) {
      overlay.classList.remove('hidden');
      return;
    }

    if (VP.isLocked) {
      overlay.classList.add('hidden');
      return;
    }

    if (dom.videoControls.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    } else {
      overlay.classList.remove('hidden');
    }
  };

  // ===== 锁定控制栏 =====
  VP.toggleLock = function () {
    VP.isLocked = !VP.isLocked;

    const ind = document.getElementById('lockIndicator');

    if (VP.isLocked) {
      dom.videoControls.classList.add('hidden');
      dom.togglePlaylistBtn.classList.add('hidden');
      dom.playerArea.classList.add('cursor-hidden');
      if (ind) ind.classList.remove('hidden');
      VP.showOSD(VP.ICONS.info, '控制栏已锁定');
    } else {
      dom.videoControls.classList.remove('hidden');
      dom.togglePlaylistBtn.classList.remove('hidden');
      dom.playerArea.classList.remove('cursor-hidden');
      if (ind) ind.classList.add('hidden');
      VP.showOSD(VP.ICONS.info, '控制栏已解锁');
    }

    VP.updateClockVisibility();
  };

  // ===== 控制栏显隐 =====
  VP.showControls = function () {
    if (VP.isLocked) return;
    dom.videoControls.classList.remove('hidden');
    dom.togglePlaylistBtn.classList.remove('hidden');
    dom.playerArea.classList.remove('cursor-hidden');
    VP.updateClockVisibility();
    VP.resetControlsTimer();
  };

  VP.hideControls = function () {
    if (VP.isDraggingProgress) return;
    if (dom.videoControls.matches(':hover')) return;
    if (dom.togglePlaylistBtn.matches(':hover')) return;
    if (dom.settingsPanel.classList.contains('show')) return;
    if (!dom.video.paused) {
      dom.videoControls.classList.add('hidden');
      dom.togglePlaylistBtn.classList.add('hidden');
      dom.playerArea.classList.add('cursor-hidden');
      VP.updateClockVisibility();
    }
  };

  VP.resetControlsTimer = function () {
    if (VP.controlsHideTimer) clearTimeout(VP.controlsHideTimer);
    VP.controlsHideTimer = setTimeout(VP.hideControls, VP.CONTROLS_HIDE_DELAY);
  };

  // ===== 预览缩略图 =====
  function drawPreviewFrame() {
    try {
      const ctx = dom.previewCanvas.getContext('2d');
      const cw = dom.previewCanvas.width;
      const ch = dom.previewCanvas.height;
      const vw = VP.previewVideo.videoWidth;
      const vh = VP.previewVideo.videoHeight;
      if (vw && vh) {
        const scale = Math.min(cw / vw, ch / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(VP.previewVideo, dx, dy, dw, dh);
      } else {
        ctx.drawImage(VP.previewVideo, 0, 0, cw, ch);
      }
      dom.previewThumbnail.classList.add('show');
    } catch (e) {}
  }

  VP.createPreviewVideo = function (src) {
    if (VP.previewVideo) {
      try { URL.revokeObjectURL(VP.previewVideo.src); } catch (e) {}
      VP.previewVideo.remove();
      VP.previewVideo = null;
    }
    VP.previewReady = false;
    VP.lastPreviewTime = -1;

    const pv = document.createElement('video');
    pv.preload = 'metadata';
    pv.muted = true;
    pv.playsInline = true;
    pv.crossOrigin = 'anonymous';
    pv.style.display = 'none';
    pv.src = src;
    document.body.appendChild(pv);
    VP.previewVideo = pv;

    pv.addEventListener('loadeddata', () => { VP.previewReady = true; });
    pv.addEventListener('seeked', drawPreviewFrame);
  };

  VP.setupPreviewForBlob = function (blob) {
    VP.createPreviewVideo(URL.createObjectURL(blob));
  };

  VP.setupPreviewForSrc = function (src) {
    VP.createPreviewVideo(src);
  };

  VP.resetPreviewThumbnail = function () {
    dom.previewThumbnail.classList.remove('show');
    if (VP.previewVideo) {
      try { URL.revokeObjectURL(VP.previewVideo.src); } catch (e) {}
      VP.previewVideo.remove();
      VP.previewVideo = null;
    }
    VP.previewReady = false;
    VP.lastPreviewTime = -1;
  };

  VP.requestPreviewAt = function (percent) {
    if (!VP.hasVideo || !dom.video.duration || !VP.previewVideo || !VP.previewReady) return;
    if (VP.isDraggingProgress) return;

    const targetTime = (percent / 100) * dom.video.duration;
    if (Math.abs(targetTime - VP.lastPreviewTime) < 0.5) return;

    if (VP.previewTimeout) clearTimeout(VP.previewTimeout);
    VP.previewTimeout = setTimeout(() => {
      try {
        VP.previewVideo.currentTime = targetTime;
        VP.lastPreviewTime = targetTime;
      } catch (e) {}
    }, 60);
  };

  // ===== 切换视频（核心）=====
  VP.switchToVideo = async function (id) {
    const video = dom.video;
    const item = VP.playlist.find(v => v.id === id);
    if (!item) return;
    if (VP.currentVideoId === id && VP.hasVideo) {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
      return;
    }

    if (VP.currentVideoId && VP.hasVideo) {
      VP.recordCurrentProgress();
      VP.saveVideoProgress();
    }

    if (VP.currentObjectURL) {
      URL.revokeObjectURL(VP.currentObjectURL);
      VP.currentObjectURL = null;
    }

    try {
      dom.videoLoading.classList.add('show');
      VP.resetPreviewThumbnail();

      if (VP.isFileRef(item)) {
        const exists = await VP.fileExists(item.path);
        if (!exists) {
          dom.videoLoading.classList.remove('show');
          item.missing = true;
          await VP.savePlaylistMeta();
          const el = dom.playlistItems.querySelector(`.playlist-item[data-id="${CSS.escape(id)}"]`);
          if (el) el.classList.add('file-missing');
          VP.updateCheckFilesButton(1);

          const ok = await VP.dlgConfirm(
            `文件不存在或已被移动：\n${item.path}\n\n是否从列表中移除？`,
            '文件丢失',
            { danger: true, okText: '移除' }
          );
          if (ok) await VP.removeVideo(id);
          return;
        }

        const url = VP.pathToVideoUrl(item.path);
        video.src = url;
        VP.currentObjectURL = null;
        VP.setupPreviewForSrc(url);
      } else {
        const record = await VP.dbGet(id);
        if (!record || !record.blob) {
          VP.dlgAlert('视频数据丢失，请重新导入', '错误');
          dom.videoLoading.classList.remove('show');
          return;
        }
        VP.setupPreviewForBlob(record.blob);
        VP.currentObjectURL = URL.createObjectURL(record.blob);
        video.src = VP.currentObjectURL;
      }

      VP.currentVideoId = id;
      VP.hasVideo = true;

      dom.placeholder.classList.add('hidden');
      VP.setControlsEnabled(true);
      VP.applySettings();

      dom.progressPlayed.style.width = '0%';
      dom.progressThumb.style.left = '0%';
      dom.currentTimeDisplay.textContent = '0:00';

      video.load();

      // 已看完 → 从头播，清进度
      if (VP.watchedSet.has(id)) {
        VP.watchedSet.delete(id);
        VP.saveWatched();
        if (VP.videoProgress[id]) {
          delete VP.videoProgress[id];
          VP.saveVideoProgress();
        }
      }

      video.play().catch(() => {});
      VP.showControls();

      // 自动进入视频所在文件夹（如果是根目录下的路径）
      if (item.path) {
        const parent = VP.dirname(item.path);
        const inRoot = VP.rootDirs.some(r =>
          parent === r || parent.startsWith(r + '\\') || parent.startsWith(r + '/')
        );
        if (inRoot && VP.currentPath !== parent) {
          VP.currentPath = parent;
        }
      }

      await VP.savePlaylistMeta();
      VP.renderPlaylist();
      VP.updateNavButtons();
      VP.updateFolderPathBar();

      // 弹续播 toast（延迟一点，等 UI 就绪）
      setTimeout(() => {
        if (VP.showResumeToastIfNeeded) VP.showResumeToastIfNeeded(id);
      }, 150);
    } catch (err) {
      console.error('切换视频失败:', err);
      VP.dlgAlert('切换视频失败：' + (err && err.message ? err.message : err), '错误');
    } finally {
      dom.videoLoading.classList.remove('show');
    }
  };

})(window.VP);