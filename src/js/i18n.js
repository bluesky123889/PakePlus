(function() {
  const langPath = 'js/'; // 语言包存放的文件夹

  window.I18n = {
    currentLang: 'zh',
    pack: {},
    _currentReqId: 0, // 防止快速切换时的竞态

    // 加载并应用语言
    load(lang) {
      return new Promise((resolve, reject) => {
        const reqId = ++this._currentReqId;

        // 如果已经加载过，直接应用
        if (this.pack[lang]) {
          if (reqId !== this._currentReqId) return; // 已经被新的请求覆盖
          this.currentLang = lang;
          this.apply();
          return resolve();
        }

        const script = document.createElement('script');
        script.src = `${langPath}${lang}.js`;
        script.onload = () => {
          if (reqId !== this._currentReqId) return; // 已经被新的请求覆盖
          this.currentLang = lang;
          this.apply();
          resolve();
        };
        script.onerror = () => {
          if (reqId !== this._currentReqId) return;
          console.warn(`语言包 ${langPath}${lang}.js 加载失败`);
          if (lang !== 'zh') this.load('zh'); // 回退中文
          reject();
        };
        document.body.appendChild(script);
      });
    },

    // 替换页面所有文本
    apply() {
      const p = window.LangPack ? window.LangPack[this.currentLang] : {};
      if (!p) return;

      // 1. 替换普通的文字节点
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        // 如果当前正在播放视频，跳过更新左上角标题
        if (el.id === 'topTitle' && window.isPlayingVideo) {
          return;
        }

        if (p[key]) {
          // 如果包含 HTML 标签（如 <b> <br>），使用 innerHTML 渲染
          if (p[key].includes('<') && p[key].includes('>')) {
            el.innerHTML = p[key];
          } else {
            // 否则使用 textContent，防止意外解析
            el.textContent = p[key];
          }
        }
      });

      // 2. 替换 placeholder（输入框占位符）
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (p[key]) el.placeholder = p[key];
      });

      // 3. 替换 title（悬浮提示）
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (p[key]) el.title = p[key];
      });

      // 4. 更新语言选项的选中状态
      document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
      });

      // 5. 保存记忆
      localStorage.setItem('video_lang_pref', this.currentLang);

      // 6. 联动刷新：如果存在 updateTopTime，立刻刷新时间格式
      if (typeof window.updateTopTime === 'function') {
        window.updateTopTime();
      }
      
      // 7. 联动刷新：如果存在 renderShortcuts，立刻刷新快捷键标签
      if (typeof window.renderShortcuts === 'function') {
        window.renderShortcuts();
      }

      // 8. 联动刷新：管理按钮已移除 data-i18n，需手动刷新文本（管理/取消）
      if (typeof window.refreshManageBtnText === 'function') {
        window.refreshManageBtnText();
      }
    },

    // 初始化
    init() {
      const savedLang = localStorage.getItem('video_lang_pref') || 'zh';
      this.load(savedLang);

      // 绑定语言选项的点击事件
      document.addEventListener('click', (e) => {
        const langBtn = e.target.closest('.lang-option');
        if (langBtn) {
          const lang = langBtn.dataset.lang;
          if (lang !== this.currentLang) {
            this.load(lang).then(() => {
              // 使用全局的 toast 提示
              const msg = window.LangPack[lang] && window.LangPack[lang]['saveLangTip'] 
                ? window.LangPack[lang]['saveLangTip'] 
                : 'Language saved';
              if (typeof window.showToast === 'function') {
                window.showToast(msg);
              }
            });
          }
        }
      });
    }
  };
})();