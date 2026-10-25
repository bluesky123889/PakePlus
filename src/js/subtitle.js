window.Subtitle = (function () {
  'use strict';

  let subtitleCues = [];
  let currentAssText = '';
  let subtitleEnabled = true;
  let currentCueKey = '';
  let subtitleVisible = false;
  let effectMode = false;
  let assRenderer = null;

  const video = document.getElementById('video');
  const assContainer = document.getElementById('ass-container');
  const subtitleTop = document.getElementById('subtitleTop');
  const subtitleBottom = document.getElementById('subtitleBottom');
  const subtitleBtn = document.getElementById('subtitleBtn');
  const settingSubtitle = document.getElementById('settingSubtitle');
  const settingEffectSubtitle = document.getElementById('settingEffectSubtitle');
  const subtitleCurrent = document.getElementById('subtitleCurrent');
  const removeSubtitleBtn = document.getElementById('removeSubtitleBtn');

  let screenLayer = null;
  let moveAnimFrame = null;
  let activeScreenTexts = [];

  function getScreenLayer() {
    if (screenLayer) return screenLayer;
    const mainArea = document.getElementById('mainArea');
    if (!mainArea) return null;
    screenLayer = document.createElement('div');
    screenLayer.id = 'ass-fallback-screen-layer';
    screenLayer.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:4;';
    mainArea.appendChild(screenLayer);
    return screenLayer;
  }

  function buildOutlineShadow(px) {
    if (px <= 0) return 'none';
    const dirs = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    const parts = dirs.map(([dx, dy]) => `${dx * px}px ${dy * px}px 0 #000`);
    parts.push(`0 0 ${px * 1.5}px #000`);
    return parts.join(', ');
  }

  function getNum(id, def, isFloat) {
    const el = document.getElementById(id);
    if (!el) return def;
    const v = isFloat ? parseFloat(el.value) : parseInt(el.value, 10);
    return Number.isFinite(v) ? v : def;
  }

  function applySubtitleStyle() {
    const fontSize     = getNum('subFontSizeSlider', 22, false);
    const bottomOffset = getNum('subBottomOffsetSlider', 80, false);
    const topOffset    = getNum('subTopOffsetSlider', 3, false);
    const outlineWidth = getNum('subOutlineSlider', 1, true);

    const topEl = document.getElementById('subTopOffsetSlider');
    const outEl = document.getElementById('subOutlineSlider');
    if (topEl && String(topEl.value) !== String(topOffset)) topEl.value = topOffset;
    if (outEl && String(outEl.value) !== String(outlineWidth)) outEl.value = outlineWidth;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setVal('subFontSizeVal', fontSize + 'px');
    setVal('subBottomOffsetVal', bottomOffset + 'px');
    setVal('subTopOffsetVal', topOffset + '%');
    setVal('subOutlineVal', outlineWidth + 'px');

    const effSize = window.innerWidth < 800 ? Math.round(fontSize * 0.8) : fontSize;
    [subtitleTop, subtitleBottom].forEach(el => {
      if (!el) return;
      el.style.setProperty('--sub-font-size', effSize + 'px');
      el.style.setProperty('--sub-outline-shadow', buildOutlineShadow(outlineWidth));
      if (el === subtitleTop)    el.style.setProperty('--sub-top-offset', topOffset + '%');
      if (el === subtitleBottom) el.style.setProperty('--sub-bottom-offset', bottomOffset + 'px');
    });

    const setFill = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const min = parseFloat(el.min) || 0;
      const max = parseFloat(el.max) || 100;
      const val = parseFloat(el.value) || 0;
      const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
      el.style.setProperty('--sub-fill', pct + '%');
    };
    ['subFontSizeSlider', 'subBottomOffsetSlider', 'subTopOffsetSlider', 'subOutlineSlider'].forEach(setFill);
  }

  function bindStyleUI() {
    const sliderIds = ['subFontSizeSlider', 'subBottomOffsetSlider', 'subTopOffsetSlider', 'subOutlineSlider'];
    sliderIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', applySubtitleStyle);
      el.addEventListener('change', () => {
        const g = id => {
          const node = document.getElementById(id);
          if (!node) return null;
          const v = parseFloat(node.value);
          return Number.isFinite(v) ? v : null;
        };
        const styleData = {
          fs:  g('subFontSizeSlider'),
          bot: g('subBottomOffsetSlider'),
          top: g('subTopOffsetSlider'),
          out: g('subOutlineSlider')
        };
        try { localStorage.setItem('sub_style_pref', JSON.stringify(styleData)); } catch (e) {}
      });
    });

    try {
      const saved = JSON.parse(localStorage.getItem('sub_style_pref'));
      if (saved) {
        const setIf = (id, v) => {
          if (v == null) return;
          const el = document.getElementById(id);
          if (el) el.value = v;
        };
        setIf('subFontSizeSlider', saved.fs);
        setIf('subBottomOffsetSlider', saved.bot);
        setIf('subTopOffsetSlider', saved.top);
        setIf('subOutlineSlider', saved.out);
      }
    } catch (e) {}
  }

  function parseASSTime(t) {
    if (!t) return NaN;
    const m = t.trim().match(/^(\d+):(\d{1,2}):(\d{1,2})[.:](\d{1,3})$/);
    if (!m) return NaN;
    const h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const frac = m[4].length === 2 ? parseInt(m[4], 10) / 100
               : m[4].length === 3 ? parseInt(m[4], 10) / 1000
               : parseInt(m[4], 10) / 10;
    return h * 3600 + mm * 60 + ss + frac;
  }

  function parseASS(text) {
    const result = [];
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n');
    let formatFields = [];
    let inEvents = false;

    for (const line of lines) {
      const trimLine = line.trim();
      if (!trimLine) continue;

      if (trimLine.startsWith('[') && trimLine.endsWith(']')) {
        inEvents = trimLine.toLowerCase() === '[events]';
        continue;
      }
      if (!inEvents) continue;

      if (/^format\s*:/i.test(trimLine)) {
        formatFields = trimLine.substring(trimLine.indexOf(':') + 1)
          .split(',').map(f => f.trim().toLowerCase());
        continue;
      }

      if (/^dialogue\s*:/i.test(trimLine)) {
        const body = trimLine.substring(trimLine.indexOf(':') + 1).trim();
        if (formatFields.length === 0) {
          formatFields = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
        }

        const styleIdx = formatFields.indexOf('style');
        const startIdx = formatFields.indexOf('start');
        const endIdx = formatFields.indexOf('end');
        const textIdx = formatFields.indexOf('text');

        if (startIdx !== -1 && endIdx !== -1 && textIdx !== -1) {
          const parts = [];
          let cursor = 0;
          for (let i = 0; i < textIdx; i++) {
            const comma = body.indexOf(',', cursor);
            if (comma === -1) { parts.push(body.slice(cursor)); cursor = body.length; break; }
            parts.push(body.slice(cursor, comma));
            cursor = comma + 1;
          }
          const rawTextWithCommas = body.slice(cursor);
          const style = styleIdx !== -1 ? (parts[styleIdx] || '').trim() : '';
          const start = parseASSTime(parts[startIdx]);
          const end = parseASSTime(parts[endIdx]);

          if (/\\p\d/i.test(rawTextWithCommas)) {
            continue;
          }

          let pos = null;
          let align = null;
          let rotate = 0;
          let move = null;
          let isScreenText = false;

          const tagMatch = rawTextWithCommas.match(/\{([^}]*)\}/);
          if (tagMatch) {
            const tags = tagMatch[1];

            const posMatch = tags.match(/\\pos\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
            if (posMatch) {
              pos = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]) };
              isScreenText = true;
            }

            const moveMatch = tags.match(/\\move\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+)\s*,\s*(-?\d+))?\s*\)/);
            if (moveMatch) {
              move = {
                x1: parseFloat(moveMatch[1]),
                y1: parseFloat(moveMatch[2]),
                x2: parseFloat(moveMatch[3]),
                y2: parseFloat(moveMatch[4]),
                t1: moveMatch[5] ? parseInt(moveMatch[5], 10) : 0,
                t2: moveMatch[6] ? parseInt(moveMatch[6], 10) : 0
              };
              isScreenText = true;
              if (!pos) pos = { x: move.x1, y: move.y1 };
            }

            const anMatch = tags.match(/\\an(\d)/);
            if (anMatch) align = parseInt(anMatch[1], 10);

            const rzMatch = tags.match(/\\fr([z]?)\s*(-?\d+(?:\.\d+)?)/);
            if (rzMatch && (rzMatch[1] === 'z' || rzMatch[1] === '')) {
              rotate = -parseFloat(rzMatch[2]);
            }
          }

          let isTopText = false;
          const upperStyle = (style || '').toUpperCase();
          if (upperStyle.includes('LOGO') || upperStyle.includes('NOTE') || upperStyle.includes('TITLE')) {
            isTopText = true;
          }
          if (align && align >= 7 && align <= 9) {
            isTopText = true;
          }
          if (pos && pos.y < 540) {
            isTopText = true;
          }

          const rawText = rawTextWithCommas
            .replace(/\{[^}]*\}/g, '')
            .replace(/\\[Nn]/g, '\n')
            .replace(/\\h/g, ' ');

          if (!isNaN(start) && !isNaN(end)) {
            result.push({
              start: start * 1000, end: end * 1000,
              text: rawText, style,
              pos, align, rotate, move,
              isScreenText, isTopText
            });
          }
        }
      }
    }

    console.log(`[字幕] 解析完成，共 ${result.length} 条（屏幕字 ${result.filter(c=>c.isScreenText).length} 条）。`);
    return result;
  }

  function detectSubtitleLang(cap) {
    const style = (cap.style || '').toUpperCase();
    if (/J\d*$/.test(style) || style.includes('JP')) return 'jp';
    if (/C\d*$/.test(style) || style.includes('CN') || style.includes('CH')) return 'zh';
    const text = (cap.text || '');
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'jp';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[A-Za-z]/.test(text) && !/[\u4E00-\u9FFF]/.test(text)) return 'other';
    return 'other';
  }

  function alignToTransform(an) {
    if (!an || an < 1 || an > 9) return 'translate(-50%, -50%)';
    const h = (an - 1) % 3;
    const v = Math.floor((an - 1) / 3);
    const hPct = h === 0 ? '0%' : (h === 1 ? '-50%' : '-100%');
    const vPct = v === 0 ? '-100%' : (v === 1 ? '-50%' : '0%');
    return `translate(${hPct}, ${vPct})`;
  }

  function updateScreenTextsFrame() {
    if (!activeScreenTexts.length) return;
    const vW = video.videoWidth || 1920;
    const vH = video.videoHeight || 1080;
    const now = video.currentTime * 1000;

    activeScreenTexts.forEach(({ cap, div }) => {
      let curX = cap.pos.x;
      let curY = cap.pos.y;

      if (cap.move) {
        const { x1, y1, x2, y2, t1, t2 } = cap.move;
        const absT1 = cap.start + (t1 || 0);
        const absT2 = cap.start + (t2 || (cap.end - cap.start));

        if (now < absT1) {
          curX = x1; curY = y1;
        } else if (now > absT2) {
          curX = x2; curY = y2;
        } else {
          const progress = (now - absT1) / (absT2 - absT1 || 1);
          curX = x1 + (x2 - x1) * progress;
          curY = y1 + (y2 - y1) * progress;
        }
      }

      div.style.left = ((curX / vW) * 100) + '%';
      div.style.top  = ((curY / vH) * 100) + '%';
    });

    moveAnimFrame = requestAnimationFrame(updateScreenTextsFrame);
  }

  function renderScreenTexts(caps) {
    const layer = getScreenLayer();
    if (!layer) return;

    let contentChanged = false;
    if (activeScreenTexts.length !== caps.length) {
      contentChanged = true;
    } else {
      for (let i = 0; i < caps.length; i++) {
        if (activeScreenTexts[i].cap.text !== caps[i].text ||
            activeScreenTexts[i].cap.start !== caps[i].start ||
            activeScreenTexts[i].cap.move !== caps[i].move ||
            activeScreenTexts[i].cap.rotate !== caps[i].rotate) {
          contentChanged = true;
          break;
        }
      }
    }
    if (!contentChanged) return;

    layer.innerHTML = '';
    activeScreenTexts = [];
    if (moveAnimFrame) {
      cancelAnimationFrame(moveAnimFrame);
      moveAnimFrame = null;
    }

    if (!caps.length) return;

    const vW = video.videoWidth || 1920;
    const vH = video.videoHeight || 1080;

    const mergedCaps = [];
    caps.forEach(cap => {
      const text = (cap.text || '').trim();
      if (!text) return;

      const existing = mergedCaps.find(m =>
        !m.move && !cap.move &&
        Math.abs(m.pos.x - cap.pos.x) < 10 &&
        Math.abs(m.pos.y - cap.pos.y) < 10
      );

      if (existing) {
        existing.text += '\n' + text;
      } else {
        mergedCaps.push({ ...cap });
      }
    });

    mergedCaps.forEach(cap => {
      const text = cap.text;

      const div = document.createElement('div');
      div.className = 'subtitle-line';
      div.style.position = 'absolute';
      div.style.margin = '0';
      div.style.width = 'max-content';
      div.style.maxWidth = '90%';
      div.style.whiteSpace = 'pre-wrap';
      div.style.textAlign = 'center';
      div.style.fontSize = 'calc(var(--sub-font-size, 22px) * 0.9)';
      div.textContent = text;

      if (text.includes('\n')) {
          div.style.lineHeight = '1.2';
      }

      let tf = alignToTransform(cap.align);
      if (cap.rotate) tf += ` rotate(${cap.rotate}deg)`;
      div.style.transform = tf;

      let curX = cap.pos.x;
      let curY = cap.pos.y;

      div.style.left = ((curX / vW) * 100) + '%';
      div.style.top  = ((curY / vH) * 100) + '%';

      layer.appendChild(div);
      activeScreenTexts.push({ cap, div });
    });

    updateScreenTextsFrame();
  }

  function clearScreenTexts() {
    if (screenLayer) screenLayer.innerHTML = '';
    activeScreenTexts = [];
    if (moveAnimFrame) {
      cancelAnimationFrame(moveAnimFrame);
      moveAnimFrame = null;
    }
  }

  function findActiveCaps(timeMs) {
    if (!subtitleCues.length) return [];
    let lo = 0, hi = subtitleCues.length - 1, lastStartIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (subtitleCues[mid].start <= timeMs) { lastStartIdx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (lastStartIdx === -1) return [];
    const result = [];
    for (let i = lastStartIdx; i >= 0; i--) {
      const cap = subtitleCues[i];
      if (cap.end >= timeMs && cap.start <= timeMs) result.push(cap);
      if (timeMs > cap.end && result.length === 0 && lastStartIdx - i > 50) break;
    }
    return result;
  }

  function renderSubtitle() {
    if (effectMode) return;

    if (!subtitleEnabled || subtitleCues.length === 0) {
      subtitleTop.classList.remove('visible'); subtitleTop.innerHTML = '';
      subtitleBottom.classList.remove('visible'); subtitleBottom.innerHTML = '';
      subtitleVisible = false; currentCueKey = '';
      clearScreenTexts();
      return;
    }

    const timeMs = video.currentTime * 1000;
    const activeCaps = findActiveCaps(timeMs);

    if (activeCaps.length === 0) {
      if (subtitleVisible) {
        subtitleTop.classList.remove('visible'); subtitleTop.innerHTML = '';
        subtitleBottom.classList.remove('visible'); subtitleBottom.innerHTML = '';
        subtitleVisible = false;
      }
      clearScreenTexts();
      return;
    }

    const groups = { lyric_jp: [], lyric_zh: [], dialogue: [], screenTexts: [] };
    for (const cap of activeCaps) {

      if (cap.isScreenText && cap.pos) {
        groups.screenTexts.push(cap);
        continue;
      }

      if (cap.isScreenText) {
        groups.screenTexts.push(cap);
        continue;
      }

      if (cap.isTopText) {
        cap.pos = { x: video.videoWidth / 2 || 960, y: (video.videoHeight || 1080) * 0.03 };
        cap.align = 8;
        cap.isScreenText = true;
        groups.screenTexts.push(cap);
        continue;
      }

      const style = (cap.style || '').toUpperCase();
      if (style.includes('OP') || style.includes('ED') || style.includes('SONG')) {
        if (/J\d*$/.test(style) || style.includes('JP')) groups.lyric_jp.push(cap);
        else groups.lyric_zh.push(cap);
        continue;
      }
      const lines = cap.text.split(/\n/).map(s => s.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const firstLang = detectSubtitleLang({ text: lines[0] });
        const secondLang = detectSubtitleLang({ text: lines[1] });
        if (firstLang !== 'zh' && secondLang === 'zh') {
          groups.dialogue.push({ type: 'jp', text: lines[0] });
          groups.dialogue.push({ type: 'zh', text: lines[1] });
          continue;
        }
      }
      const text = cap.text;
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) groups.dialogue.push({ type: 'jp', text: text.trim() });
      else groups.dialogue.push({ type: 'zh', text: text.trim() });
    }

    renderScreenTexts(groups.screenTexts);

    const currentKey = activeCaps.map(c => c.start + (c.text || '').substring(0, 5)).join('|');
    if (currentKey === currentCueKey && subtitleVisible && groups.screenTexts.length === 0) return;
    currentCueKey = currentKey;

    subtitleTop.innerHTML = '';
    if (groups.lyric_jp.length > 0) {
      const uniqueLyrics = [...new Set(groups.lyric_jp.map(c => c.text.trim()))];
      uniqueLyrics.forEach(text => {
        const el = document.createElement('div');
        el.className = 'subtitle-line';
        el.textContent = text;
        subtitleTop.appendChild(el);
      });
      subtitleTop.classList.add('visible');
    } else {
      subtitleTop.classList.remove('visible');
    }

    subtitleBottom.innerHTML = '';
    const zhLines = [], jpLines = [];

    groups.lyric_zh.forEach(c => zhLines.push(c.text.trim()));
    groups.dialogue.filter(d => d.type === 'zh').forEach(d => zhLines.push(d.text.trim()));
    groups.dialogue.filter(d => d.type === 'jp').forEach(d => jpLines.push(d.text.trim()));

    [...new Set(jpLines)].forEach(text => {
      const el = document.createElement('div');
      el.className = 'subtitle-line jp-line';
      el.textContent = text;
      subtitleBottom.appendChild(el);
    });

    [...new Set(zhLines)].forEach(text => {
      const el = document.createElement('div');
      el.className = 'subtitle-line zh-line';
      el.textContent = text;
      subtitleBottom.appendChild(el);
    });

    if (subtitleBottom.children.length > 0) subtitleBottom.classList.add('visible');
    else subtitleBottom.classList.remove('visible');

    subtitleVisible = true;
  }

  return {
    // 🔧 v1.7.4: 供系统检测调用
    isLoaded() {
      return subtitleCues.length > 0;
    },

    init() {
      bindStyleUI();
      try { applySubtitleStyle(); } catch (e) { console.warn('[字幕] 样式初始化失败', e); }
      this.updateUI();

      if (settingEffectSubtitle) {
        settingEffectSubtitle.addEventListener('click', () => {
          if (!currentAssText) return window.showToast(_('importAssFirst'));

          effectMode = !effectMode;
          settingEffectSubtitle.classList.toggle('active', effectMode);

          if (effectMode) {
            if (!window.ASS) {
              window.showToast(_('noAssLib'));
              effectMode = false;
              settingEffectSubtitle.classList.remove('active');
              return;
            }
            try {
              subtitleTop.style.display = 'none';
              subtitleBottom.style.display = 'none';
              clearScreenTexts();
              assRenderer = new window.ASS(currentAssText, video, { container: assContainer });

              const t = video.currentTime;
              video.currentTime = t + 0.01;
              setTimeout(() => { video.currentTime = t; }, 10);

              window.showToast(_('effectOnTip'));
            } catch (e) {
              console.error(e);
              effectMode = false;
              settingEffectSubtitle.classList.remove('active');
            }
          } else {
            if (assRenderer) {
              assRenderer.destroy();
              assRenderer = null;
              assContainer.innerHTML = '';
            }
            subtitleTop.style.display = '';
            subtitleBottom.style.display = '';
            renderSubtitle();
            window.showToast(_('effectOffTip'));
          }
        });
      }
    },

    setCues(assText, item) {
      currentAssText = assText || '';
      subtitleCues = currentAssText ? parseASS(currentAssText) : [];
      subtitleCues.sort((a, b) => a.start - b.start || a.end - b.end);

      if (item && currentAssText) {
        item.subtitle = { rawText: currentAssText, cues: subtitleCues };
      } else if (item) {
        item.subtitle = null;
      }

      currentCueKey = '';
      subtitleVisible = false;
      effectMode = false;

      if (assRenderer) {
        assRenderer.destroy();
        assRenderer = null;
        assContainer.innerHTML = '';
      }
      if (settingEffectSubtitle) settingEffectSubtitle.classList.remove('active');

      subtitleTop.style.display = '';
      subtitleBottom.style.display = '';
      subtitleTop.innerHTML = '';
      subtitleBottom.innerHTML = '';
      clearScreenTexts();

      this.updateUI();
      renderSubtitle();
    },

    tick() {
      renderSubtitle();
    },

    loadSubtitleFile(file, item) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const cues = parseASS(text);
          if (cues.length === 0) {
            window.showToast(_('noValidSub'));
            return;
          }
          this.setCues(text, item);
          window.showToast(`${_('importSubTip')} ${cues.length} ${_('importSubCount')}`);
        } catch (err) {
          console.error('[字幕] 解析失败', err);
          window.showToast(_('subFormatErr'));
        }
      };
      reader.onerror = () => {
        window.showToast(_('subFileFail'));
      };
      reader.readAsText(file, 'utf-8');
    },

    toggle() {
      if (!subtitleCues.length) {
        window.showToast(_('noSubTip'));
        return;
      }
      subtitleEnabled = !subtitleEnabled;

      if (effectMode && assRenderer) {
        if (subtitleEnabled) {
          if (typeof assRenderer.show === 'function') assRenderer.show();
          else assContainer.style.display = 'block';
        } else {
          if (typeof assRenderer.hide === 'function') assRenderer.hide();
          else assContainer.style.display = 'none';
        }
      } else {
        renderSubtitle();
      }

      this.updateUI();
      window.showToast(subtitleEnabled ? _('subOnTip') : _('subOffTip'));
    },

    updateUI() {
      if (subtitleBtn) subtitleBtn.classList.toggle('active', subtitleCues.length > 0);
      if (subtitleCurrent) {
        if (subtitleCues.length > 0) {
            subtitleCurrent.textContent = `${_('importSubTip')} ${subtitleCues.length} ${_('importSubCount')}`;
        } else {
            subtitleCurrent.textContent = _('subtitleCurrent') || '当前视频无字幕';
        }
        subtitleCurrent.classList.toggle('has-sub', subtitleCues.length > 0);
      }
      if (removeSubtitleBtn) {
        removeSubtitleBtn.classList.toggle('disabled', subtitleCues.length === 0);
      }
      if (settingSubtitle) {
        settingSubtitle.classList.toggle('active', subtitleEnabled);
      }
    }
  };
})();