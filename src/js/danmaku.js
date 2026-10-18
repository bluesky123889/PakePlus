/* ============================================================
 * danmaku.js —— 弹幕核心（纯 XML/JSON 支持版）
 * 依赖：core.js, env.js
 * ============================================================ */

(function (VP) {
  'use strict';

  const { dom } = VP;

  VP.danmakuMap = {};
  VP.danmakuInstance = null;
  VP.danmakuResizeObserver = null;

  // ===== 初始化 =====
  VP.initDanmaku = function () {
    if (typeof window.Danmaku !== 'function') return;
    if (!dom.danmakuOverlay) return;

    if (!VP.danmakuResizeObserver) {
      VP.danmakuResizeObserver = new ResizeObserver(() => {
        if (VP.danmakuInstance) VP.danmakuInstance.resize();
      });
      VP.danmakuResizeObserver.observe(dom.danmakuOverlay);
    }

    VP.rebuildDanmakuInstance();
    VP.applyDanmakuSettings();
  };

  // 彻底销毁重建（解决尺寸、速度、轨道重叠问题）
  VP.rebuildDanmakuInstance = function() {
    if (VP.danmakuInstance) {
      try {
        VP.danmakuInstance.clear();
        VP.danmakuInstance.destroy();
      } catch(e) {}
      VP.danmakuInstance = null;
    }
    
    VP.danmakuInstance = new window.Danmaku({
      container: dom.danmakuOverlay,
      media: dom.video,
      engine: 'canvas',
      comments: []
    });

    VP.applyDanmakuForCurrent();
  };

  // ===== 核心：强制应用设置 =====
  VP.applyDanmakuSettings = function() {
    const s = VP.danmakuSettings;

    // 1. 强制接管容器的宽高和透明度
    if (dom.danmakuOverlay) {
      dom.danmakuOverlay.style.display = s.enabled ? 'block' : 'none';
      dom.danmakuOverlay.style.height = s.area + '%';
      dom.danmakuOverlay.style.opacity = s.opacity;
    }
    
    // 2. 速度更新
    if (VP.danmakuInstance) {
      VP.danmakuInstance.speed = s.speed;
      VP.danmakuInstance._.position = 0;
      VP.danmakuInstance.clear();
      // 强制刷新尺寸
      setTimeout(() => {
        if (VP.danmakuInstance) VP.danmakuInstance.resize();
      }, 50);
    }

    if (dom.toggleDanmaku) dom.toggleDanmaku.classList.toggle('on', s.enabled);
    VP.saveDanmakuSettings();
  };

  // 【滑块的专属方法】强行重建，保证字号立刻生效
  VP.hardUpdateDanmaku = function() {
    VP.rebuildDanmakuInstance();
    VP.applyDanmakuSettings();
    if (VP.danmakuInstance) {
      VP.danmakuInstance.resize();
    }
  };

  // ===== 读取与保存 =====
  VP.loadDanmakuSettings = function () {
    try {
      const raw = localStorage.getItem('playerDanmakuSettings');
      if (raw) VP.danmakuSettings = { ...VP.danmakuSettings, ...JSON.parse(raw) };
    } catch(e) {}
    
    if(dom.danmakuFontSizeSlider) dom.danmakuFontSizeSlider.value = VP.danmakuSettings.fontSize;
    if(dom.danmakuFontSizeValue) dom.danmakuFontSizeValue.textContent = VP.danmakuSettings.fontSize + 'px';
    
    if(dom.danmakuOpacitySlider) dom.danmakuOpacitySlider.value = Math.round(VP.danmakuSettings.opacity * 100);
    if(dom.danmakuOpacityValue) dom.danmakuOpacityValue.textContent = Math.round(VP.danmakuSettings.opacity * 100) + '%';
    
    if(dom.danmakuAreaSlider) dom.danmakuAreaSlider.value = VP.danmakuSettings.area;
    if(dom.danmakuAreaValue) dom.danmakuAreaValue.textContent = VP.danmakuSettings.area + '%';
    
    if(dom.danmakuSpeedSlider) dom.danmakuSpeedSlider.value = VP.danmakuSettings.speed;
    if(dom.danmakuSpeedValue) {
      dom.danmakuSpeedValue.textContent = VP.danmakuSettings.speed < 100 ? '慢' : (VP.danmakuSettings.speed > 200 ? '快' : '适中');
    }

    if(dom.toggleDanmaku) dom.toggleDanmaku.classList.toggle('on', VP.danmakuSettings.enabled);
  };

  VP.saveDanmakuSettings = function () {
    try { localStorage.setItem('playerDanmakuSettings', JSON.stringify(VP.danmakuSettings)); } catch(e) {}
  };

  // ===== 统一构建 canvas 可用的 style 对象 =====
  // canvas 引擎读取的是 style.font（不是 fontSize）
  // 描边用 strokeStyle + lineWidth
  function buildDanmakuStyle(color, fontSizePx) {
    return {
      font: `bold ${fontSizePx}px sans-serif`,
      fillStyle: color,
      strokeStyle: '#000000',
      lineWidth: 2,
      textBaseline: 'bottom',
      // DOM 引擎兼容字段
      color: color,
      fontSize: fontSizePx + 'px',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px #000, 0 0 3px #000'
    };
  }

  VP.parseDanmakuData = function (content) {
    content = content.trim();
    if (!content) return [];

    const fontMultiplier = VP.danmakuSettings.fontSize / 25;

    // ---------- JSON 分支 ----------
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        const json = JSON.parse(content);
        let list = Array.isArray(json) ? json : (json.danmaku || json.comments || json.data || []);
        return list.map(item => {
          const rawSize = item.size || item.fontSize || 25;
          const fontSize = Math.floor(rawSize * 1.5 * fontMultiplier);
          const color = item.color || item.c || '#ffffff';
          return {
            time: parseFloat(item.time || item.t || item.start || 0),
            text: String(item.text || item.m || item.content || ''),
            mode: item.mode || (item.type === 5 ? 'top' : (item.type === 4 ? 'bottom' : 'rtl')),
            style: buildDanmakuStyle(color, fontSize)
          };
        }).sort((a, b) => a.time - b.time);
      } catch (e) { }
    }

    // ---------- XML（B 站格式）分支 ----------
    const doc = new DOMParser().parseFromString(content, 'text/xml');
    const result = [];
    const COLOR_POOL = ['#ff0000', '#ffd700', '#00bfff', '#ff69b4', '#00ff00', '#ff8c00'];

    doc.querySelectorAll('d').forEach(d => {
      const pAttr = d.getAttribute('p');
      if (!pAttr) return;
      const p = pAttr.split(',');
      
      const colorInt = parseInt(p[3], 10);
      let color = '#' + (isNaN(colorInt) ? 'ffffff' : colorInt.toString(16).padStart(6, '0'));
      
      if (color === '#ffffff' && Math.random() < 0.3) {
        color = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
      } else if (color === '#ffffff') {
        color = 'rgba(255, 255, 255, 0.85)';
      }

      const rawFontSize = parseInt(p[2], 10) || 25;
      const fontSize = Math.floor(rawFontSize * 1.5 * fontMultiplier); 
      const modeMap = { '1': 'rtl', '2': 'rtl', '3': 'rtl', '4': 'bottom', '5': 'top' };

      result.push({
        time: parseFloat(p[0]) || 0,
        text: d.textContent || '',
        mode: modeMap[p[1]] || 'rtl',
        style: buildDanmakuStyle(color, fontSize)
      });
    });
    result.sort((a, b) => a.time - b.time);
    return result;
  };

  // ===== 弹幕文件导入逻辑（拦截 ASS） =====
  VP.loadDanmakuFile = function (file) {
    if (!VP.currentVideoId) {
      VP.dlgAlert('请先播放视频再导入弹幕', '提示');
      return;
    }

    const fileName = file.name.toLowerCase();
    
    // 拦截 ASS 弹幕
    if (fileName.endsWith('.ass') || fileName.endsWith('.ssa')) {
      VP.dlgAlert(
        '当前播放器不再支持导入 ASS 特效弹幕。\n\n' +
        '由于 ASS 弹幕的排版和特效依赖字幕文件内部的固定坐标，播放器的字号、区域滑块无法生效。因此弹幕仅支持标准的 XML/JSON 格式。\n\n' +
        '（注意：外挂字幕依然完全支持 ASS 特效，请使用右下角的字幕按钮导入）', 
        '不支持该格式'
      );
      return;
    }

    // 解析普通弹幕
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const list = VP.parseDanmakuData(e.target.result);
        if (list.length === 0) {
          VP.dlgAlert('未在文件中找到有效的弹幕内容，请确认是标准的 XML/JSON 弹幕。', '格式错误');
          return;
        }
        VP.danmakuMap[VP.currentVideoId] = list;
        VP.saveDanmaku();
        VP.rebuildDanmakuInstance();
        VP.showOSD(VP.ICONS.check, `成功导入 ${list.length} 条弹幕`);
      } catch (err) {
        VP.dlgAlert('弹幕解析失败，请确认文件格式是否正确。', '错误');
      }
    };
    reader.readAsText(file);
  };

  VP.applyDanmakuForCurrent = function () {
    if (!VP.danmakuInstance) return;
    const rawList = VP.danmakuMap[VP.currentVideoId];
    if (rawList) {
        VP.danmakuInstance.comments = VP.parseDanmakuData(JSON.stringify(rawList));
    } else {
        VP.danmakuInstance.comments = [];
    }
    setTimeout(() => { if (VP.danmakuInstance) VP.danmakuInstance.resize(); }, 100);
  };

  VP.clearDanmaku = function () {
    if (VP.danmakuInstance) {
      VP.danmakuInstance.comments = [];
      VP.danmakuInstance.clear();
    }
  };

  VP.saveDanmaku = function () {
    try { localStorage.setItem(VP.DANMAKU_KEY, JSON.stringify(VP.danmakuMap)); } catch (e) {}
  };

  VP.loadDanmaku = function () {
    try {
      const raw = localStorage.getItem(VP.DANMAKU_KEY);
      VP.danmakuMap = raw ? JSON.parse(raw) : {};
    } catch (e) { VP.danmakuMap = {}; }
  };

})(window.VP);