// Manejo de la interfaz — popups y actualización del HUD

function showPopup(titulo, texto) {
  const overlay = document.getElementById('popup-overlay');
  if (!overlay) return;
  document.getElementById('popup-title').textContent = titulo;
  document.getElementById('popup-body').textContent = texto;
  overlay.style.display = 'flex';
}

function setupNavButtons() {
  document.getElementById('btn-shop')?.addEventListener('click', () =>
    showPopup('TIENDA', 'Proximamente: comprá escudos, velocidad, vidas extra y personajes con tus monedas.')
  );
  document.getElementById('btn-leaderboard')?.addEventListener('click', () =>
    showPopup('RANKING', `Tu mejor puntaje: ${localStorage.getItem('bestScore') || 0}\n\nProximamente: ranking global.`)
  );
  document.getElementById('btn-profile')?.addEventListener('click', () =>
    showPopup('PERFIL', 'Proximamente: personaliza tu personaje y ve tus estadísticas.')
  );
  document.getElementById('popup-close')?.addEventListener('click', () => {
    document.getElementById('popup-overlay').style.display = 'none';
  });
}

function updateHUD(score, level, lives) {
  const scoreEl = document.getElementById('score-display');
  const levelEl = document.getElementById('level-display');
  if (scoreEl) scoreEl.textContent = String(score).padStart(7, '0');
  if (levelEl) levelEl.textContent = String(level).padStart(2, '0');
  for (let i = 0; i < 3; i++) {
    const heart = document.getElementById(`heart-${i}`);
    if (heart) heart.className = 'heart' + (i < lives ? '' : ' dead');
  }
}
