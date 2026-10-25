window.Danmaku = (function () {
  'use strict';

  let renderer = null;
  let container = null;
  let isLoaded = false;
  let cachedRawText = '';
  let cachedIsXml = false;
  let enabled = true;
  let opacity = 1.0;
  let _lastVideoEl = null;

  const BASE_W = 1920;
  const BASE_H = 1080;
  const FONT_SIZE = 48;
  const LANE_H = FONT_SIZE * 1.4;
  const SCROLL_SPEED = 200;
  const SCROLL_LANE_RATIO = 0.7;
  const STATIC_DURATION = 5;
  const CHUNK_SIZE = 500;

  function initContainer() {
    if (container) return;
    const mainArea = document.getElementById('mainArea');
    if (!mainArea) return;
    container = document.createElement('div');
    container.id = 'danmaku-container';
    container.style.cssText =
      'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; overflow:hidden;';
    mainArea.appendChild(container);
    container.style.display = enabled ? 'block' : 'none';
    container.style.opacity = opacity;
  }

  function decimalToASSColor(colorNum) {
    const hex = colorNum.toString(16).padStart(6, '0');
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H${b}${g}${r}&`;
  }

  function ensureVisibleColor(colorNum) {
    const r = (colorNum >> 16) & 0xFF;
    const g = (colorNum >> 8) & 0xFF;
    const b = colorNum & 0xFF;
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    if (brightness < 40) return 0xFFFFFF;
    return colorNum;
  }

  function formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  function estimateTextWidth(text) {
    let w = 0;
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code > 0x2E80) w += FONT_SIZE;
      else w += FONT_SIZE * 0.5;
    }
    return w;
  }

  function allocLane(laneFreeUntil, time, needFreeUntil) {
    for (let i = 0; i < laneFreeUntil.length; i++) {
      if (laneFreeUntil[i] <= time) {
        laneFreeUntil[i] = needFreeUntil;
        return i;
      }
    }
    return -1;
  }

  function buildHeader() {
    return `[Script Info]\nScriptType: v4.00+\nPlayResX: ${BASE_W}\nPlayResY: ${BASE_H}\nWrapStyle: 2\n\n` +
      `[V4+ Styles]\n` +
      `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
      `Style: Default,Arial,${FONT_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,1,2,10,10,10,1\n\n` +
      `[Events]\n` +
      `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  }

  // 将一条 <d> 转换为 ASS Dialogue 行；不合法返回 null
  function convertOneItem(itemEl, laneState) {
    const pAttr = itemEl.getAttribute('p');
    if (!pAttr) return null;
    const p = pAttr.split(',');
    const time = parseFloat(p[0]);
    const type = parseInt(p[1], 10);
    const colorNum = parseInt(p[3], 10) || 0xFFFFFF;
    const text = itemEl.textContent.replace(/[\{\}]/g, '').trim();
    if (!text || isNaN(time)) return null;

    const start = time;
    const safeColorNum = ensureVisibleColor(colorNum);
    const colorStr = decimalToASSColor(safeColorNum);
    let tag = `{\\c${colorStr}`;
    let end = start;

    if (type <= 3) {
      const textW = estimateTextWidth(text);
      const passTime = (BASE_W + textW) / SCROLL_SPEED;
      end = start + passTime;
      const lane = allocLane(laneState.scrollLaneFree, start, start + passTime * 0.85);
      if (lane === -1) return null;
      const y = lane * LANE_H + FONT_SIZE;
      tag += `\\move(${BASE_W}, ${y}, -${Math.ceil(textW)}, ${y})}`;
    } else if (type === 4) {
      end = start + STATIC_DURATION;
      const lane = allocLane(laneState.bottomLaneFree, start, end);
      if (lane === -1) return null;
      const y = BASE_H - (lane * LANE_H + FONT_SIZE);
      tag += `\\an2\\pos(${BASE_W / 2}, ${y})}`;
    } else if (type === 5) {
      end = start + STATIC_DURATION;
      const lane = allocLane(laneState.topLaneFree, start, end);
      if (lane === -1) return null;
      const y = lane * LANE_H + FONT_SIZE;
      tag += `\\an8\\pos(${BASE_W / 2}, ${y})}`;
    } else if (type === 6) {
      const textW = estimateTextWidth(text);
      const passTime = (BASE_W + textW) / SCROLL_SPEED;
      end = start + passTime;
      const lane = allocLane(laneState.scrollLaneFree, start, start + passTime * 0.85);
      if (lane === -1) return null;
      const y = lane * LANE_H + FONT_SIZE;
      tag += `\\move(-${Math.ceil(textW)}, ${y}, ${BASE_W}, ${y})}`;
    } else {
      return null;
    }

    return `Dialogue: 0,${formatASSTime(start)},${formatASSTime(end)},Default,,0,0,0,,${tag}${text}\n`;
  }

  // 异步分片转换，onProgress(0~1) 可选
  function convertXmlToASSAsync(xmlString, onProgress) {
    return new Promise((resolve, reject) => {
      let items;
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        items = xmlDoc.getElementsByTagName('d');
      } catch (e) {
        return reject(e);
      }

      const scrollLaneCount = Math.max(1, Math.floor((BASE_H * SCROLL_LANE_RATIO) / LANE_H));
      const staticLaneCount = Math.max(1, Math.floor((BASE_H * 0.5) / LANE_H));
      const laneState = {
        scrollLaneFree: new Array(scrollLaneCount).fill(0),
        topLaneFree: new Array(staticLaneCount).fill(0),
        bottomLaneFree: new Array(staticLaneCount).fill(0)
      };

      let assText = buildHeader();
      let idx = 0;
      const total = items.length;

      function pump() {
        const end = Math.min(idx + CHUNK_SIZE, total);
        try {
          for (; idx < end; idx++) {
            const line = convertOneItem(items[idx], laneState);
            if (line) assText += line;
          }
        } catch (e) {
          return reject(e);
        }

        if (onProgress) {
          try { onProgress(total === 0 ? 1 : idx / total); } catch (e) {}
        }

        if (idx < total) {
          // 分片时让出主线程
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(pump, { timeout: 100 });
          } else {
            setTimeout(pump, 0);
          }
        } else {
          resolve(assText);
        }
      }

      if (total === 0) {
        resolve(assText);
      } else {
        pump();
      }
    });
  }

  function normalizeASSPlayRes(assText) {
    let out = assText;
    if (!/PlayResX\s*:/i.test(out)) {
      out = out.replace(/\[Script Info\]/i, `[Script Info]\nPlayResX: ${BASE_W}`);
    } else {
      out = out.replace(/PlayResX\s*:\s*\d+/gi, `PlayResX: ${BASE_W}`);
    }
    if (!/PlayResY\s*:/i.test(out)) {
      out = out.replace(/\[Script Info\]/i, `[Script Info]\nPlayResY: ${BASE_H}`);
    } else {
      out = out.replace(/PlayResY\s*:\s*\d*/gi, `PlayResY: ${BASE_H}`);
    }
    return out;
  }

  function triggerRendererRefresh(videoElement) {
    if (!videoElement) return;
    try {
      videoElement.dispatchEvent(new Event('seeking'));
    } catch (e) {}
  }

  function buildRenderer(assText, videoElement) {
    if (renderer) {
      try { renderer.destroy(); } catch (e) {}
      renderer = null;
    }
    if (!videoElement || videoElement.readyState < 1) {
      return false;
    }
    try {
      renderer = new window.ASS(assText, videoElement, {
        container,
        resampling: 'video_height'
      });
      return true;
    } catch (err) {
      console.error('[弹幕] 解析失败', err);
      renderer = null;
      return false;
    }
  }

  function applyVisibility() {
    if (!container) return;
    container.style.display = enabled ? 'block' : 'none';
    container.style.opacity = String(opacity);
    if (renderer && enabled) {
      try { renderer.show(); } catch (e) {}
    }
  }

  function showParsingToast(percent) {
    if (typeof window.showToast !== 'function') return;
    const key = percent == null ? 'danmakuParsing' : 'danmakuParsingProgress';
    let msg;
    if (percent == null) {
      msg = (window._ && window._('danmakuParsing')) || '弹幕解析中...';
    } else {
      const tpl = (window._ && window._('danmakuParsingProgress')) || '弹幕解析中 {percent}%';
      msg = tpl.replace('{percent}', Math.round(percent * 100));
    }
    // 解析提示用更长时长，避免闪一下就消失
    window.showToast(msg, 3000);
  }

  return {
    init() {
      initContainer();
    },

    isLoaded() {
      return isLoaded;
    },

    isEnabled() {
      return enabled;
    },

    getRawText() {
      return cachedRawText;
    },

    getIsXml() {
      return cachedIsXml;
    },

    setEnabled(v) {
      const wasEnabled = enabled;
      enabled = !!v;

      // 从关闭切到开启：若之前已销毁 renderer，则从缓存重建
      if (!wasEnabled && enabled && cachedRawText && _lastVideoEl && _lastVideoEl.readyState >= 1) {
        let assText = '';
        try {
          assText = cachedIsXml
            ? null
            : normalizeASSPlayRes(cachedRawText);
        } catch (e) {
          assText = null;
        }

        if (assText === null && cachedIsXml) {
          // XML 需要重新走异步转换，但由于 setEnabled 是同步接口，
          // 这里直接退化为“不重建”，等用户下次重新导入/切集时再触发。
          // 实际上切集走 loadFromText 会正常处理。
          if (container) {
            container.style.display = 'block';
            container.style.opacity = String(opacity);
          }
          return;
        }

        if (assText) {
          const ok = buildRenderer(assText, _lastVideoEl);
          if (ok) {
            triggerRendererRefresh(_lastVideoEl);
          }
        }
      }

      // 从开启切到关闭：销毁 renderer 彻底停 rAF
      if (wasEnabled && !enabled && renderer) {
        try { renderer.destroy(); } catch (e) {}
        renderer = null;
        if (container) container.innerHTML = '';
      }

      applyVisibility();
    },

    setOpacity(v) {
      opacity = Math.max(0, Math.min(1, parseFloat(v) || 0));
      applyVisibility();
    },

    destroy() {
      isLoaded = false;
      if (renderer) {
        try { renderer.destroy(); } catch (e) {}
        renderer = null;
      }
      if (container) {
        container.innerHTML = '';
      }
    },

    // 从文本加载（用于自动恢复）——异步分片
    loadFromText(rawText, videoElement, isXml) {
      initContainer();
      if (!container) return Promise.resolve(false);
      if (!videoElement || videoElement.readyState < 1) {
        return Promise.resolve(false);
      }
      if (!rawText) return Promise.resolve(false);

      const finish = (assText) => {
        this.destroy();
        const ok = buildRenderer(assText, videoElement);
        if (ok) {
          isLoaded = true;
          cachedRawText = rawText;
          cachedIsXml = !!isXml;
          _lastVideoEl = videoElement;
          applyVisibility();
          triggerRendererRefresh(videoElement);
        }
        return ok;
      };

      if (isXml) {
        showParsingToast(null);
        return convertXmlToASSAsync(rawText, (p) => showParsingToast(p))
          .then(finish)
          .catch((err) => {
            console.error('[弹幕] 转换失败', err);
            return false;
          });
      }

      let assText = '';
      try {
        assText = normalizeASSPlayRes(rawText);
      } catch (err) {
        console.error('[弹幕] 转换失败', err);
        return Promise.resolve(false);
      }
      return Promise.resolve(finish(assText));
    },

    // 从 File 加载（用户导入）——异步分片
    load(file, videoElement, onSuccess, onError) {
      initContainer();
      if (!container) {
        if (onError) onError(new Error('容器未初始化'));
        return;
      }
      if (!videoElement || videoElement.readyState < 1) {
        if (onError) onError(new Error('视频尚未就绪'));
        return;
      }
      const reader = new FileReader();

      reader.onload = (event) => {
        const rawText = event.target.result;
        const isXml = /\.xml$/i.test(file.name);

        const finish = (assText) => {
          this.destroy();
          const ok = buildRenderer(assText, videoElement);
          if (!ok) {
            if (onError) onError(new Error('渲染器构建失败'));
            return;
          }
          isLoaded = true;
          cachedRawText = rawText;
          cachedIsXml = isXml;
          _lastVideoEl = videoElement;
          applyVisibility();
          triggerRendererRefresh(videoElement);
          if (onSuccess) onSuccess();
        };

        if (isXml) {
          showParsingToast(null);
          convertXmlToASSAsync(rawText, (p) => showParsingToast(p))
            .then(finish)
            .catch((err) => {
              console.error('[弹幕] 转换失败', err);
              if (onError) onError(err);
            });
          return;
        }

        let assText = '';
        try {
          assText = normalizeASSPlayRes(rawText);
        } catch (err) {
          console.error('[弹幕] 转换失败', err);
          if (onError) onError(err);
          return;
        }
        finish(assText);
      };

      reader.onerror = () => {
        if (onError) onError(new Error('读取失败'));
      };

      reader.readAsText(file, 'utf-8');
    },

    getVideoEl() {
      return _lastVideoEl;
    }
  };
})();