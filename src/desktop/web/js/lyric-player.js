(function () {
  'use strict';

  // ===== 元数据词库（过滤"作词/作曲"等非歌词行）=====
  const META_PREFIXES = [
    '词', '曲', '编曲', '作词', '作曲', '词曲', '演唱', '原唱',
    '制作人', '混音', '母带', '吉他', '贝斯', '鼓', '和声',
    'OP', 'SP', '出品', '发行', '策划', '监制', '歌手', '录音', '伴奏',
    'Lyrics?', 'Composer', 'Arranger', 'Producer', 'Vocals?', 'Singer',
    'Mixing', 'Mix', 'Mastering', 'Master', 'Guitar', 'Bass', 'Drum', 'Drums',
    'Chorus', 'Harmony', 'Recorded', 'Recording', 'Engineer', 'Written',
    'Music', 'Words', 'Released', 'Label', 'Publishing', 'Arranged'
  ];
  const META_REGEX = new RegExp(`^(${META_PREFIXES.join('|')})(\\s+by)?[：:\\s]`, 'i');
  const FORCE_META_KEYWORDS = [' - ', 'ラッドウィンプス'];
  const COMPAT_PURE_KANJI = true;

  const TIME_TAG_REGEX = /^\[(\d+):(\d+)(?:[.:](\d+))?\](.*)/;

  // ===== 中文判断 =====
  function isSmartChinese(text) {
    if (!text) return false;
    if (/[\u3040-\u30FF]/.test(text)) return false;
    const stripped = text.replace(
      /[a-zA-Z0-9\s"'`~!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?，。！？、：；\-“”‘’（）《》〈〉「」『』【】〔〕…]/g,
      '');
    return /[\u4e00-\u9fa5]/.test(stripped);
  }

  // ===== 行判断 =====
  function isLrcLine(text) {
    return /\[\d{1,2}:\d{1,2}/.test(text);
  }

  function isMetaLine(text) {
    if (META_REGEX.test(text)) return true;
    return FORCE_META_KEYWORDS.some(kw => text.includes(kw));
  }

  // ===== 单行内容解析（委派 KRC）=====
  function parseContent(content, lineTime) {
    const isKrc = window.KRC.isKrcLine(content);
    let words = null;
    let displayText = content;
    let lineEndTime = null;

    if (isKrc) {
      const parsed = window.KRC.parseLine(content, lineTime);
      words = parsed.words;
      displayText = parsed.displayText;
      lineEndTime = parsed.lineEndTime;
    }

    return {
      main: displayText,
      sub: null,
      words,
      lineEndTime,
      isMeta: isMetaLine(displayText)
    };
  }

  // ===== LRC 时间轴解析 =====
  function parseLrc(text, offset = 0) {
    const lines = text.split('\n');
    const lyrics = [];

    lines.forEach(rawLine => {
      const match = rawLine.match(TIME_TAG_REGEX);
      if (!match) return;

      const lineMin = parseInt(match[1], 10);
      const lineSec = parseInt(match[2], 10);
      const lineMs = match[3]
        ? parseInt(match[3].padEnd(3, '0').substring(0, 3), 10)
        : 0;
      let lineTime = lineMin * 60 + lineSec + lineMs / 1000;
      lineTime = Math.max(0, lineTime + offset);

      const content = match[4].trim();
      if (!content) return;

      const item = parseContent(content, lineTime);
      const lastLyric = lyrics[lyrics.length - 1];

      // 双语合并：当前行是中文，上一行非中文（或纯汉字）且无 sub
      const isPureKanji = COMPAT_PURE_KANJI && lastLyric &&
        /^[\u4e00-\u9fa5]+$/.test(lastLyric.main) &&
        !/[\u3040-\u30FF]/.test(lastLyric.main);
      const isLastValidMain = lastLyric &&
        (!isSmartChinese(lastLyric.main) || isPureKanji);

      if (!item.isMeta &&
          (isSmartChinese(item.main) ||
           (lastLyric && Math.abs(lastLyric.time - lineTime) < 0.01))) {
        if (lastLyric && !lastLyric.sub && isLastValidMain && !lastLyric.isMeta) {
          lastLyric.sub = item.main;
          return;
        }
      }

      lyrics.push({ time: lineTime, ...item });
    });

    return lyrics;
  }

  // ===== 纯文本兜底解析（无时间轴，按行配对双语）=====
  function parsePlainText(text) {
    if (!text) return [];
    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l);
    const parsed = [];

    for (let i = 0; i < rawLines.length; i++) {
      const current = rawLines[i];
      const next = rawLines[i + 1];

      if (next && !isSmartChinese(current) && isSmartChinese(next)) {
        parsed.push({ main: current, sub: next });
        i++;
      } else {
        parsed.push({ main: current, sub: null });
      }
    }
    return parsed;
  }

  /**
   * 统一入口
   * @param {string} text     原始歌词
   * @param {number} duration 时长（纯文本时用于按比例分配时间）
   * @param {number} offset   时间偏移（秒）
   */
  function parseAll(text, duration, offset = 0) {
    if (!text || !text.trim()) {
      return { lines: [], isLRC: false, isBilingual: false };
    }

    const isLRC = isLrcLine(text);
    let lines;

    if (isLRC) {
      lines = parseLrc(text, offset);
    } else {
      lines = parsePlainText(text);
      const d = (duration && isFinite(duration) && duration > 0) ? duration : 0;
      lines.forEach((line, i) => {
        line.time = d ? (0.8 + (d - 1.6) * (i / lines.length)) : null;
      });
    }

    return {
      lines,
      isLRC,
      isBilingual: lines.some(l => l.sub)
    };
  }

  window.Lyric = {
    isSmartChinese,
    isLrcLine,
    isMetaLine,
    parseContent,
    parseLrc,
    parsePlainText,
    parseAll,
    META_PREFIXES
  };
})();