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
      font-family:Arial,sans-serif; transition:border-color .2s;`,
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
          <span style="font-size:12px;color:#444;">o</span>
          <div style="${S.sep}"></div>
        </div>
        <button type="button" id="ts-google" style="${S.btnGoogle}">${GOOGLE_SVG}</button>
        <p style="text-align:center;font-size:13px;color:#555;margin:2px 0 0;">
          ${isLogin
            ? `¿No tenés cuenta? <span id="ts-toggle" style="${S.link}">Registrate</span>`
            : `¿Ya tenés cuenta? <span id="ts-toggle" style="${S.link}">Iniciá sesión</span>`}
        </p>
      </form>`;
  };

  // ── Create Overlay ───────────────────────────────────────
  function createOverlay() {
    const el = document.createElement('div');
    el.id = 'ts-auth';
    el.style.cssText = `
      position:fixed; inset:0; z-index:100;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      background:rgba(4,4,18,0.97); backdrop-filter:blur(16px);
      color:#fff; overflow-y:auto; padding:20px; box-sizing:border-box;`;
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;width:100%;max-width:340px;">
        <img src="/icons/icon.svg" alt="Tomás Surfer"
          style="width:82px;height:82px;margin-bottom:10px;"
          onerror="this.style.display='none'">
        <div style="
          font-family:'Arial Black',Arial,sans-serif;
          font-size:clamp(36px,10vw,56px); font-weight:900;
          color:#CCFF00; letter-spacing:-2px; line-height:1;
          text-shadow:0 0 28px rgba(204,255,0,0.45);">TOM&#193;S</div>
        <div style="
          font-family:'Arial Black',Arial,sans-serif;
          font-size:clamp(15px,4vw,21px); font-weight:900;
          color:#fff; letter-spacing:10px; opacity:0.65;
          margin-bottom:28px;">SURFER</div>

        <div id="ts-err" style="
          display:none; color:#ff4455; font-size:13px;
          margin-bottom:14px; text-align:center;
          padding:9px 14px; border-radius:10px;
          background:rgba(255,68,85,0.1);
          border:1px solid rgba(255,68,85,0.28);
          width:100%; box-sizing:border-box;"></div>

        <div id="ts-form-wrap" style="width:100%;">
          ${formHTML('login')}
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
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

  function hideOverlay() {
    const el = document.getElementById('ts-auth');
    if (!el) return;
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 420);
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

  // ── Wire up a form (called each time form HTML is set) ──
  let currentMode = 'login';

  function wireForm(auth, overlay) {
    const form   = overlay.querySelector('#ts-form');
    const submit = overlay.querySelector('#ts-submit');
    const google = overlay.querySelector('#ts-google');
    const toggle = overlay.querySelector('#ts-toggle');

    // Input focus glow
    overlay.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('focus', () => inp.style.borderColor = 'rgba(204,255,0,0.65)');
      inp.addEventListener('blur',  () => inp.style.borderColor = 'rgba(204,255,0,0.22)');
    });

    // Button press scale
    submit.addEventListener('mousedown', () => { submit.style.transform = 'scale(0.97)'; });
    submit.addEventListener('mouseup',   () => { submit.style.transform = ''; });

    // Submit
    form.addEventListener('submit', async e => {
      e.preventDefault();
      hideErr();
      const email = overlay.querySelector('#ts-email').value.trim();
      const pass  = overlay.querySelector('#ts-pass').value;
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

    // Google
    const googleAuth = async () => {
      hideErr();
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') showErr(errMsg(err.code));
      }
    };
    google.addEventListener('click', googleAuth);

    // Toggle login ↔ register
    toggle.addEventListener('click', () => {
      currentMode = currentMode === 'login' ? 'register' : 'login';
      hideErr();
      const wrap = overlay.querySelector('#ts-form-wrap');
      wrap.innerHTML = formHTML(currentMode);
      wireForm(auth, overlay);
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
      // Fallback: copy to clipboard
      const txt = `${payload.text}\n${payload.url}`;
      navigator.clipboard
        ? navigator.clipboard.writeText(txt).then(() => alert('¡Link copiado! 📋'))
        : prompt('Copiá este link:', window.location.href);
    }
  }

  // ── Install prompt (Add to Home Screen) ─────────────────
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install hint in the share button tooltip
    const shareBtn = document.getElementById('ts-share');
    if (shareBtn) shareBtn.title = 'Compartir o instalar';
  });

  // ── Init ─────────────────────────────────────────────────
  function init() {
    injectShareButton();

    // If Firebase not initialized → skip auth, go straight to game
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      return;
    }

    const auth    = firebase.auth();
    const overlay = createOverlay();

    // Listen to auth state ASAP
    const unsub = auth.onAuthStateChanged(user => {
      unsub(); // only needed once to check initial state
      if (user) {
        hideOverlay();
      } else {
        // Show the login form with a small fade-in
        wireForm(auth, overlay);
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity .3s';
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
      }

      // Keep listening for subsequent sign-in
      auth.onAuthStateChanged(u => { if (u) hideOverlay(); });
    });
  }

  // DOM is already ready (scripts at end of body)
  init();
})();
