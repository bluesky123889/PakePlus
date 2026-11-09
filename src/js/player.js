(function () {
  'use strict';

  const MB = window.MB;

  const audio = document.getElementById('audio');
  const coverImage = document.getElementById('coverImage');
  const songTitle = document.getElementById('songTitle');
  const artistName = document.getElementById('artistName');
  const songMeta = document.getElementById('songMeta');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressBar = document.getElementById('progressBar');
  const progressFilled = document.getElementById('progressFilled');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const lyricsContainer = document.getElementById('lyricsContainer');
  const lyricsSub = document.getElementById('lyricsSub');
  const lyricsTag = document.getElementById('lyricsTag');
  const bgGlow = document.getElementById('bgGlow');
  const bgOverlay = document.getElementById('bgOverlay');
  const muteBtn = document.getElementById('muteBtn');
  const volumeWave = document.getElementById('volumeWave');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValueBubble = document.getElementById('volumeValueBubble');
  const volumeWrap = document.querySelector('.volume-wrap');
  const loopBtn = document.getElementById('loopBtn');

  const importZone = document.getElementById('importZone');
  const fileInput = document.getElementById('fileInput');
  const importProgress = document.getElementById('importProgress');
  const importLabel = document.getElementById('importLabel');
  const importPercent = document.getElementById('importPercent');
  const importBar = document.getElementById('importBar');

  const glowBlur = document.getElementById('glowBlur');
  const glowBlurVal = document.getElementById('glowBlurVal');
  const bgColorRow = document.getElementById('bgColorRow');
  const bgColorInput = document.getElementById('bgColorInput');
  const bgColorVal = document.getElementById('bgColorVal');
  const bgImagePreviewRow = document.getElementById('bgImagePreviewRow');
  const bgImagePreview = document.getElementById('bgImagePreview');
  const bgImageInput = document.getElementById('bgImageInput');
  const overlayOpacity = document.getElementById('overlayOpacity');
  const overlayOpacityVal = document.getElementById('overlayOpacityVal');

  const bgVideoRow = document.getElementById('bgVideoRow');
  const bgVideoPreview = document.getElementById('bgVideoPreview');
  const pickVideoBtn = document.getElementById('pickVideoBtn');
  const changeVideoBtn = document.getElementById('changeVideoBtn');
  const bgVideoPath = document.getElementById('bgVideoPath');
  const bgVideo = document.getElementById('bgVideo');
  const bgVideoNew = document.getElementById('bgVideoNew');
  const bgVideoModal = document.getElementById('bgVideoModal');
  const bgVideoGalleryGrid = document.getElementById('bgVideoGalleryGrid');
  const closeBgVideoModalBtn = document.getElementById('closeBgVideoModalBtn');
  const uploadFromVideoGalleryBtn = document.getElementById('uploadFromVideoGalleryBtn');
  const scanVideoFolderBtn = document.getElementById('scanVideoFolderBtn');
  const bgVideoThumb = document.getElementById('bgVideoThumb');
  const bgVideoPlaceholderIcon = document.getElementById('bgVideoPlaceholderIcon');

  const lyricScale = document.getElementById('lyricScale');
  const lyricSpacing = document.getElementById('lyricSpacing');
  const lyricScaleVal = document.getElementById('lyricScaleVal');
  const lyricSpacingVal = document.getElementById('lyricSpacingVal');
  const showBilingual = document.getElementById('showBilingual');
  const lyricOffsetVal = document.getElementById('lyricOffsetVal');
  const lyricOffsetMinus = document.getElementById('lyricOffsetMinus');
  const lyricOffsetPlus = document.getElementById('lyricOffsetPlus');
  const lyricOffsetReset = document.getElementById('lyricOffsetReset');

  const showSpectrum = document.getElementById('showSpectrum');
  const spectrumCanvas = document.getElementById('spectrumCanvas');
  const spectrumCtx = spectrumCanvas.getContext('2d');

  let currentBlobURL = null;
  let isImporting = false;
  let lyricEls = [];
  let lyricTimes = [];
  let activeLyricIndex = -1;
  let parsedLyricData = { lines: [], isLRC: false, isBilingual: false };
  let lastProgressSave = 0;
  let isDraggingProgress = false;
  let scrollRAF = null;
  let targetScrollTop = null;
  let lyricLoopId = null;
  let loadToken = 0;

  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let sourceNode = null;
  let spectrumRAF = null;
  let smoothedHeights = new Array(64).fill(0);

  let volumeFadeRAF = null;
  let targetVolume = MB.playSettings.defaultVolume;

  let bgRaf = null;

  let statsTimer = null;
  let currentListenSeconds = 0;
  let hasCounted = false;

  function updateRangeFill(el) {
    if (!el) return;
    const min = parseFloat(el.min) || 0;
    const max = parseFloat(el.max) || 100;
    const val = parseFloat(el.value) || 0;
    const percent = ((val - min) / (max - min)) * 100;
    el.style.setProperty('--val', `${percent}%`);
  }

  function syncVolumeUI() {
    const muted = audio.muted || audio.volume === 0;
    const displayVal = audio.muted ? 0 : audio.volume;

    volumeSlider.value = displayVal;
    updateRangeFill(volumeSlider);

    if (volumeValueBubble) volumeValueBubble.textContent = Math.round(displayVal * 100) + '%';
    if (volumeWrap) volumeWrap.classList.toggle('muted', muted);
    if (volumeWave) volumeWave.style.opacity = muted ? '0.2' : '1';
    muteBtn.setAttribute('aria-label', muted ? '取消静音' : '静音');
  }

  function revokeCurrentBlobURL() {
    if (currentBlobURL) {
      URL.revokeObjectURL(currentBlobURL);
      currentBlobURL = null;
    }
  }

  function flushListenTime() {
    if (currentListenSeconds >= 1) {
      MB.addListenTime(currentListenSeconds, 0);
      currentListenSeconds = 0;
    }
  }

  function startStatsTimer() {
    stopStatsTimer();
    statsTimer = setInterval(() => {
      if (!audio.paused && audio.duration > 0) {
        currentListenSeconds += 1;
        if (!hasCounted && audio.currentTime >= audio.duration * 0.5) {
          hasCounted = true;
          MB.addListenTime(0, 1);
        }
      }
    }, 1000);
  }

  function stopStatsTimer() {
    if (statsTimer) {
      clearInterval(statsTimer);
      statsTimer = null;
    }
    flushListenTime();
  }

  function applyBgSettings() {
    if (bgRaf) cancelAnimationFrame(bgRaf);
    bgRaf = requestAnimationFrame(() => {
      const bgSettings = MB.bgSettings;

      if (bgSettings.source === 'video' && bgSettings.video) {
        bgGlow.style.display = 'none';

        let videoSrc = bgSettings.video;
        if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.convertFileSrc && !videoSrc.startsWith('blob:') && !videoSrc.startsWith('http')) {
          videoSrc = window.__TAURI__.core.convertFileSrc(videoSrc.replace(/\\/g, '/')) + '?t=' + Date.now();
        }

        const currentBaseSrc = bgVideo.dataset.rawSrc;

        if (currentBaseSrc !== bgSettings.video || bgVideo.error) {
          if (bgVideo.style.display === 'none' || !bgVideo.src) {
            bgVideo.dataset.rawSrc = bgSettings.video;
            bgVideo.src = videoSrc;
            bgVideo.style.display = 'block';
            bgVideo.style.opacity = '1';
            bgVideo.style.zIndex = '1';
            bgVideo.play().catch(e => console.warn('等待自动播放允许', e));
          } else {
            bgVideoNew.dataset.rawSrc = bgSettings.video;
            bgVideoNew.src = videoSrc;
            bgVideoNew.style.display = 'block';
            bgVideoNew.style.opacity = '0';
            bgVideoNew.style.zIndex = '0';
            bgVideoNew.style.filter = `blur(${bgSettings.blur}px)`;

            bgVideoNew.oncanplay = () => {
              bgVideoNew.play().then(() => {
                bgVideoNew.classList.add('video-fade-in');
                setTimeout(() => {
                  bgVideo.style.display = 'none';
                  bgVideo.pause();
                  bgVideo.removeAttribute('src');
                  bgVideoNew.style.zIndex = '1';
                  bgVideoNew.style.opacity = '1';
                  bgVideoNew.classList.remove('video-fade-in');
                  bgVideo.src = bgVideoNew.src;
                  bgVideo.dataset.rawSrc = bgVideoNew.dataset.rawSrc;
                  bgVideo.style.display = 'block';
                  bgVideoNew.style.display = 'none';
                  bgVideoNew.style.opacity = '0';
                  bgVideoNew.style.zIndex = '0';
                }, 800);
              }).catch(e => console.warn('过渡视频播放失败', e));
            };
          }
        }

        bgVideo.style.filter = `blur(${bgSettings.blur}px)`;
        bgVideoNew.style.filter = `blur(${bgSettings.blur}px)`;

      } else {
        bgGlow.style.display = 'block';
        [bgVideo, bgVideoNew].forEach(v => {
          v.style.display = 'none';
          v.pause();
          v.removeAttribute('src');
          v.dataset.rawSrc = '';
          v.classList.remove('video-fade-in');
        });
        if (bgSettings.source === 'image' && bgSettings.image) {
          bgGlow.style.backgroundImage = `url('${bgSettings.image}')`;
          bgGlow.style.backgroundColor = 'transparent';
        } else {
          bgGlow.style.backgroundImage = 'none';
          bgGlow.style.backgroundColor = bgSettings.color;
        }
        bgGlow.style.filter = `blur(${bgSettings.blur}px)`;
      }

      bgOverlay.style.background = `rgba(15, 18, 28, ${bgSettings.overlayOpacity})`;
    });
  }

  function syncBgUI() {
    const bgSettings = MB.bgSettings;
    document.querySelectorAll('.bg-source-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.bgSource === bgSettings.source);
    });
    bgColorInput.value = bgSettings.color;
    bgColorVal.textContent = bgSettings.color;

    bgColorRow.style.display = 'none';
    bgImagePreviewRow.style.display = 'none';
    bgVideoRow.style.display = 'none';

    if (bgSettings.source === 'image') {
      bgImagePreviewRow.style.display = 'flex';
      if (bgSettings.image) {
        bgImagePreview.style.backgroundImage = `url('${bgSettings.image}')`;
        bgImagePreview.innerHTML = '';
      } else {
        bgImagePreview.style.backgroundImage = 'none';
        bgImagePreview.innerHTML = '<span>尚未设置图片</span>';
      }
    } else if (bgSettings.source === 'video') {
      bgVideoRow.style.display = 'flex';
      const isTauri = !!(window.__TAURI__ && window.__TAURI__.dialog && window.__TAURI__.fs);
      if (scanVideoFolderBtn) scanVideoFolderBtn.style.display = isTauri ? 'block' : 'none';
      pickVideoBtn.style.display = 'none';
      changeVideoBtn.style.display = 'block';

      if (bgSettings.video) {
        const fileName = bgSettings.videoPath ? bgSettings.videoPath.split(/[/\\]/).pop() : '视频已加载';
        bgVideoPath.textContent = fileName.length > 14 ? fileName.substring(0, 12) + '...' : fileName;
        bgVideoPath.style.color = 'rgba(255,255,255,0.9)';
        bgVideoPath.style.backgroundColor = 'rgba(0,0,0,0.5)';
        bgVideoPlaceholderIcon.style.display = 'none';
        bgVideoThumb.style.display = 'block';
        let videoSrc = bgSettings.video;
        if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.convertFileSrc && !videoSrc.startsWith('blob:') && !videoSrc.startsWith('http')) {
          videoSrc = window.__TAURI__.core.convertFileSrc(videoSrc.replace(/\\/g, '/'));
        }
        if (bgVideoThumb.src !== videoSrc && !bgVideoThumb.src.startsWith(videoSrc + '#')) {
          bgVideoThumb.src = videoSrc + '#t=0.1';
        }
        bgVideoPreview.style.background = 'rgba(0,0,0,0.3)';
        bgVideoPreview.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      } else {
        bgVideoPath.textContent = '点击选择';
        bgVideoPath.style.color = 'rgba(255,255,255,0.8)';
        bgVideoPath.style.backgroundColor = 'transparent';
        bgVideoThumb.style.display = 'none';
        bgVideoThumb.removeAttribute('src');
        bgVideoThumb.load();
        bgVideoPlaceholderIcon.style.display = 'block';
        bgVideoPreview.style.background = 'rgba(255, 255, 255, 0.03)';
        bgVideoPreview.style.border = '1px dashed rgba(255, 255, 255, 0.15)';
      }
    } else {
      bgColorRow.style.display = 'flex';
    }

    glowBlur.value = bgSettings.blur;
    glowBlurVal.textContent = bgSettings.blur + 'px';
    overlayOpacity.value = Math.round(bgSettings.overlayOpacity * 100);
    overlayOpacityVal.textContent = Math.round(bgSettings.overlayOpacity * 100) + '%';

    updateRangeFill(glowBlur);
    updateRangeFill(overlayOpacity);
    if (lyricScale) updateRangeFill(lyricScale);
    if (lyricSpacing) updateRangeFill(lyricSpacing);
  }

  function startScrollAnimation() {
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    const container = lyricsContainer;
    function step() {
      const current = container.scrollTop;
      const target = targetScrollTop;
      if (target == null) { scrollRAF = null; return; }
      const diff = target - current;
      if (Math.abs(diff) < 0.5) { container.scrollTop = target; scrollRAF = null; return; }
      container.scrollTop = current + diff * 0.18;
      scrollRAF = requestAnimationFrame(step);
    }
    scrollRAF = requestAnimationFrame(step);
  }

  function renderLyrics(lines, isLRC, isBilingual) {
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    targetScrollTop = null;

    const lyricSettings = MB.lyricSettings;
    lyricsContainer.innerHTML = '';
    lyricEls = [];
    lyricTimes = [];
    activeLyricIndex = -1;

    lyricsSub.textContent = isLRC ? '已识别 LRC 时间轴歌词' : (lines.length ? '纯文本歌词 · 按播放进度高亮' : '支持内嵌歌词与 LRC 格式');
    if (isBilingual && lyricSettings.showBilingual) lyricsTag.classList.add('show');
    else lyricsTag.classList.remove('show');

    if (!lines || lines.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'lyric-line';
      empty.innerHTML = '<div class="lyric-main" style="opacity:0.3;">暂无歌词</div>';
      lyricsContainer.appendChild(empty);
      return;
    }

    lines.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'lyric-line' + (item.words ? ' krc-mode' : '');
      el.dataset.index = idx;
      if (item.isMeta) el.dataset.isMeta = "true";

      const mainEl = document.createElement('div');
      mainEl.className = 'lyric-main';

      if (item.words) {
        const ph = document.createElement('span');
        ph.className = 'krc-placeholder';
        ph.textContent = item.main;
        mainEl.appendChild(ph);
        mainEl.appendChild(window.KRC.renderLineDOM(item.main));
      } else {
        mainEl.textContent = item.main;
        mainEl.setAttribute('data-text', item.main);
      }

      el.appendChild(mainEl);

      if (item.sub && lyricSettings.showBilingual) {
        const subEl = document.createElement('div');
        subEl.className = 'lyric-sub';
        if (item.words) {
          const ph = document.createElement('span');
          ph.className = 'krc-placeholder';
          ph.textContent = item.sub;
          subEl.appendChild(ph);
          subEl.appendChild(window.KRC.renderLineDOM(item.sub));
        } else {
          subEl.textContent = item.sub;
          subEl.setAttribute('data-text', item.sub);
        }
        el.appendChild(subEl);
      }

      lyricsContainer.appendChild(el);
      lyricEls.push(el);
      lyricTimes.push(typeof item.time === 'number' ? item.time : null);
    });
  }

  function setActiveLyric(index) {
    if (activeLyricIndex === index) return;
    if (activeLyricIndex >= 0 && lyricEls[activeLyricIndex]) {
      lyricEls[activeLyricIndex].classList.remove('active');
    }
    if (index >= 0 && index < lyricEls.length) {
      const el = lyricEls[index];
      el.classList.add('active');
      const container = lyricsContainer;
      const elOffsetTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      const containerHeight = container.clientHeight;
      targetScrollTop = elOffsetTop - containerHeight / 2 + elHeight / 2 + 30;
      startScrollAnimation();
    }
    activeLyricIndex = index;
  }

  function findLyricIndexByTime(t) {
    const n = lyricTimes.length;
    if (n === 0) return -1;
    if (lyricTimes[0] !== null && t < lyricTimes[0]) return -1;
    let lo = 0, hi = n - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const mt = lyricTimes[mid];
      if (mt === null) { lo = mid + 1; continue; }
      if (mt <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }

  function tickLyrics() {
    if (audio.paused || !audio.duration) {
      lyricLoopId = requestAnimationFrame(tickLyrics);
      return;
    }
    const t = audio.currentTime;
    if (lyricTimes.some(v => v !== null)) {
      const idx = findLyricIndexByTime(t);
      if (idx !== -1) {
        if (idx !== activeLyricIndex) {
          const targetStartTime = lyricTimes[idx];
          if (t >= targetStartTime) {
            if (activeLyricIndex >= 0 && lyricEls[activeLyricIndex]) {
              const prevMain = lyricEls[activeLyricIndex].querySelector('.lyric-main .krc-highlight');
              if (prevMain) prevMain.style.setProperty('--progress', '0%');
              const prevSub = lyricEls[activeLyricIndex].querySelector('.lyric-sub .krc-highlight');
              if (prevSub) prevSub.style.setProperty('--progress', '0%');
            }
            setActiveLyric(idx);
          }
        }

        const currentData = parsedLyricData.lines[idx];
        const activeEl = lyricEls[idx];

        if (currentData.words && currentData.words.length > 0 && activeEl.classList.contains('krc-mode')) {
          const highlightEl = activeEl.querySelector('.lyric-main .krc-highlight');
          const subHighlightEl = activeEl.querySelector('.lyric-sub .krc-highlight');
          if (highlightEl) {
            let finalProgress = window.KRC.getProgress(currentData.words, t, currentData.lineEndTime);
            if (!isFinite(finalProgress) || isNaN(finalProgress)) finalProgress = 0;
            highlightEl.style.setProperty('--progress', `${finalProgress}%`);
            if (subHighlightEl) subHighlightEl.style.setProperty('--progress', `${finalProgress}%`);
          }
        }
      }
    }
    lyricLoopId = requestAnimationFrame(tickLyrics);
  }

  function applyLyricSettings() {
    const lyricSettings = MB.lyricSettings;
    lyricsContainer.style.setProperty('--lyric-scale', lyricSettings.scale);
    lyricsContainer.style.setProperty('--lyric-spacing', lyricSettings.spacing + 'rem');

    showSpectrum.checked = lyricSettings.showSpectrum !== false;
    if (showSpectrum.checked) spectrumCanvas.classList.add('show');
    else spectrumCanvas.classList.remove('show');

    if (parsedLyricData) {
      renderLyrics(parsedLyricData.lines, parsedLyricData.isLRC, parsedLyricData.isBilingual);
    }
    if (lyricScale) updateRangeFill(lyricScale);
    if (lyricSpacing) updateRangeFill(lyricSpacing);
  }

  function updateOffsetUI() {
    const off = MB.currentLyricOffset;
    lyricOffsetVal.textContent = (off > 0 ? '+' : '') + off.toFixed(1) + 's';
  }

  function applyOffsetChange(delta) {
    if (MB.playlist.length === 0) { MB.showToast('请先播放一首歌', true); return; }
    let newOffset = MB.currentLyricOffset + delta;
    newOffset = Math.max(-10, Math.min(10, newOffset));
    newOffset = Math.round(newOffset * 10) / 10;
    if (newOffset === MB.currentLyricOffset) return;
    MB.currentLyricOffset = newOffset;
    updateOffsetUI();
    const song = MB.playlist[MB.currentIndex];
    MB.saveCurrentOffset(song.id, MB.currentLyricOffset);
    parsedLyricData = window.Lyric.parseAll(song.lyrics || '', song.duration, MB.currentLyricOffset);
    renderLyrics(parsedLyricData.lines, parsedLyricData.isLRC, parsedLyricData.isBilingual);
  }

  function renderSongMeta(song) {
    if (!song) { songMeta.innerHTML = ''; return; }
    const chips = [];
    if (song.album) chips.push(`专辑：${MB.escapeHtml(song.album)}`);
    if (song.year) chips.push(`${MB.escapeHtml(String(song.year))} 年`);
    if (song.genre) chips.push(MB.escapeHtml(song.genre));
    if (song.track) chips.push(`#${MB.escapeHtml(String(song.track))}`);
    songMeta.innerHTML = chips.map(c => `<span class="meta-chip">${c}</span>`).join('');
  }

  function fadeVolume(target, duration = 300) {
    if (volumeFadeRAF) cancelAnimationFrame(volumeFadeRAF);
    const startVolume = audio.volume;
    const startTime = performance.now();
    function updateVolume(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      audio.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) {
        volumeFadeRAF = requestAnimationFrame(updateVolume);
      } else {
        audio.volume = target;
        volumeFadeRAF = null;
      }
    }
    volumeFadeRAF = requestAnimationFrame(updateVolume);
  }

  async function loadSong(index, autoPlay) {
    const playlist = MB.playlist;
    if (playlist.length === 0) {
      songTitle.textContent = '暂无歌曲';
      artistName.textContent = '请导入音乐';
      songMeta.innerHTML = '';
      coverImage.src = MB.DEFAULT_COVER;
      parsedLyricData = { lines: [], isLRC: false, isBilingual: false };
      renderLyrics([], false, false);
      progressFilled.style.width = '0%';
      currentTimeEl.textContent = '0:00';
      totalTimeEl.textContent = '0:00';
      revokeCurrentBlobURL();
      audio.removeAttribute('src');
      audio.load();
      MB.currentIndex = 0;
      if (MB.ui && MB.ui.updateCurrentHighlight) MB.ui.updateCurrentHighlight();
      updatePlayIcon();
      return;
    }

    stopStatsTimer();
    hasCounted = false;
    currentListenSeconds = 0;

    audio.pause();
    audio.removeAttribute('src');
    audio.load(); 
    revokeCurrentBlobURL();

    if (playlist[MB.currentIndex] && audio.currentTime > 0) {
      MB.saveProgress(playlist[MB.currentIndex].id, audio.currentTime);
    }

    MB.currentIndex = (index + playlist.length) % playlist.length;
    MB.lastCountedId = null;
    const song = playlist[MB.currentIndex];
    const token = ++loadToken;

    MB.currentLyricOffset = MB.lyricOffsets[song.id] || 0;
    updateOffsetUI();

    songTitle.textContent = song.title || '未知标题';
    artistName.textContent = song.artist || '未知艺术家';
    coverImage.src = song.cover || MB.DEFAULT_COVER;
    renderSongMeta(song);

    [songTitle, artistName, songMeta, coverImage].forEach(el => {
      if (!el) return;
      el.classList.remove('swap-in');
      void el.offsetWidth;
      el.classList.add('swap-in');
    });

    parsedLyricData = window.Lyric.parseAll(song.lyrics || '', song.duration, MB.currentLyricOffset);
    renderLyrics(parsedLyricData.lines, parsedLyricData.isLRC, parsedLyricData.isBilingual);

    progressFilled.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = song.duration ? MB.formatTime(song.duration) : '0:00';

    try {
      if (song.source === 'folder' && song.filePath) {
        if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.convertFileSrc) {
          let safePath = song.filePath.replace(/\\/g, '/');
          audio.src = window.__TAURI__.core.convertFileSrc(safePath);
        } else {
          console.error("当前环境不支持 convertFileSrc");
          MB.showToast('当前环境不支持本地引用，请检查打包配置', true);
          return;
        }
      } else {
        const rec = await MB.idbGet(MB.STORE_AUDIO, song.id);
        if (token !== loadToken) return;
        if (!rec || !rec.blob) throw new Error('音频数据缺失');
        currentBlobURL = URL.createObjectURL(rec.blob);
        audio.src = currentBlobURL;
      }
    } catch (err) {
      console.error(err);
      if (token === loadToken) MB.showToast('音频加载失败：' + (song.title || ''), true);
      return;
    }

    const savedTime = MB.loadProgress(song.id);
    if (savedTime > 0 && savedTime < (song.duration || Infinity) - 1) {
      audio.addEventListener('loadedmetadata', function restoreOnce() {
        if (token !== loadToken) return;
        try { audio.currentTime = savedTime; } catch (e) {}
        audio.removeEventListener('loadedmetadata', restoreOnce);
      });
    }

    MB.saveLastTrack(song.id);

    if (MB.ui && MB.ui.updateCurrentHighlight) MB.ui.updateCurrentHighlight();
    if (autoPlay) {
      try { await audio.play(); } catch (e) { console.warn(e); }
    }
  }

  function togglePlay() {
    if (MB.playlist.length === 0) { MB.showToast('请先导入音乐'); return; }
    if (audio.paused) {
      audio.play().catch(err => {
        if (err.name === 'NotAllowedError') MB.showToast('点击播放按钮开始聆听');
        else MB.showToast('播放失败', true);
      });
    } else audio.pause();
  }

  function updatePlayIcon() {
    playIcon.innerHTML = audio.paused ? '<path d="M8 5v14l11-7L8 5z"/>' : '<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/>';
  }

  async function bumpPlayCount(trackId) {
    if (!trackId) return;
    try {
      const rec = await MB.idbGet(MB.STORE_TRACKS, trackId);
      if (!rec) return;
      rec.playCount = (rec.playCount || 0) + 1;
      rec.lastPlayedAt = Date.now();
      await MB.idbPut(MB.STORE_TRACKS, rec);
      const idx = MB.playlist.findIndex(s => s.id === trackId);
      if (idx >= 0) {
        MB.playlist[idx].playCount = rec.playCount;
        MB.playlist[idx].lastPlayedAt = rec.lastPlayedAt;
      }
    } catch (e) {}
  }

  async function importFiles(fileList) {
    if (isImporting) { MB.showToast('正在导入中，请稍候'); return; }
    const files = Array.from(fileList).filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(f.name));
    if (files.length === 0) { MB.showToast('没有可导入的音频文件', true); return; }

    isImporting = true;
    importProgress.classList.add('show');
    let ok = 0, fail = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const percent = Math.round((i / files.length) * 100);
      importLabel.textContent = `正在导入 ${i + 1}/${files.length}：${file.name}`;
      importPercent.textContent = percent + '%';
      importBar.style.width = percent + '%';

      try {
        const id = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        const duration = await MB.readDuration(file);
        const tags = await MB.parseTags(file);
        const fromName = MB.parseArtistTitleFromName(file.name);
        const title = (tags && tags.title) || fromName.title || MB.titleFromFileName(file.name);
        const artist = (tags && tags.artist) || fromName.artist || '未知艺术家';
        const lyrics = (tags && tags.lyrics) || '';
        const cover = (tags && tags.cover) || MB.DEFAULT_COVER;

        const titlePinyin = MB.buildPinyinIndex(title);
        const artistPinyin = MB.buildPinyinIndex(artist);
        const albumPinyin = (tags && tags.album) ? MB.buildPinyinIndex(tags.album) : { full: '', initials: '' };

        await MB.idbPut(MB.STORE_AUDIO, { id, blob: file });
        await MB.idbPut(MB.STORE_TRACKS, {
          id, title, artist,
          album: (tags && tags.album) || null,
          year: (tags && tags.year) || null,
          genre: (tags && tags.genre) || null,
          track: (tags && tags.track) || null,
          duration, cover, source: 'local', size: file.size,
          mimeType: file.type || 'audio/mpeg',
          lyrics: lyrics || '',
          pinyin: {
            title: titlePinyin,
            artist: artistPinyin,
            album: albumPinyin
          },
          createdAt: Date.now(),
          lastPlayedAt: null, playCount: 0
        });
        ok++;
      } catch (err) { fail++; }
    }

    importLabel.textContent = `完成：成功 ${ok}，失败 ${fail}`;
    importPercent.textContent = '100%';
    importBar.style.width = '100%';
    const wasEmpty = MB.playlist.length === 0;
    if (MB.ui && MB.ui.refreshPlaylistFromDB) await MB.ui.refreshPlaylistFromDB();
    if (wasEmpty && MB.playlist.length > 0) await loadSong(0, false);

    setTimeout(() => {
      importProgress.classList.remove('show');
      importBar.style.width = '0%';
      importLabel.textContent = '正在导入...';
      importPercent.textContent = '0%';
    }, 1200);

    isImporting = false;
    if (ok > 0) MB.showToast(`成功导入 ${ok} 首${fail ? '，失败 ' + fail : ''}`);
    else MB.showToast('导入失败，请检查文件', true);
  }

  function initAudioContext() {
    if (audioContext) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn("当前浏览器不支持 Web Audio API:", e);
    }
  }

  function renderSpectrum() {
    if (!analyser || !MB.lyricSettings.showSpectrum) {
      const w = spectrumCanvas.clientWidth;
      const h = spectrumCanvas.clientHeight;
      spectrumCtx.clearRect(0, 0, w, h);
      smoothedHeights.fill(0);
      if (spectrumRAF) {
        cancelAnimationFrame(spectrumRAF);
        spectrumRAF = null;
      }
      return;
    }

    if (!audio.paused) {
      analyser.getByteFrequencyData(dataArray);
    } else {
      dataArray.fill(0);
    }

    const dpr = window.devicePixelRatio || 1;
    const w = spectrumCanvas.clientWidth;
    const h = spectrumCanvas.clientHeight;
    if (w <= 0 || h <= 0) { spectrumRAF = requestAnimationFrame(renderSpectrum); return; }

    if (spectrumCanvas.width !== w * dpr || spectrumCanvas.height !== h * dpr) {
      spectrumCanvas.width = w * dpr;
      spectrumCanvas.height = h * dpr;
      spectrumCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    spectrumCtx.clearRect(0, 0, w, h);

    const barCount = 64;
    const totalBarWidth = w / barCount;
    const barWidth = totalBarWidth * 0.7;
    const gap = totalBarWidth * 0.3;
    const step = Math.floor(dataArray.length / barCount);

    let isFullyRested = true;

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const start = i * step;
      const end = Math.min(start + step, dataArray.length);
      for (let j = start; j < end; j++) sum += dataArray[j];
      const avg = sum / (end - start) || 0;
      let norm = avg / 255;
      norm = Math.pow(norm, 0.7);
      const targetHeight = 5 + norm * (h * 0.75);
      smoothedHeights[i] = smoothedHeights[i] * 0.65 + targetHeight * 0.35;
      if (smoothedHeights[i] > 5.1) isFullyRested = false;
    }

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) + gap / 2;
      const barHeight = Math.max(2, smoothedHeights[i]);
      const hue = 180 + (i / barCount) * 120;
      const gradient = spectrumCtx.createLinearGradient(0, h, 0, h - barHeight);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 55%, 0.5)`);
      gradient.addColorStop(0.6, `hsla(${hue}, 100%, 65%, 0.6)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 75%, 0.7)`);
      spectrumCtx.fillStyle = gradient;
      spectrumCtx.shadowColor = `hsla(${hue}, 100%, 65%, 0.8)`;
      spectrumCtx.shadowBlur = 15;
      const radius = Math.min(barWidth / 2, 4);
      spectrumCtx.beginPath();
      spectrumCtx.moveTo(x, h);
      spectrumCtx.lineTo(x, h - barHeight + radius);
      spectrumCtx.quadraticCurveTo(x, h - barHeight, x + radius, h - barHeight);
      spectrumCtx.lineTo(x + barWidth - radius, h - barHeight);
      spectrumCtx.quadraticCurveTo(x + barWidth, h - barHeight, x + barWidth, h - barHeight + radius);
      spectrumCtx.lineTo(x + barWidth, h);
      spectrumCtx.closePath();
      spectrumCtx.fill();
      spectrumCtx.shadowBlur = 8;
      spectrumCtx.fillStyle = `hsla(${hue}, 100%, 80%, 0.4)`;
      spectrumCtx.beginPath();
      spectrumCtx.moveTo(x, h - barHeight + 2);
      spectrumCtx.lineTo(x + barWidth, h - barHeight + 2);
      spectrumCtx.lineTo(x + barWidth, h - barHeight + 6);
      spectrumCtx.lineTo(x, h - barHeight + 6);
      spectrumCtx.fill();
    }

    spectrumCtx.shadowBlur = 0;
    spectrumCtx.shadowColor = 'transparent';

    if (audio.paused && isFullyRested) {
      spectrumRAF = null;
      return;
    }
    spectrumRAF = requestAnimationFrame(renderSpectrum);
  }

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', () => { if (MB.playlist.length) loadSong(MB.currentIndex - 1, true); });
  nextBtn.addEventListener('click', () => { if (MB.playlist.length) loadSong(MB.currentIndex + 1, true); });

  audio.addEventListener('play', () => {
    updatePlayIcon();
    fadeVolume(targetVolume, 300);
    const song = MB.playlist[MB.currentIndex];
    
    if (song && MB.lastCountedId !== song.id) {
      MB.lastCountedId = song.id;
      bumpPlayCount(song.id).then(() => {
        if (MB.ui && MB.ui.updateCurrentHighlight) MB.ui.updateCurrentHighlight();
      });
    }
    if (!lyricLoopId) lyricLoopId = requestAnimationFrame(tickLyrics);

    const isTauri = !!window.__TAURI__;
    const forceDisableSpectrum = isTauri && song && song.source === 'folder';

    if (!forceDisableSpectrum) {
      initAudioContext();
      if (audioContext && audioContext.state === 'suspended') audioContext.resume();
      if (MB.lyricSettings.showSpectrum && spectrumCanvas.classList.contains('show')) {
        if (!spectrumRAF) renderSpectrum();
      }
    } else {
      if (spectrumCanvas) {
        spectrumCtx.clearRect(0, 0, spectrumCanvas.clientWidth, spectrumCanvas.clientHeight);
      }
    }
    
    startStatsTimer();
  });

  audio.addEventListener('pause', () => {
    updatePlayIcon();
    fadeVolume(targetVolume, 50);
    stopStatsTimer();
  });

  audio.addEventListener('ended', () => {
    const playlist = MB.playlist;
    if (playlist.length === 0) return;
    if (MB.loopMode === 1) { audio.currentTime = 0; audio.play().catch(() => {}); return; }
    if (MB.loopMode === 2) { if (MB.currentIndex >= playlist.length - 1) { updatePlayIcon(); return; } loadSong(MB.currentIndex + 1, true); return; }
    if (MB.currentIndex < playlist.length - 1) loadSong(MB.currentIndex + 1, true);
    else loadSong(0, true);
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isNaN(audio.duration)) {
      const p = (audio.currentTime / audio.duration) * 100;
      progressFilled.style.width = p + '%';
      currentTimeEl.textContent = MB.formatTime(audio.currentTime);
      const now = Date.now();
      if (now - lastProgressSave > 3000) {
        lastProgressSave = now;
        const song = MB.playlist[MB.currentIndex];
        if (song) MB.saveProgress(song.id, audio.currentTime);
      }
    }
    if (audio.paused) stopStatsTimer();
    else if (!statsTimer) startStatsTimer();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (audio.duration && isFinite(audio.duration)) totalTimeEl.textContent = MB.formatTime(audio.duration);
  });
  audio.addEventListener('error', () => { if (audio.src) MB.showToast('音频资源不可用', true); });
  audio.addEventListener('volumechange', syncVolumeUI);

  progressBar.addEventListener('mousedown', (e) => {
    if (!audio.duration) return;
    isDraggingProgress = true;
    const rect = progressBar.getBoundingClientRect();
    const p = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    audio.currentTime = p * audio.duration;
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDraggingProgress) return;
    const rect = progressBar.getBoundingClientRect();
    const p = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    if (audio.duration) {
      audio.currentTime = p * audio.duration;
      progressFilled.style.width = (p * 100) + '%';
    }
  });
  window.addEventListener('mouseup', () => { isDraggingProgress = false; });

  lyricsContainer.addEventListener('click', (e) => {
    const lineEl = e.target.closest('.lyric-line');
    if (!lineEl) return;
    const idx = parseInt(lineEl.dataset.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= lyricTimes.length) return;
    const time = lyricTimes[idx];
    if (typeof time === 'number' && audio.duration) {
      audio.currentTime = time;
      if (audio.paused) audio.play().catch(() => {});
      const el = lyricEls[idx];
      if (el) {
        const target = el.offsetTop - lyricsContainer.clientHeight / 2 + el.offsetHeight / 2 + 30;
        lyricsContainer.scrollTop = target;
        targetScrollTop = target;
      }
    }
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    if (!audio.muted && audio.volume === 0) audio.volume = 0.8;
  });

  volumeSlider.addEventListener('input', (e) => {
    if (volumeFadeRAF) { cancelAnimationFrame(volumeFadeRAF); volumeFadeRAF = null; }
    const v = parseFloat(e.target.value);
    audio.volume = v;
    audio.muted = v === 0;
    MB.playSettings.defaultVolume = v;
    targetVolume = v;
    MB.savePlaySettings();

    if (volumeValueBubble) volumeValueBubble.textContent = Math.round(v * 100) + '%';
    if (volumeWrap) volumeWrap.classList.toggle('muted', v === 0);
    updateRangeFill(e.target);
  });

  loopBtn.addEventListener('click', () => {
    MB.loopMode = (MB.loopMode + 1) % 3;
    loopBtn.classList.toggle('mode-one', MB.loopMode === 1);
    loopBtn.title = MB.LOOP_LABELS[MB.loopMode];
    MB.showToast('播放模式：' + MB.LOOP_LABELS[MB.loopMode]);
    MB.playSettings.defaultLoopMode = MB.loopMode;
    MB.savePlaySettings();
  });

  document.querySelectorAll('.bg-source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      MB.bgSettings.source = btn.dataset.bgSource;
      MB.saveBgSettings();
      syncBgUI();
      applyBgSettings();
    });
  });

  const bgImageModal = document.getElementById('bgImageModal');
  const bgGalleryGrid = document.getElementById('bgGalleryGrid');
  const closeBgImageModalBtn = document.getElementById('closeBgImageModalBtn');
  const uploadFromGalleryBtn = document.getElementById('uploadFromGalleryBtn');

  function renderBgGallery() {
    const gallery = MB.bgGallery || [];
    if (gallery.length === 0) {
      bgGalleryGrid.innerHTML = '<div class="gallery-empty">图库为空，请上传新图片</div>';
      return;
    }
    bgGalleryGrid.innerHTML = gallery.map(img => {
      const isActive = MB.bgSettings.image === img;
      return `
        <div class="gallery-item ${isActive ? 'active' : ''}" data-img="${img}" style="background-image: url('${img}')">
          <div class="delete-btn" data-delete="${img}" title="删除图片">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
      `;
    }).join('');
  }

  function openBgGallery() {
    renderBgGallery();
    bgImageModal.classList.add('show');
  }

  bgImagePreview.addEventListener('click', () => {
    if (!MB.bgSettings.image) bgImageInput.click();
    else openBgGallery();
  });

  const changeImgBtn = document.getElementById('changeBgImageBtn');
  if (changeImgBtn) {
    changeImgBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); openBgGallery();
    });
  }
  const importImgBtn = document.getElementById('importBgImageBtn');
  if (importImgBtn) {
    importImgBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); bgImageInput.click();
    });
  }

  bgGalleryGrid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const imgToDelete = deleteBtn.dataset.delete;
      MB.bgGallery = MB.bgGallery.filter(img => img !== imgToDelete);
      try { localStorage.setItem('melodybox_bg_gallery', JSON.stringify(MB.bgGallery)); } catch (err) {}
      if (MB.bgSettings.image === imgToDelete) {
        MB.bgSettings.image = null;
        MB.bgSettings.source = 'color';
        MB.saveBgSettings();
        syncBgUI();
        applyBgSettings();
        MB.showToast('已删除当前使用的背景，已切换为纯色');
      } else {
        MB.showToast('背景图片已删除');
      }
      renderBgGallery();
      return;
    }
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const imgData = item.dataset.img;
    if (imgData) {
      MB.bgSettings.image = imgData;
      MB.bgSettings.source = 'image';
      MB.saveBgSettings();
      syncBgUI();
      applyBgSettings();
      MB.showToast('背景图片已更新');
      bgImageModal.classList.remove('show');
    }
  });

  uploadFromGalleryBtn.addEventListener('click', () => bgImageInput.click());
  closeBgImageModalBtn.addEventListener('click', () => bgImageModal.classList.remove('show'));
  bgImageModal.addEventListener('click', (e) => { if (e.target === bgImageModal) bgImageModal.classList.remove('show'); });

  bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64Img = reader.result;
      MB.bgSettings.image = base64Img;
      MB.bgSettings.source = 'image';
      MB.saveBgSettings();
      MB.saveBgGallery(base64Img);
      syncBgUI();
      applyBgSettings();
      bgImageModal.classList.remove('show');
      MB.showToast('背景图片已更新');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  function renderBgVideoGallery() {
    const gallery = MB.bgVideoGallery || [];
    if (gallery.length === 0) {
      bgVideoGalleryGrid.innerHTML = '<div class="gallery-empty">暂无历史视频</div>';
      return;
    }
    const displayGallery = gallery.slice(0, 50);
    bgVideoGalleryGrid.innerHTML = displayGallery.map((videoPath, index) => {
      const isActive = MB.bgSettings.video === videoPath;
      let fileName = videoPath.split(/[/\\]/).pop();
      const isUglyName = videoPath.startsWith('blob:') || /^[a-f0-9-]{20,}$/i.test(fileName);
      const displayName = isUglyName ? '本地视频' : fileName;
      return `
        <div class="gallery-item ${isActive ? 'active' : ''}" data-video="${videoPath}" style="position: relative; overflow: hidden; background: #1f1b2e;">
          <div class="thumb-placeholder" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1;">
            <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: rgba(255,255,255,0.2);">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div class="thumb-video-container" data-src="${videoPath}" style="position: absolute; inset: 0; display: none; background: rgba(0,0,0,0.4); z-index: 1; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: rgba(255,255,255,0.7); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); position: absolute; z-index: 2;">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem 0.5rem 0.5rem; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%); z-index: 2; pointer-events: none; display: flex; justify-content: center;">
            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</span>
          </div>
          <div class="delete-btn" data-delete-video="${videoPath}" title="删除视频" style="z-index: 10;">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
      `;
    }).join('');

    const containers = bgVideoGalleryGrid.querySelectorAll('.thumb-video-container');
    function lazyLoadThumbnails() {
      containers.forEach((container, i) => {
        setTimeout(() => {
          if (!bgVideoModal.classList.contains('show')) return;
          const videoPath = container.dataset.src;
          let videoSrc = videoPath;
          if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.convertFileSrc && !videoSrc.startsWith('blob:') && !videoSrc.startsWith('http')) {
            videoSrc = window.__TAURI__.core.convertFileSrc(videoSrc.replace(/\\/g, '/'));
          }
          const video = document.createElement('video');
          const randomTime = (0.1 + Math.random() * 0.5).toFixed(2);
          video.src = `${videoSrc}#t=${randomTime}`;
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none;';
          container.appendChild(video);
          container.style.display = 'flex';
          const placeholder = container.previousElementSibling;
          if (placeholder) placeholder.style.display = 'none';
        }, i * 50);
      });
    }
    setTimeout(lazyLoadThumbnails, 100);
  }

  function openBgVideoGallery() {
    bgVideoGalleryGrid.innerHTML = '';
    bgVideoModal.classList.add('show');
    requestAnimationFrame(() => {
      setTimeout(() => { renderBgVideoGallery(); }, 100);
    });
  }

  bgVideoGalleryGrid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.stopPropagation();
      const videoToDelete = deleteBtn.dataset.deleteVideo;
      MB.bgVideoGallery = MB.bgVideoGallery.filter(v => v !== videoToDelete);
      try { localStorage.setItem('melodybox_bg_video_gallery', JSON.stringify(MB.bgVideoGallery)); } catch (err) {}
      if (MB.bgSettings.video === videoToDelete) {
        MB.bgSettings.video = null;
        MB.bgSettings.videoPath = null;
        MB.bgSettings.source = 'color';
        MB.saveBgSettings();
        syncBgUI();
        applyBgSettings();
        MB.showToast('已删除当前使用的视频，已切换为纯色');
      } else {
        MB.showToast('背景视频已删除');
      }
      renderBgVideoGallery();
      return;
    }
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const videoPath = item.dataset.video;
    if (videoPath) {
      MB.bgSettings.video = videoPath;
      MB.bgSettings.videoPath = videoPath;
      MB.bgSettings.source = 'video';
      MB.saveBgSettings();
      syncBgUI();
      applyBgSettings();
      MB.showToast('背景视频已更新');
      bgVideoModal.classList.remove('show');
    }
  });

  function cleanupVideoGallery() {
    bgVideoModal.classList.remove('show');
    setTimeout(() => {
      bgVideoGalleryGrid.querySelectorAll('video').forEach(v => {
        v.pause();
        v.removeAttribute('src');
        v.load();
      });
      bgVideoGalleryGrid.innerHTML = '';
    }, 300);
  }

  closeBgVideoModalBtn.addEventListener('click', cleanupVideoGallery);
  bgVideoModal.addEventListener('click', (e) => { if (e.target === bgVideoModal) cleanupVideoGallery(); });

  const handleSelectVideoFromDisk = async () => {
    if (window.__TAURI__ && window.__TAURI__.dialog && window.__TAURI__.fs) {
      try {
        const selected = await window.__TAURI__.dialog.open({
          multiple: false,
          filters: [{ name: '视频文件', extensions: ['mp4', 'webm'] }],
          title: '请选择背景视频'
        });
        if (!selected) return;
        MB.saveBgVideoGallery(selected);
        MB.bgSettings.video = selected;
        MB.bgSettings.videoPath = selected;
        MB.bgSettings.source = 'video';
        MB.saveBgSettings();
        syncBgUI();
        applyBgSettings();
        bgVideoModal.classList.remove('show');
        MB.showToast('视频背景已更新');
      } catch (err) {
        console.error('选择视频失败:', err);
        MB.showToast('选择视频失败', true);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/mp4,video/webm';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        MB.saveBgVideoGallery(url);
        MB.bgSettings.video = url;
        MB.bgSettings.videoPath = file.name;
        MB.bgSettings.source = 'video';
        MB.saveBgSettings();
        syncBgUI();
        applyBgSettings();
        bgVideoModal.classList.remove('show');
        MB.showToast('视频背景已更新（网页端刷新后需重选）');
      };
      input.click();
    }
  };

  pickVideoBtn.addEventListener('click', handleSelectVideoFromDisk);
  uploadFromVideoGalleryBtn.addEventListener('click', handleSelectVideoFromDisk);

  scanVideoFolderBtn.addEventListener('click', async () => {
    if (!window.__TAURI__ || !window.__TAURI__.dialog || !window.__TAURI__.fs) {
      MB.showToast('当前环境不支持批量扫描', true);
      return;
    }
    try {
      const selected = await window.__TAURI__.dialog.open({
        directory: true, multiple: false, title: '请选择包含视频的文件夹'
      });
      if (!selected) return;
      try { localStorage.setItem('melodybox_bg_video_folder', selected); } catch (e) {}
      MB.showToast('正在扫描视频...');
      const videoExts = /\.(mp4|webm)$/i;
      const collected = [];
      async function walk(dir) {
        const entries = await window.__TAURI__.fs.readDir(dir, { dir: 'ltr' });
        for (const entry of entries) {
          const name = entry.name;
          const path = dir.replace(/[/\\]$/, '') + '/' + name;
          const isDir = entry.isDirectory !== undefined ? entry.isDirectory : (!videoExts.test(name) && name.indexOf('.') === -1);
          if (isDir) await walk(path);
          else if (videoExts.test(name)) collected.push(path);
        }
      }
      await walk(selected);
      if (collected.length === 0) {
        MB.showToast('该文件夹内没有视频文件', true);
        return;
      }
      MB.bgVideoGallery = collected;
      renderBgVideoGallery();
      MB.showToast(`扫描完成，成功引入 ${collected.length} 个视频`);
      if (collected.length > 0) {
        MB.bgSettings.video = collected[0];
        MB.bgSettings.videoPath = collected[0];
        MB.bgSettings.source = 'video';
        MB.saveBgSettings();
        syncBgUI();
        applyBgSettings();
      }
    } catch (err) {
      console.error('视频文件夹扫描失败:', err);
      MB.showToast('扫描失败', true);
    }
  });

  changeVideoBtn.addEventListener('click', openBgVideoGallery);
  bgVideoPreview.addEventListener('click', openBgVideoGallery);

  bgColorInput.addEventListener('input', () => {
    MB.bgSettings.color = bgColorInput.value;
    bgColorVal.textContent = MB.bgSettings.color;
    applyBgSettings();
  });
  bgColorInput.addEventListener('change', () => { MB.saveBgSettings(); });

  glowBlur.addEventListener('input', () => {
    MB.bgSettings.blur = parseInt(glowBlur.value, 10);
    glowBlurVal.textContent = MB.bgSettings.blur + 'px';
    applyBgSettings();
    updateRangeFill(glowBlur);
  });
  glowBlur.addEventListener('change', () => { MB.saveBgSettings(); });

  overlayOpacity.addEventListener('input', () => {
    MB.bgSettings.overlayOpacity = parseInt(overlayOpacity.value, 10) / 100;
    overlayOpacityVal.textContent = overlayOpacity.value + '%';
    applyBgSettings();
    updateRangeFill(overlayOpacity);
  });
  overlayOpacity.addEventListener('change', () => { MB.saveBgSettings(); });

  lyricScale.addEventListener('input', () => {
    MB.lyricSettings.scale = parseFloat(lyricScale.value);
    lyricScaleVal.textContent = Math.round(MB.lyricSettings.scale * 100) + '%';
    MB.saveLyricSettings();
    applyLyricSettings();
    updateRangeFill(lyricScale);
  });

  lyricSpacing.addEventListener('input', () => {
    MB.lyricSettings.spacing = parseFloat(lyricSpacing.value);
    lyricSpacingVal.textContent = MB.lyricSettings.spacing + 'rem';
    MB.saveLyricSettings();
    applyLyricSettings();
    updateRangeFill(lyricSpacing);
  });

  showBilingual.addEventListener('change', () => {
    MB.lyricSettings.showBilingual = showBilingual.checked;
    MB.saveLyricSettings();
    applyLyricSettings();
  });

  showSpectrum.addEventListener('change', () => {
    const isTauri = !!window.__TAURI__;
    if (isTauri && !showSpectrum.checked) {
      showSpectrum.checked = false;
      MB.showToast('桌面端受安全策略限制，暂不支持频谱', true);
      return;
    }

    MB.lyricSettings.showSpectrum = showSpectrum.checked;
    MB.saveLyricSettings();
    if (showSpectrum.checked) {
      spectrumCanvas.classList.add('show');
      if (!audio.paused) {
        initAudioContext();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (!spectrumRAF) renderSpectrum();
      }
    } else {
      spectrumCanvas.classList.remove('show');
      if (spectrumRAF) {
        cancelAnimationFrame(spectrumRAF);
        spectrumRAF = null;
      }
      const w = spectrumCanvas.clientWidth;
      const h = spectrumCanvas.clientHeight;
      spectrumCtx.clearRect(0, 0, w, h);
    }
  });

  lyricOffsetMinus.addEventListener('click', () => applyOffsetChange(-0.1));
  lyricOffsetPlus.addEventListener('click', () => applyOffsetChange(0.1));
  lyricOffsetReset.addEventListener('click', () => {
    if (MB.currentLyricOffset !== 0) {
      applyOffsetChange(-MB.currentLyricOffset);
      MB.showToast('偏移量已归零');
    }
  });

  importZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length) {
      importFiles(e.target.files);
      e.target.value = '';
    }
  });
  importZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    importZone.classList.add('dragover');
  });
  importZone.addEventListener('dragleave', () => importZone.classList.remove('dragover'));
  importZone.addEventListener('drop', (e) => {
    e.preventDefault();
    importZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
  });

  MB.player = {
    loadSong,
    togglePlay,
    updatePlayIcon,
    importFiles,
    applyBgSettings,
    syncBgUI,
    applyLyricSettings,
    updateOffsetUI,
    updateLyricsByTime: tickLyrics,
    updateRangeFill,
    syncVolumeUI,
    getAudio: () => audio,
    setTargetVolume: (v) => { targetVolume = v; }
  };

  const savedFolder = localStorage.getItem('melodybox_bg_video_folder');
  if (savedFolder && window.__TAURI__ && window.__TAURI__.fs) {
    setTimeout(async () => {
      try {
        const videoExts = /\.(mp4|webm)$/i;
        const collected = [];
        async function walk(dir) {
          try {
            const entries = await window.__TAURI__.fs.readDir(dir, { dir: 'ltr' });
            for (const entry of entries) {
              const name = entry.name;
              const path = dir.replace(/[/\\]$/, '') + '/' + name;
              const isDir = entry.isDirectory !== undefined ? entry.isDirectory : (!videoExts.test(name) && name.indexOf('.') === -1);
              if (isDir) await walk(path);
              else if (videoExts.test(name)) collected.push(path);
            }
          } catch (e) {}
        }
        await walk(savedFolder);
        if (collected.length > 0) {
          MB.bgVideoGallery = collected;
          if (MB.bgSettings.source === 'video') renderBgVideoGallery();
        }
      } catch(e) {}
    }, 1000);
  }

  lyricLoopId = requestAnimationFrame(tickLyrics);

  targetVolume = MB.playSettings.defaultVolume;
  audio.volume = targetVolume;
  syncVolumeUI();
})();