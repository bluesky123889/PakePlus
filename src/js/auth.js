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

    // 🔧 v1.7.1: 加盐哈希，兼容旧用户
    hashPassword: async function(password, salt) {
      const msgBuffer = new TextEncoder().encode((salt || '') + ':' + password);
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

      const t = (key) => window._ ? window._(key) : key;

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

      if (loginPass) {
        loginPass.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && submitBtn && !submitBtn.classList.contains('loading')) {
            submitBtn.click();
          }
        });
      }

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

            // 🔧 v1.7.1: 重置密码时同时更换盐
            const salt = crypto.randomUUID();
            const hashedPwd = await this.hashPassword(newPass, salt);
            users[userIndex].password = hashedPwd;
            users[userIndex].salt = salt;
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

              // 🔧 v1.7.1: 兼容旧用户（无 salt），登录成功后静默升级
              const hashedPwd = user.salt
                ? await this.hashPassword(p, user.salt)
                : await this.hashPassword(p);
              if (user.password !== hashedPwd) throw new Error(t('passIncorrect'));

              if (!user.salt) {
                const newSalt = crypto.randomUUID();
                user.salt = newSalt;
                user.password = await this.hashPassword(p, newSalt);
                localStorage.setItem(USER_LIST_KEY, JSON.stringify(users));
                console.log('[Auth] 旧用户密码已升级为加盐哈希');
              }

              localStorage.setItem(CURRENT_USER_KEY, u);
              this.currentUser = u;
              this.namespace = `user_${u}_`;

              setTimeout(() => {
                this.hideUI();
                setTimeout(() => location.reload(), 200);
              }, 800);

            } else {
              if (users.find(user => user.username === u)) throw new Error(t('userExists'));

              // 🔧 v1.7.1: 注册时生成盐
              const salt = crypto.randomUUID();
              const hashedPwd = await this.hashPassword(p, salt);
              users.push({ username: u, password: hashedPwd, securityCode: code, salt });
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