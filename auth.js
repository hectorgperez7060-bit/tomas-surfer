// ════════════════════════════════════════════════════════
//  Tomás Surfer — Auth overlay + PWA utilities
// ════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Service Worker ──────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // ── Styles ──────────────────────────────────────────────
  const S = {
    input: `
      padding:14px 16px; font-size:15px; width:100%; box-sizing:border-box;
      border:1px solid rgba(204,255,0,0.22); border-radius:12px;
      background:rgba(255,255,255,0.04); color:#fff; outline:none;
      font-family:Arial,sans-serif; transition:border-color .2s; margin-bottom:0;`,
    btnPrimary: `
      padding:16px; font-size:16px; font-weight:900; letter-spacing:2px;
      background:#CCFF00; color:#000; border:none; border-radius:12px;
      cursor:pointer; width:100%; box-shadow:4px 4px 0 #000;
      font-family:'Arial Black',Arial,sans-serif; transition:transform .1s, opacity .1s;`,
    btnGoogle: `
      padding:13px 16px; font-size:14px; font-weight:600; width:100%;
      background:rgba(255,255,255,0.06); color:#fff; box-sizing:border-box;
      border:1px solid rgba(255,255,255,0.16); border-radius:12px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      gap:10px; font-family:Arial,sans-serif; transition:background .2s;`,
    link: `color:#CCFF00; cursor:pointer; text-decoration:underline;`,
    sep:  `flex:1; height:1px; background:rgba(255,255,255,0.08);`,
  };

  const GOOGLE_SVG = `
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
    Continuar con Google`;

  const formHTML = (mode) => {
    const isLogin = mode === 'login';
    return `
      <form id="ts-form" style="width:100%;display:flex;flex-direction:column;gap:12px;" autocomplete="on">
        <input id="ts-email" type="email" placeholder="Email"
          autocomplete="email" style="${S.input}">
        <input id="ts-pass" type="password"
          placeholder="${isLogin ? 'Contraseña' : 'Contraseña (mín. 6 caracteres)'}"
          autocomplete="${isLogin ? 'current-password' : 'new-password'}"
          style="${S.input}">
        <button type="submit" id="ts-submit" style="${S.btnPrimary}">
          ${isLogin ? 'ENTRAR' : 'CREAR CUENTA'}
        </button>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="${S.sep}"></div>
          <span style="font-size:12px;color:#888;">o</span>
          <div style="${S.sep}"></div>
        </div>
        <button type="button" id="ts-google" style="${S.btnGoogle}">${GOOGLE_SVG}</button>
        <p style="text-align:center;font-size:13px;color:#aaa;margin:2px 0 0;">
          ${isLogin
            ? `¿No tenés cuenta? <span id="ts-toggle" style="${S.link}">Registrate</span>`
            : `¿Ya tenés cuenta? <span id="ts-toggle" style="${S.link}">Iniciá sesión</span>`}
        </p>
      </form>`;
  };

  // ── Inject auth form into the existing login screen ──────
  function injectAuthForm() {
    const loginScreen = document.getElementById('login-screen');
    if (!loginScreen) return null;

    // Hide the game-form elements, keep only the h1 title
    const toHide = [
      document.getElementById('alias-input'),
      document.getElementById('char-name-display'),
      document.getElementById('start-btn'),
      loginScreen.querySelector('h3'),
      loginScreen.querySelector('.character-selector'),
      loginScreen.querySelector('.instructions'),
    ];
    toHide.forEach(el => { if (el) el.style.display = 'none'; });

    // Insert auth wrap after h1
    const wrap = document.createElement('div');
    wrap.id = 'ts-auth-wrap';
    wrap.style.cssText = 'width:100%;';
    wrap.innerHTML = `
      <div id="ts-err" style="
        display:none; color:#ff4455; font-size:13px;
        margin-bottom:14px; text-align:center;
        padding:9px 14px; border-radius:10px;
        background:rgba(255,68,85,0.1);
        border:1px solid rgba(255,68,85,0.28);
        width:100%; box-sizing:border-box;"></div>
      <div id="ts-form-wrap" style="width:100%;">
        ${formHTML('login')}
      </div>`;
    loginScreen.appendChild(wrap);

    return loginScreen;
  }

  function showGameForm() {
    const wrap = document.getElementById('ts-auth-wrap');
    if (wrap) wrap.remove();

    const loginScreen = document.getElementById('login-screen');
    if (!loginScreen) return;

    const toShow = [
      document.getElementById('alias-input'),
      document.getElementById('char-name-display'),
      document.getElementById('start-btn'),
      loginScreen.querySelector('h3'),
      loginScreen.querySelector('.character-selector'),
      loginScreen.querySelector('.instructions'),
    ];
    toShow.forEach(el => { if (el) el.style.display = ''; });
  }

  // ── Helpers ─────────────────────────────────────────────
  function showErr(msg) {
    const el = document.getElementById('ts-err');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function hideErr() {
    const el = document.getElementById('ts-err');
    if (el) el.style.display = 'none';
  }

  function errMsg(code) {
    return ({
      'auth/invalid-email':        'Email inválido.',
      'auth/user-not-found':       'No existe una cuenta con ese email.',
      'auth/wrong-password':       'Contraseña incorrecta.',
      'auth/invalid-credential':   'Email o contraseña incorrectos.',
      'auth/email-already-in-use': 'Ese email ya está registrado. Iniciá sesión.',
      'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
      'auth/popup-closed-by-user': 'Cancelaste el inicio con Google.',
      'auth/popup-blocked':        'Popup bloqueado. Permitilo en tu navegador.',
      'auth/network-request-failed':'Sin conexión. Revisá tu internet.',
      'auth/too-many-requests':    'Demasiados intentos. Esperá un momento.',
    })[code] || 'Ocurrió un error. Intentá de nuevo.';
  }

  // ── Wire up a form ───────────────────────────────────────
  let currentMode = 'login';

  function wireForm(auth, container) {
    const form   = container.querySelector('#ts-form');
    const submit = container.querySelector('#ts-submit');
    const google = container.querySelector('#ts-google');
    const toggle = container.querySelector('#ts-toggle');

    container.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('focus', () => inp.style.borderColor = 'rgba(204,255,0,0.65)');
      inp.addEventListener('blur',  () => inp.style.borderColor = 'rgba(204,255,0,0.22)');
    });

    submit.addEventListener('mousedown', () => { submit.style.transform = 'scale(0.97)'; });
    submit.addEventListener('mouseup',   () => { submit.style.transform = ''; });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideErr();
      const email = container.querySelector('#ts-email').value.trim();
      const pass  = container.querySelector('#ts-pass').value;
      const label = submit.textContent;
      submit.textContent = '...'; submit.disabled = true;
      try {
        if (currentMode === 'login') {
          await auth.signInWithEmailAndPassword(email, pass);
        } else {
          await auth.createUserWithEmailAndPassword(email, pass);
        }
      } catch (err) {
        showErr(errMsg(err.code));
        submit.textContent = label; submit.disabled = false;
      }
    });

    const googleAuth = async () => {
      hideErr();
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') showErr(errMsg(err.code));
      }
    };
    google.addEventListener('click', googleAuth);

    toggle.addEventListener('click', () => {
      currentMode = currentMode === 'login' ? 'register' : 'login';
      hideErr();
      const wrap = container.querySelector('#ts-form-wrap');
      wrap.innerHTML = formHTML(currentMode);
      wireForm(auth, container);
    });
  }

  // ── Share button ─────────────────────────────────────────
  function injectShareButton() {
    const btn = document.createElement('button');
    btn.id = 'ts-share';
    btn.title = 'Compartir juego';
    btn.setAttribute('aria-label', 'Compartir juego');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5"  r="3"/>
        <circle cx="6"  cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
      </svg>`;
    btn.style.cssText = `
      position:fixed; bottom:22px; right:22px; z-index:15;
      width:48px; height:48px; border-radius:50%;
      background:#CCFF00; color:#000; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 20px rgba(204,255,0,0.35), 4px 4px 0 #000;
      transition:transform .15s, box-shadow .15s;`;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 0 28px rgba(204,255,0,0.55), 4px 4px 0 #000';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.boxShadow = '0 0 20px rgba(204,255,0,0.35), 4px 4px 0 #000';
    });
    btn.addEventListener('click', shareGame);
    document.body.appendChild(btn);
  }

  function shareGame() {
    const best = localStorage.getItem('ts_best') || '0';
    const payload = {
      title: 'Tomás Surfer',
      text:  `¡Jugá Tomás Surfer! Endless runner neon 🏃‍♂️⚡  Mi récord: ${best} pts`,
      url:   window.location.href,
    };
    if (navigator.share) {
      navigator.share(payload).catch(() => {});
    } else {
      const txt = `${payload.text}\n${payload.url}`;
      navigator.clipboard
        ? navigator.clipboard.writeText(txt).then(() => alert('¡Link copiado! 📋'))
        : prompt('Copiá este link:', window.location.href);
    }
  }

  // ── Install prompt ───────────────────────────────────────
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const shareBtn = document.getElementById('ts-share');
    if (shareBtn) shareBtn.title = 'Compartir o instalar';
  });

  // ── Init ─────────────────────────────────────────────────
  function init() {
    injectShareButton();

    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return;
    }

    const auth      = firebase.auth();
    const container = injectAuthForm();
    if (!container) return;

    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      if (user) {
        showGameForm();
      } else {
        wireForm(auth, container);
      }

      auth.onAuthStateChanged(u => { if (u) showGameForm(); });
    });
  }

  init();
})();
