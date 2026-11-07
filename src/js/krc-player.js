(function () {
  'use strict';

  const KRC = {
    isKrcLine(lineText) {
      const content = lineText.replace(/^\[\d+:\d+(?:[.:]\d+)?\]/, '');
      return /[<\[]\d+:\d+(?:[.:]\d+)?[>\]]/.test(content);
    },

    parseLine(line, lineTime) {
      const wordTimeRegex = /[<\[](\d+):(\d+)(?:[.:](\d+))?[>\]]/g;
      const words = [];
      let contentLine = line.replace(/^\[\d+:\d+(?:[.:]\d+)?\]/, '');

      let lastIndex = 0;
      let lastTime = lineTime;
      let lineEndTime = lineTime; 
      let match;

      while ((match = wordTimeRegex.exec(contentLine)) !== null) {
        const textSegment = contentLine.substring(lastIndex, match.index);
        const wMin = parseInt(match[1]);
        const wSec = parseInt(match[2]);
        const wMs = match[3] ? parseInt(match[3].padEnd(3, '0').substring(0, 3)) : 0;
        const currentTime = wMin * 60 + wSec + wMs / 1000;
        
        // 完美过滤：只要有真实文字（含中文、日文、英文），就加入数组
        if (textSegment && textSegment.trim().length > 0) {
          words.push({ 
            time: lastTime, 
            text: textSegment, 
            duration: Math.max(0.01, currentTime - lastTime)
          });
        }
        
        lastTime = currentTime;
        lineEndTime = currentTime;
        lastIndex = wordTimeRegex.lastIndex;
      }

      const lastSegment = contentLine.substring(lastIndex);
      if (lastSegment && lastSegment.trim().length > 0) {
        words.push({ time: lastTime, text: lastSegment, duration: 1.0 });
        lineEndTime = lastTime + 1.0;
      }

      // 过滤掉所有时间标签
      const displayText = contentLine
        .replace(/[<\[]\d+:\d+(?:[.:]\d+)?[>\]]/g, '')
        .replace(/[<\[]\d+:\d+(?:[.:]\d+)?/g, '')
        .trim();

      return { words, displayText, lineEndTime };
    },

    renderLineDOM(displayText) {
      const highlight = document.createElement('span');
      highlight.className = 'krc-highlight';
      highlight.textContent = displayText;
      highlight.style.setProperty('--progress', '0%');
      return highlight;
    },

    getProgress(words, currentTime, lineEndTime) {
      if (!words || words.length === 0) return 0;
      
      let effectiveLineEnd = lineEndTime;
      const lastWord = words[words.length - 1];
      
      if (!effectiveLineEnd || effectiveLineEnd <= lastWord.time) {
        effectiveLineEnd = lastWord.time + 0.5;
      }

      let progressPercent = 0;
      let currentIndex = -1;
      
      for (let i = 0; i < words.length; i++) {
        if (currentTime >= words[i].time) {
          currentIndex = i;
        } else {
          break;
        }
      }

      if (currentIndex !== -1) {
        const totalChars = words.reduce((sum, w) => sum + w.text.replace(/\s/g, '').length, 0);
        if (totalChars === 0) return 0;

        let charsBefore = 0;
        for (let i = 0; i < currentIndex; i++) {
          charsBefore += words[i].text.replace(/\s/g, '').length;
        }

        const currentWord = words[currentIndex];
        const nextWord = (currentIndex + 1 < words.length) ? words[currentIndex + 1] : null;
        
        const nextTime = nextWord ? nextWord.time : effectiveLineEnd;
        const wordDuration = nextTime - currentWord.time;
        const elapsedInWord = currentTime - currentWord.time;
        
        // 【经典匀速算法】：不再强行打断。时间多长，就慢慢匀速扫过去。
        // 这符合所有主流音乐软件的视觉习惯。
        let wordProgress = wordDuration > 0 
          ? Math.max(0, Math.min(1, elapsedInWord / wordDuration)) 
          : 1;
        
        const currentWordCharLength = currentWord.text.replace(/\s/g, '').length;
        const currentTotalChars = charsBefore + (currentWordCharLength * wordProgress);
        progressPercent = (currentTotalChars / totalChars) * 100;
      }

      return Math.min(100, Math.max(0, progressPercent));
    }
  };

  window.KRC = KRC;
})();