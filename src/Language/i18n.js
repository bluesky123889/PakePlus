(function() {
  const langPath = 'Language/';

  window.I18n = {
    currentLang: 'zh',
    pack: {},
    _currentReqId: 0,

    load(lang) {
      return new Promise((resolve, reject) => {
        const reqId = ++this._currentReqId;

        if (this.pack[lang]) {
          if (reqId !== this._currentReqId) return;
          this.currentLang = lang;
          this.apply();
          return resolve();
        }

        const script = document.createElement('script');
        script.src = `${langPath}${lang}.js`;
        script.onload = () => {
          if (reqId !== this._currentReqId) return;
          this.currentLang = lang;
          this.apply();
          resolve();
        };
        script.onerror = () => {
          if (reqId !== this._currentReqId) return;
          console.warn(`语言包 ${langPath}${lang}.js 加载失败`);
          if (lang !== 'zh') this.load('zh');
          reject();
        };
        document.body.appendChild(script);
      });
    },

    apply() {
      const p = window.LangPack ? window.LangPack[this.currentLang] : {};
      if (!p) return;

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');

        if (el.id === 'topTitle' && window.isPlayingVideo) {
          return;
        }

        if (p[key]) {
          // 🔧 v1.7.1: 仅白名单 key 允许 HTML 渲染，防止语言包被篡改时注入
          const allowHtml = /^v\d+D\d+$/.test(key) || key === 'appDesc';
          if (allowHtml && p[key].includes('<') && p[key].includes('>')) {
            el.innerHTML = p[key];
          } else {
            el.textContent = p[key];
          }
        } else if (/^v\d+D\d+$/.test(key)) {
          // 🔧 v1.7.1: 开发期提示更新日志缺失
          console.warn(`[i18n] 语言包 ${this.currentLang} 缺少更新日志键: ${key}`);
        }
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (p[key]) el.placeholder = p[key];
      });

      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (p[key]) el.title = p[key];
      });

      document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
      });

      localStorage.setItem('video_lang_pref', this.currentLang);

      if (typeof window.updateTopTime === 'function') window.updateTopTime();
      if (typeof window.renderShortcuts === 'function') window.renderShortcuts();
      if (typeof window.refreshManageBtnText === 'function') window.refreshManageBtnText();
      if (typeof window.refreshSkipPanel === 'function') window.refreshSkipPanel();
    },

    init() {
      const savedLang = localStorage.getItem('video_lang_pref') || 'zh';
      this.load(savedLang);

      document.addEventListener('click', (e) => {
        const langBtn = e.target.closest('.lang-option');
        if (langBtn) {
          const lang = langBtn.dataset.lang;
          if (lang !== this.currentLang) {
            this.load(lang).then(() => {
              const msg = window.LangPack[lang] && window.LangPack[lang]['saveLangTip']
                ? window.LangPack[lang]['saveLangTip']
                : 'Language saved';
              if (typeof window.showToast === 'function') window.showToast(msg);
            });
          }
        }
      });
    }
  };
})();