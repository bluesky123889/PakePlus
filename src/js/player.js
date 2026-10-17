/* ============================================================
 * player.js —— 播放核心：播放控制、进度、音量、全屏、预览、字幕
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

  // ===== 字幕持久化 =====
  VP.loadSubtitles = function () {
    try {
      const raw = localStorage.getItem(VP.SUBTITLE_KEY);
      VP.subtitleMap = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.subtitleMap = {}; }
  };

  VP.saveSubtitles = function () {
    try {
      localStorage.setItem(VP.SUBTITLE_KEY, JSON.stringify(VP.subtitleMap));
    } catch (e) {}
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

  // ===== 时钟显隐 =====
  VP.updateClockVisibility = function () {
    const overlay = document.getElementById('clockOverlay');
    if (!overlay) return;

    const now = new Date();
    const sec = now.getSeconds();
    const min = now.getMinutes();

    const nearHour = (min === 59 && sec >= 45) || (min === 0 && sec <= 15);
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

  VP.createPreviewVideo = function (src, isBlob) {
    if (VP.previewVideo) {
      try { if (isBlob) URL.revokeObjectURL(VP.previewVideo.src); } catch (e) {}
      VP.previewVideo.remove();
      VP.previewVideo = null;
    }
    VP.previewReady = false;
    VP.lastPreviewTime = -1;

    const pv = document.createElement('video');
    pv.preload = 'metadata';
    pv.muted = true;
    pv.playsInline = true;
    if (isBlob) pv.crossOrigin = 'anonymous';
    pv.style.display = 'none';
    pv.src = src;
    document.body.appendChild(pv);
    VP.previewVideo = pv;

    pv.addEventListener('loadeddata', () => { VP.previewReady = true; });
    pv.addEventListener('seeked', drawPreviewFrame);
    pv.addEventListener('error', () => { VP.previewReady = false; });
  };

  VP.setupPreviewForBlob = function (blob) {
    VP.createPreviewVideo(URL.createObjectURL(blob), true);
  };

  VP.setupPreviewForSrc = function (src) {
    VP.createPreviewVideo(src, false);
  };

  VP.resetPreviewThumbnail = function () {
    dom.previewThumbnail.classList.remove('show');
    if (VP.previewVideo) {
      try {
        if (VP.previewVideo.src.startsWith('blob:')) URL.revokeObjectURL(VP.previewVideo.src);
      } catch (e) {}
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

  // ===== 外挂字幕 =====
  VP.loadSubtitle = function (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let captions = [];

        if (content.includes('[Script Info]')) {
          captions = VP.parseASS(content);
        } else {
          captions = VP.parseSRT(content);
        }

        VP.currentSubtitles = captions.filter(cap => cap.text.trim() !== '');
        dom.subtitleOverlay.innerHTML = '';

        if (VP.currentSubtitles.length > 0) {
          if (VP.currentVideoId) {
            VP.subtitleMap[VP.currentVideoId] = content;
            VP.saveSubtitles();
          }
          VP.showOSD(VP.ICONS.check, `成功加载 ${VP.currentSubtitles.length} 条字幕`);
        } else {
          VP.dlgAlert('未在文件中找到有效的字幕内容', '提示');
        }
      } catch (err) {
        console.error('字幕解析失败:', err);
        VP.dlgAlert('字幕解析失败，请确认文件格式是否正确', '错误');
      }
    };
    reader.readAsText(file);
  };

  VP.parseSRT = function (text) {
    const result = [];
    const blocks = text.replace(/\r\n/g, '\n').split('\n\n');

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 2) {
        const timeMatch = lines.find(l => l.includes('-->'));
        if (timeMatch) {
          const times = timeMatch.split('-->');
          const start = VP.parseSRTTime(times[0].trim());
          const end = VP.parseSRTTime(times[1].trim());

          const textIndex = lines.indexOf(timeMatch);
          const rawText = lines.slice(textIndex + 1).join('<br>');
          const text = VP.escapeTextKeepBr(rawText);

          if (start !== -1 && end !== -1) {
            result.push({ start: start * 1000, end: end * 1000, text, style: '' });
          }
        }
      }
    }
    return result;
  };

  VP.parseSRTTime = function (timeStr) {
    const match = timeStr.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
    if (match) {
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
    }
    return -1;
  };

    VP.parseASS = function (text) {
    const result = [];
    const lines = text.split('\n');
    let formatFields = [];

    for (const line of lines) {
      const trimLine = line.trim();
      if (trimLine.startsWith('Format:')) {
        formatFields = trimLine.substring(7).split(',').map(f => f.trim().toLowerCase());
      } else if (trimLine.startsWith('Dialogue:')) {
        const parts = trimLine.substring(9).split(',');
        if (formatFields.length > 0) {
          const styleIdx = formatFields.indexOf('style');
          const startIdx = formatFields.indexOf('start');
          const endIdx = formatFields.indexOf('end');
          const textIdx = formatFields.indexOf('text');

          if (startIdx !== -1 && endIdx !== -1 && textIdx !== -1) {
            const style = styleIdx !== -1 ? parts[styleIdx].trim() : '';
            const start = VP.parseASSTime(parts[startIdx].trim());
            const end = VP.parseASSTime(parts[endIdx].trim());
            const rawText = parts.slice(textIdx).join(',')
              .replace(/\{[^}]+\}/g, '')
              .replace(/\\N/g, '<br>');
            const text = VP.escapeTextKeepBr(rawText);

            if (start !== -1 && end !== -1) {
              result.push({ start: start * 1000, end: end * 1000, text, style });
            }
          }
        }
      }
    }
    return result;
  };

  VP.parseASSTime = function (timeStr) {
    const match = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 100;
    }
    return -1;
  };

  // 判断字幕语言：'jp'（外文）| 'zh'（中文）| 'other'（其他）
  VP.detectSubtitleLang = function (cap) {
    const style = (cap.style || '').toUpperCase();
    // 针对 ASS 的标签（如 OPJ/EDC 等）
    if (/J\d*$/.test(style) || style.includes('JP')) return 'jp';
    if (/C\d*$/.test(style) || style.includes('CN') || style.includes('CH')) return 'zh';

    const text = (cap.text || '').replace(/<[^>]+>/g, '');
    // 包含假名（平假名+片假名）判定为日文，包含英文字母较多判定为外文
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'jp';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    // 纯英文/数字/符号也归为外文
    if (/[A-Za-z]/.test(text) && !/[\u4E00-\u9FFF]/.test(text)) return 'jp';
    return 'other';
  };

      VP.updateSubtitle = function () {
    if (!VP.currentSubtitles || VP.currentSubtitles.length === 0) return;

    const time = dom.video.currentTime * 1000;
    const activeCaps = VP.currentSubtitles.filter(cap => time >= cap.start && time <= cap.end);

    if (activeCaps.length === 0) {
      if (dom.subtitleOverlay.innerHTML !== '') {
        dom.subtitleOverlay.innerHTML = '';
      }
      return;
    }

    const groups = { jp: [], zh: [], other: [], lyric_jp: [], lyric_zh: [] };

    for (const cap of activeCaps) {
      const style = (cap.style || '').toUpperCase();
      
      // 1. 识别是不是 OP/ED 歌词
      if (style.includes('OP') || style.includes('ED')) {
        if (/J\d*$/.test(style) || style.includes('JP')) {
          groups.lyric_jp.push(cap);
        } else if (/C\d*$/.test(style) || style.includes('CN') || style.includes('CH')) {
          groups.lyric_zh.push(cap);
        } else {
          const lang = VP.detectSubtitleLang(cap);
          if (lang === 'jp') groups.lyric_jp.push(cap);
          else groups.lyric_zh.push(cap);
        }
        continue;
      }

      // 2. 普通对话的智能拆分逻辑（外文在上，中文在下）
      const styleLang = VP.detectSubtitleLang({ style: cap.style, text: '' });
      if (styleLang === 'jp' || styleLang === 'zh') {
        groups[styleLang].push(cap);
        continue;
      }

            // 2. 检查文本里是否包含换行（<br>），如：外文<br>中文
      const lines = cap.text.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
      
      // 👇 新增：如果整段字数较长（比如超过 30 个字），说明是长句/声明，不进行双语拆分
      const pureText = cap.text.replace(/<[^>]+>/g, '');
      
      if (lines.length >= 2 && pureText.length <= 30) {
        let hasTop = false, hasBottom = false;
        for (let i = 0; i < lines.length; i++) {
          const lang = VP.detectSubtitleLang({ text: lines[i] });
          if (lang === 'jp' || lang === 'other') {
            groups.jp.push({ text: lines[i], style: '' });
            hasTop = true;
          } else if (lang === 'zh') {
            groups.zh.push({ text: lines[i], style: '' });
            hasBottom = true;
          }
        }
        if (hasTop && hasBottom) continue;
        else {
          cap.text = lines.join('<br>');
          groups.other.push(cap);
          continue;
        }
      }

      const textLang = VP.detectSubtitleLang(cap);
      if (textLang === 'jp') groups.jp.push(cap);
      else if (textLang === 'zh') groups.zh.push(cap);
      else groups.other.push(cap);
    }

    // ===== 开始渲染组装 =====
    const parts = [];
    
    // 1. 渲染日文歌词（固定顶部）
    if (groups.lyric_jp.length > 0) {
      const html = groups.lyric_jp.map(c => `<span class="sub-line sub-jp">${c.text}</span>`).join('');
      parts.push(`<div class="sub-group sub-group-lyric-top">${html}</div>`);
    }

    // 2. 渲染中文歌词（固定底部）
    if (groups.lyric_zh.length > 0) {
      const html = groups.lyric_zh.map(c => `<span class="sub-line sub-zh">${c.text}</span>`).join('');
      parts.push(`<div class="sub-group sub-group-lyric-bottom">${html}</div>`);
    }

    // 3. 渲染普通对话/无标签双语
    const order = ['zh', 'jp', 'other'];
    for (const lang of order) {
      if (groups[lang].length === 0) continue;
      const html = groups[lang].map(cap => `<span class="sub-line sub-${lang}">${cap.text}</span>`).join('');
      parts.push(`<div class="sub-group sub-group-${lang}">${html}</div>`);
    }

    const finalHtml = parts.join('');
    if (dom.subtitleOverlay.innerHTML !== finalHtml) {
      dom.subtitleOverlay.innerHTML = finalHtml;
    }
  };
  
VP.clearSubtitle = function () {
    VP.currentSubtitles = [];
    dom.subtitleOverlay.innerHTML = '';
  };

  // ===== 字幕样式加载/应用/UI 同步（#11 新增） =====
  VP.loadSubtitleStyle = function () {
    try {
      const raw = localStorage.getItem(VP.SUBTITLE_STYLE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        VP.subtitleStyle = { ...VP.DEFAULT_SUBTITLE_STYLE, ...saved };
      } else {
        VP.subtitleStyle = { ...VP.DEFAULT_SUBTITLE_STYLE };
      }
    } catch (e) {
      VP.subtitleStyle = { ...VP.DEFAULT_SUBTITLE_STYLE };
    }
    VP.applySubtitleStyle();
    VP.syncSubtitleStyleUI();
  };

  VP.saveSubtitleStyle = function () {
    try {
      localStorage.setItem(VP.SUBTITLE_STYLE_KEY, JSON.stringify(VP.subtitleStyle));
    } catch (e) {}
  };

  VP.applySubtitleStyle = function () {
    const overlay = dom.subtitleOverlay;
    if (!overlay) return;
    const s = VP.subtitleStyle;

    const alpha = Math.max(0, Math.min(1, s.bgOpacity / 100));
    overlay.style.setProperty('--subtitle-font-size', s.fontSize + 'px');
    overlay.style.setProperty('--subtitle-color', s.color);
    overlay.style.setProperty('--subtitle-bg', `rgba(0, 0, 0, ${alpha})`);
    overlay.style.setProperty('--subtitle-outline', s.outline + 'px');};

  VP.syncSubtitleStyleUI = function () {
    const s = VP.subtitleStyle;
    const d = VP.dom;

    if (d.subtitleFontSizeSlider) d.subtitleFontSizeSlider.value = s.fontSize;
    if (d.subtitleFontSizeValue) d.subtitleFontSizeValue.textContent = s.fontSize + 'px';

    if (d.subtitleColorInput) d.subtitleColorInput.value = s.color;
    if (d.subtitleColorValue) d.subtitleColorValue.textContent = s.color.toUpperCase();

    if (d.subtitleColorPresets) {
      d.subtitleColorPresets.querySelectorAll('.color-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color.toLowerCase() === s.color.toLowerCase());
      });
    }

    if (d.subtitleBgOpacitySlider) d.subtitleBgOpacitySlider.value = s.bgOpacity;
    if (d.subtitleBgOpacityValue) d.subtitleBgOpacityValue.textContent = s.bgOpacity + '%';

    if (d.subtitleOutlineSlider) d.subtitleOutlineSlider.value = s.outline;
    if (d.subtitleOutlineValue) d.subtitleOutlineValue.textContent = s.outline + 'px';

    VP.updateSubtitlePreview();
  };

  VP.updateSubtitlePreview = function () {
    const box = VP.dom.subtitlePreviewBox;
    const text = VP.dom.subtitlePreviewText;
    if (!box || !text) return;
    const s = VP.subtitleStyle;
    const alpha = Math.max(0, Math.min(1, s.bgOpacity / 100));

    text.style.fontSize = s.fontSize + 'px';
    text.style.color = s.color;
    text.style.background = `rgba(0, 0, 0, ${alpha})`;
    text.style.textShadow = `
      0 0 ${s.outline}px #000,
      0 0 ${s.outline}px #000,
      0 0 ${s.outline}px #000,
      ${s.outline}px ${s.outline}px ${s.outline}px #000`;
  };

  // ===== 切换视频 =====
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
      VP.clearSubtitle();

      if (VP.subtitleMap[id]) {
        const content = VP.subtitleMap[id];
        let captions = [];
        if (content.includes('[Script Info]')) {
          captions = VP.parseASS(content);
        } else {
          captions = VP.parseSRT(content);
        }
        VP.currentSubtitles = captions.filter(cap => cap.text.trim() !== '');
      }

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