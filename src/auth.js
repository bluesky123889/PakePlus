(function() {
  const USER_LIST_KEY = 'video_players_users';
  const CURRENT_USER_KEY = 'video_current_user';

  window.Auth = {
    currentUser: null,
    namespace: 'guest_',
    isLoginMode: true,

    init: function() {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        this.currentUser = savedUser;
        this.namespace = `user_${savedUser}_`;
        this.hideUI();
        this.onAuthSuccess(savedUser);
      } else {
        this.showUI();
        this.bindEvents();
      }
    },

    logout: function() {
      localStorage.removeItem(CURRENT_USER_KEY);
      location.reload();
    },

    hashPassword: async function(password) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    getUsers: function() {
      try { return JSON.parse(localStorage.getItem(USER_LIST_KEY)) || []; } 
      catch(e) { return []; }
    },

    onAuthSuccess: function(username) {
      if (typeof window.onAuthReady === 'function') {
        window.onAuthReady(username, this.namespace);
      }
    },

    showUI: function() {
      const authLayer = document.getElementById('authLayer');
      if (authLayer) authLayer.classList.remove('hidden');
    },

    hideUI: function() {
      const authLayer = document.getElementById('authLayer');
      if (authLayer) authLayer.classList.add('hidden');
    },

    bindEvents: function() {
      const submitBtn = document.getElementById('authSubmitBtn');
      const switchLink = document.getElementById('authSwitchLink');
      const switchText = document.getElementById('authSwitchText');
      const authError = document.getElementById('authError');
      const loginUser = document.getElementById('loginUser');
      const loginPass = document.getElementById('loginPass');
      const securityCodeGroup = document.getElementById('securityCodeGroup');
      const securityCodeInput = document.getElementById('securityCode');
      const forgotLink = document.querySelector('.auth-forgot');
      
      // 为了避免 i18n 没加载时的报错，加一层兜底
      const t = (key) => window._ ? window._(key) : key;

      // ================= 切换登录/注册模式 =================
      if (switchLink) {
        switchLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (submitBtn && submitBtn.classList.contains('loading')) return;
          
          this.isLoginMode = !this.isLoginMode;
          if (authError) authError.textContent = '';
          if (loginUser) loginUser.value = '';
          if (loginPass) loginPass.value = '';
          if (securityCodeInput) securityCodeInput.value = '';

          if (this.isLoginMode) {
            if (submitBtn) submitBtn.textContent = t('login');
            if (switchText) switchText.textContent = t('noAccount');
            if (switchLink) switchLink.textContent = t('clickRegister');
            if (securityCodeGroup) securityCodeGroup.style.display = 'none';
          } else {
            if (submitBtn) submitBtn.textContent = t('register');
            if (switchText) switchText.textContent = t('hasAccount');
            if (switchLink) switchLink.textContent = t('clickLogin');
            if (securityCodeGroup) securityCodeGroup.style.display = 'block';
          }
        });
      }

      // 回车键快捷提交
      if (loginPass) {
        loginPass.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && submitBtn && !submitBtn.classList.contains('loading')) {
            submitBtn.click();
          }
        });
      }

      // ================= 找回密码弹窗逻辑 =================
      if (forgotLink) {
        const forgotDialog = document.getElementById('forgotDialog');
        const resetCancelBtn = document.getElementById('resetCancelBtn');
        const resetConfirmBtn = document.getElementById('resetConfirmBtn');
        const resetError = document.getElementById('resetError');
        
        const resetUser = document.getElementById('resetUser');
        const resetCode = document.getElementById('resetCode');
        const resetNewPass = document.getElementById('resetNewPass');

        const closeDialog = () => {
          if (forgotDialog) forgotDialog.classList.add('hidden');
          if (resetError) resetError.textContent = '';
          if (resetUser) resetUser.value = '';
          if (resetCode) resetCode.value = '';
          if (resetNewPass) resetNewPass.value = '';
        };

        forgotLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (submitBtn && submitBtn.classList.contains('loading')) return;
          if (forgotDialog) forgotDialog.classList.remove('hidden');
        });

        if (resetCancelBtn) resetCancelBtn.addEventListener('click', closeDialog);
        if (forgotDialog) {
          forgotDialog.addEventListener('click', (e) => {
            if (e.target === forgotDialog) closeDialog();
          });
        }

        // 执行密码重置
        if (resetConfirmBtn) {
          resetConfirmBtn.addEventListener('click', async () => {
            const u = resetUser.value.trim();
            const code = resetCode.value.trim();
            const newPass = resetNewPass.value;

            if (!u || !code || !newPass) {
              if (resetError) resetError.textContent = '请填写完整信息';
              return;
            }
            if (code.length !== 6) {
              if (resetError) resetError.textContent = '安全校验码必须是6位数字';
              return;
            }

            const users = this.getUsers();
            const userIndex = users.findIndex(user => user.username === u);

            if (userIndex === -1) {
              if (resetError) resetError.textContent = t('userNotExist');
              return;
            }

            const user = users[userIndex];

            if (user.securityCode && user.securityCode !== code) {
              if (resetError) resetError.textContent = '安全校验码错误';
              return;
            }

            // 校验通过，更新密码
            const hashedPwd = await this.hashPassword(newPass);
            users[userIndex].password = hashedPwd;
            if (!user.securityCode) {
              users[userIndex].securityCode = code;
            }
            
            localStorage.setItem(USER_LIST_KEY, JSON.stringify(users));
            
            if (resetError) {
              resetError.style.color = '#6c5ce7';
              resetError.textContent = t('passwordResetSuccess');
            }
            
            setTimeout(() => {
              closeDialog();
              if (!this.isLoginMode) switchLink.click();
              if (loginUser) loginUser.value = u;
              if (loginPass) loginPass.value = '';
            }, 1000);
          });
        }
      }

      // ================= 提交登录 / 注册 =================
      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          if (submitBtn.classList.contains('loading')) return;

          const u = loginUser ? loginUser.value.trim() : '';
          const p = loginPass ? loginPass.value : '';
          const code = securityCodeInput ? securityCodeInput.value.trim() : '';

          if (!u || !p) {
            if (authError) authError.textContent = t('fillComplete');
            return;
          }

          if (!this.isLoginMode) {
            if (!code || code.length !== 6) {
              if (authError) authError.textContent = t('fillCode');
              return;
            }
          }

          if (authError) authError.textContent = '';
          
          submitBtn.classList.add('loading');
          submitBtn.textContent = this.isLoginMode ? t('loginProcess') : t('registerProcess');

          try {
            const users = this.getUsers();
            
            if (this.isLoginMode) {
              const user = users.find(user => user.username === u);
              if (!user) throw new Error(t('userNotExist'));
              
              const hashedPwd = await this.hashPassword(p);
              if (user.password !== hashedPwd) throw new Error(t('passIncorrect'));

              localStorage.setItem(CURRENT_USER_KEY, u);
              this.currentUser = u;
              this.namespace = `user_${u}_`;
              
              setTimeout(() => {
                this.hideUI();
                setTimeout(() => location.reload(), 200);
              }, 800);

            } else {
              if (users.find(user => user.username === u)) throw new Error(t('userExists'));
              
              const hashedPwd = await this.hashPassword(p);
              users.push({ username: u, password: hashedPwd, securityCode: code });
              localStorage.setItem(USER_LIST_KEY, JSON.stringify(users));

              this.isLoginMode = true;
              if (authError) {
                authError.style.color = '#6c5ce7';
                authError.textContent = t('registerSuccess');
              }
              
              submitBtn.classList.remove('loading');
              submitBtn.textContent = t('login');
              if (switchText) switchText.textContent = t('noAccount');
              if (switchLink) switchLink.textContent = t('clickRegister');
              if (securityCodeGroup) securityCodeGroup.style.display = 'none';
            }
          } catch (err) {
            if (authError) {
              authError.style.color = '#ff6b6b';
              authError.textContent = err.message || '操作失败';
            }
            
            submitBtn.classList.remove('loading');
            submitBtn.textContent = this.isLoginMode ? t('login') : t('register');
          }
        });
      }
    }
  };
})();