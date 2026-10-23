window.Subtitle = (function () {
  'use strict';

  window._ = function(key) {
    const p = window.LangPack && window.I18n && window.LangPack[window.I18n.currentLang];
    return (p && p[key]) || key;
  };

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

// ===== 字幕滑块填充 =====
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

          const rawText = rawTextWithCommas
            .replace(/\{[^}]*\}/g, '')
            .replace(/\\[Nn]/g, '\n')
            .replace(/\\h/g, ' ');

          if (!isNaN(start) && !isNaN(end)) {
            result.push({ start: start * 1000, end: end * 1000, text: rawText, style });
          }
        }
      }
    }
    console.log(`[字幕] 解析完成，共 ${result.length} 条。`);
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

  function renderSubtitle() {
    if (effectMode) return;

    if (!subtitleEnabled || subtitleCues.length === 0) {
      subtitleTop.classList.remove('visible'); subtitleTop.innerHTML = '';
      subtitleBottom.classList.remove('visible'); subtitleBottom.innerHTML = '';
      subtitleVisible = false; currentCueKey = '';
      return;
    }

    const timeMs = video.currentTime * 1000;
    const activeCaps = subtitleCues.filter(cap => timeMs >= cap.start && timeMs <= cap.end);

    if (activeCaps.length === 0) {
      if (subtitleVisible) {
        subtitleTop.classList.remove('visible'); subtitleTop.innerHTML = '';
        subtitleBottom.classList.remove('visible'); subtitleBottom.innerHTML = '';
        subtitleVisible = false;
      }
      return;
    }

    const groups = { lyric_jp: [], lyric_zh: [], dialogue: [] };
    for (const cap of activeCaps) {
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
    const currentKey = activeCaps.map(c => c.start + (c.text || '').substring(0, 5)).join('|');
    if (currentKey === currentCueKey && subtitleVisible) return;
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