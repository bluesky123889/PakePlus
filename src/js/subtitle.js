/* ============================================================
 * subtitle.js —— 字幕核心：SRT/ASS 解析、原生渲染、assjs 特效渲染
 * ============================================================ */

(function (VP) {
  'use strict';

  const { dom } = VP;

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

  // ===== assjs 特效字幕渲染器 =====
  VP.assRenderer = null;

  VP.isEffectASS = function (content) {
    return /\\pos\(|\\move\(|\\p[1-4]|\\blur|\\frz|\\fscx|\\fscy|\\clip|\\iclip|\\c&H|\\3c&H|\\4c&H|\\alpha&H/i.test(content);
  };

  VP.destroyAssRenderer = function () {
    if (VP.assRenderer) {
      try { VP.assRenderer.destroy(); } catch (e) {}
      VP.assRenderer = null;
    }
    if (VP.dom.subtitleOverlay) VP.dom.subtitleOverlay.style.display = '';
  };

  VP.resolveSubtitleRenderMode = function (content) {
    const mode = VP.subtitleRenderMode || 'auto';

    if (mode === 'effect') {
      if (typeof window.ASS !== 'function') {
        console.warn('[字幕模式] 强制特效但 assjs 未加载，降级到基础模式');
        return 'native';
      }
      return 'effect';
    }

    if (mode === 'native') return 'native';

    if (VP.isEffectASS(content) && typeof window.ASS === 'function') {
      return 'effect';
    }
    return 'native';
  };

  VP.createAssRenderer = function (content) {
    VP.destroyAssRenderer();

    const container = VP.dom.videoWrapper;
    if (!container) {
      console.warn('[assjs] 找不到 videoWrapper 容器');
      return false;
    }

    const ASSLib = window.ASS;
    if (typeof ASSLib !== 'function') {
      console.warn('[assjs] 全局库未加载，window.ASS =', window.ASS);
      return false;
    }

    VP.dom.subtitleOverlay.style.display = 'none';

    try {
      VP.assRenderer = new ASSLib(content, VP.dom.video, {
        container: container,
        resampling: 'video_height'
      });
      console.log('[assjs] 特效字幕渲染器已创建');

      // 强制 assjs 对齐当前时间
      const currentTime = VP.dom.video.currentTime;
      VP.dom.video.currentTime = currentTime + 0.01;
      setTimeout(() => {
        VP.dom.video.currentTime = currentTime;
      }, 10);

      return true;
    } catch (e) {
      console.error('[assjs] 创建失败:', e);
      VP.dom.subtitleOverlay.style.display = '';
      return false;
    }
  };

  // ===== 外挂字幕加载 =====
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

        const useMode = VP.resolveSubtitleRenderMode(content);

        if (useMode === 'effect') {
          const ok = VP.createAssRenderer(content);
          if (ok) {
            if (VP.currentVideoId) {
              VP.subtitleMap[VP.currentVideoId] = content;
              VP.saveSubtitles();
            }
            VP.showOSD(VP.ICONS.check, '特效字幕已加载');
            return;
          }
          console.warn('[assjs] 创建失败，降级到原生解析');
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

  // ===== 解析器 =====
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
    const match = timeStr.match(/(\d+):(\d+):(\d+)(?:[,.](\d+))?/);
    if (match) {
      const ms = match[4] ? parseInt(match[4].padEnd(3, '0').slice(0, 3)) : 0;
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + ms / 1000;
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
        const body = trimLine.substring(9);
        if (formatFields.length > 0) {
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
            const style = styleIdx !== -1 && parts[styleIdx] ? parts[styleIdx].trim() : '';
            const start = VP.parseASSTime((parts[startIdx] || '').trim());
            const end = VP.parseASSTime((parts[endIdx] || '').trim());
            let rawText = rawTextWithCommas;

            let fadeIn = 0;
            let fadeOut = 0;
            const fadMatch = rawText.match(/\\fad\((\d+),(\d+)\)/);
            if (fadMatch) {
              fadeIn = parseInt(fadMatch[1]);
              fadeOut = parseInt(fadMatch[2]);
            }

            rawText = rawText.replace(/\{[^}]+\}/g, '').replace(/\\N/g, '<br>').replace(/\\h/g, ' ');
            const text = VP.escapeTextKeepBr(rawText);

            if (start !== -1 && end !== -1) {
              result.push({ start: start * 1000, end: end * 1000, text, style, fadeIn, fadeOut });
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

  VP.detectSubtitleLang = function (cap) {
    const style = (cap.style || '').toUpperCase();
    if (/J\d*$/.test(style) || style.includes('JP')) return 'jp';
    if (/C\d*$/.test(style) || style.includes('CN') || style.includes('CH')) return 'zh';
    const text = (cap.text || '').replace(/<[^>]+>/g, '');
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'jp';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[A-Za-z]/.test(text) && !/[\u4E00-\u9FFF]/.test(text)) return 'jp';
    return 'other';
  };

  // ===== 原生字幕渲染（带偏移微调） =====
  VP.updateSubtitle = function () {
    if (!VP.currentSubtitles || VP.currentSubtitles.length === 0) return;
    
    // 加入 VP.subtitleOffset 偏移量
    const time = (dom.video.currentTime * 1000) + (VP.subtitleOffset || 0);
    
    const activeCaps = VP.currentSubtitles.filter(cap => time >= cap.start && time <= cap.end);

    if (activeCaps.length === 0) {
      if (dom.subtitleOverlay.innerHTML !== '') {
        dom.subtitleOverlay.innerHTML = '';
        delete dom.subtitleOverlay.dataset.currentKey;
      }
      return;
    }

    const groups = { lyric_jp: [], lyric_zh: [], dialogue: [] };

    for (const cap of activeCaps) {
      const style = (cap.style || '').toUpperCase();
      if (style.includes('OP') || style.includes('ED')) {
        if (!cap.fadeIn && !cap.fadeOut) { cap.fadeIn = 500; cap.fadeOut = 500; }
        if (/J\d*$/.test(style) || style.includes('JP')) groups.lyric_jp.push(cap);
        else if (/C\d*$/.test(style) || style.includes('CN') || style.includes('CH')) groups.lyric_zh.push(cap);
        else { const lang = VP.detectSubtitleLang(cap); if (lang === 'jp') groups.lyric_jp.push(cap); else groups.lyric_zh.push(cap); }
        continue;
      }

      if (!cap.fadeIn && !cap.fadeOut) { cap.fadeIn = 100; cap.fadeOut = 100; }
      const lines = cap.text.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const firstLang = VP.detectSubtitleLang({ text: lines[0] });
        const secondLang = VP.detectSubtitleLang({ text: lines[1] });
        if (firstLang !== 'zh' && secondLang === 'zh') {
          groups.dialogue.push({ type: 'jp', cap: { text: lines[0], style: '', fadeIn: 100, fadeOut: 100 } });
          groups.dialogue.push({ type: 'zh', cap: { text: lines[1], style: '', fadeIn: 100, fadeOut: 100 } });
          continue;
        }
      }
      const text = cap.text.replace(/<[^>]+>/g, '');
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) groups.dialogue.push({ type: 'jp', cap });
      else groups.dialogue.push({ type: 'zh', cap });
    }

    const sortedCaps = activeCaps.slice().sort((a, b) => a.start - b.start);
    const currentKey = sortedCaps.map(c => c.start).join('|');
    if (dom.subtitleOverlay.dataset.currentKey === currentKey) return;
    dom.subtitleOverlay.dataset.currentKey = currentKey;
    dom.subtitleOverlay.innerHTML = '';

    const appendLine = (cap, className, parentEl) => {
      const span = document.createElement('span');
      span.className = `sub-line ${className}`;
      span.innerHTML = cap.text;
      span.style.opacity = '0';
      parentEl.appendChild(span);

      const totalMs = Math.max(1, cap.end - cap.start);
      let inMs = cap.fadeIn || 0;
      let outMs = cap.fadeOut || 0;
      if (inMs + outMs > totalMs) {
        const ratio = totalMs / (inMs + outMs);
        inMs = Math.floor(inMs * ratio);
        outMs = Math.floor(outMs * ratio);
      }

      if (inMs > 0 || outMs > 0) {
        const keyframes = [];
        if (inMs > 0 && outMs > 0) {
          keyframes.push({ opacity: 0, offset: 0 }, { opacity: 1, offset: inMs / totalMs }, { opacity: 1, offset: (totalMs - outMs) / totalMs }, { opacity: 0, offset: 1 });
        } else if (inMs > 0) {
          keyframes.push({ opacity: 0, offset: 0 }, { opacity: 1, offset: inMs / totalMs }, { opacity: 1, offset: 1 });
        } else {
          keyframes.push({ opacity: 1, offset: 0 }, { opacity: 1, offset: (totalMs - outMs) / totalMs }, { opacity: 0, offset: 1 });
        }
        span.animate(keyframes, { duration: totalMs, easing: 'linear', fill: 'forwards' });
      } else {
        span.style.opacity = '1';
      }
    };

    if (groups.lyric_jp.length > 0) {
      const div = document.createElement('div');
      div.className = 'sub-group sub-group-lyric-top';
      dom.subtitleOverlay.appendChild(div);
      groups.lyric_jp.forEach(c => appendLine(c, 'sub-jp', div));
    }
    if (groups.lyric_zh.length > 0) {
      const div = document.createElement('div');
      div.className = 'sub-group sub-group-lyric-bottom';
      dom.subtitleOverlay.appendChild(div);
      groups.lyric_zh.forEach(c => appendLine(c, 'sub-zh', div));
    }

    if (groups.dialogue.length > 0) {
      const div = document.createElement('div');
      div.className = 'sub-group sub-group-dialogue';

      const zhList = groups.dialogue.filter(d => d.type === 'zh');
      const jpList = groups.dialogue.filter(d => d.type === 'jp');

      zhList.forEach(d => appendLine(d.cap, 'sub-zh', div));
      jpList.forEach(d => appendLine(d.cap, 'sub-jp', div));

      dom.subtitleOverlay.appendChild(div);
    }
  };

  VP.clearSubtitle = function () {
    VP.destroyAssRenderer();
    VP.currentSubtitles = [];
    dom.subtitleOverlay.innerHTML = '';
    delete dom.subtitleOverlay.dataset.currentKey;
  };

  VP.reapplyCurrentSubtitle = function () {
    if (!VP.currentVideoId) return;

    const content = VP.subtitleMap[VP.currentVideoId];
    if (!content) {
      VP.showOSD(VP.ICONS.info, '当前视频没有字幕');
      return;
    }

    VP.destroyAssRenderer();
    dom.subtitleOverlay.innerHTML = '';
    delete dom.subtitleOverlay.dataset.currentKey;

    const useMode = VP.resolveSubtitleRenderMode(content);

    if (useMode === 'effect') {
      const ok = VP.createAssRenderer(content);
      if (ok) {
        VP.currentSubtitles = [];
        VP.showOSD(VP.ICONS.check, '已切换到特效渲染');
        return;
      }
      console.warn('[assjs] 重建失败，降级到原生解析');
    }

    const captions = content.includes('[Script Info]') ? VP.parseASS(content) : VP.parseSRT(content);
    VP.currentSubtitles = captions.filter(cap => cap.text.trim() !== '');
    VP.showOSD(VP.ICONS.check, '已切换到基础渲染');
  };

  // ===== 字幕样式加载/应用/UI 同步 =====
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
    overlay.style.setProperty('--subtitle-outline', s.outline + 'px');

    let bottomPx = 30;
    const overlayH = overlay.clientHeight || window.innerHeight;
    if (s.position === 'middle') {
      bottomPx = Math.max(30, Math.round(overlayH / 2) - s.fontSize);
    } else if (s.position === 'top') {
      bottomPx = Math.max(30, Math.round(overlayH) - 120);
    }
    overlay.style.setProperty('--subtitle-bottom', bottomPx + 'px');
  };

  VP.syncSubtitleStyleUI = function () {
    const s = VP.subtitleStyle;
    const d = VP.dom;

    if (d.subtitleFontSizeSlider) d.subtitleFontSizeSlider.value = s.fontSize;
    if (d.subtitleFontSizeValue) d.subtitleFontSizeValue.textContent = s.fontSize + 'px';

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

})(window.VP);