class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._buildBackground(W, H);
    this._buildScrollingLines(W, H);

    this.player    = new Player(this, W, H);
    this.obstacles = new ObstacleManager(this, W, H);

    this._setupControls(W);
    this._setupTouch(W);
    this._setupNavButtons();

    this.score     = 0;
    this.level     = 1;
    this.speed     = 280;
    this.lives     = 3;
    this.isHurt    = false;
    this.isOver    = false;
    this.scoreTick = 0;

    this._updateHUD();
  }

  // ── FONDO PERSPECTIVA ─────────────────────────────────────────────────────

  _buildBackground(W, H) {
    const bg = this.add.graphics().setDepth(0);
    const hy  = H * HORIZON_FRAC;
    const gy  = H * GROUND_FRAC;

    // ── CIELO ──
    // Degradado cielo → horizonte
    const skyBands = [
      { y: 0,        h: hy * 0.4,  c: 0x06071a },
      { y: hy * 0.4, h: hy * 0.35, c: 0x0c0d22 },
      { y: hy * 0.75, h: hy * 0.25, c: 0x12132a }
    ];
    skyBands.forEach(b => { bg.fillStyle(b.c); bg.fillRect(0, b.y, W, b.h + 1); });

    // ── CIUDAD (silueta) ──
    this._drawBuildings(bg, W, hy, 0x0e0f22, 90, 22, 1.0);  // fondo
    this._drawBuildings(bg, W, hy, 0x111225, 65, 18, 1.4);  // frente

    // Linea horizonte neon
    bg.lineStyle(1, 0xCCFF00, 0.22);
    bg.strokeLineShape(new Phaser.Geom.Line(0, hy, W, hy));

    // ── PISTA (trapecio de perspectiva) ──
    // Relleno de la pista entre los rieles exteriores
    const lx0_top = W * 0.38;  // borde izq en horizonte
    const rx0_top = W * 0.62;  // borde der en horizonte
    const lx0_bot = W * 0.08;  // borde izq en suelo
    const rx0_bot = W * 0.92;  // borde der en suelo

    bg.fillStyle(0x0b0c1e);
    bg.fillTriangle(lx0_top, hy, rx0_top, hy, rx0_bot, gy);
    bg.fillTriangle(lx0_top, hy, lx0_bot, gy, rx0_bot, gy);

    // ── DIVISORES DE CARRIL (lineas de perspectiva) ──
    // Calculamos los 4 extremos de carril en el horizonte y en el suelo
    // Borde izquierdo del carril 0 en horizonte = LANE_X_TOP[0] - ancho medio
    const laneEdgesTop = [
      W * 0.41, W * 0.47, W * 0.53, W * 0.59 // 4 lineas divisorias
    ];
    const laneEdgesBot = [
      W * 0.08, W * 0.36, W * 0.64, W * 0.92
    ];

    // Lineas divisorias de carril
    laneEdgesTop.forEach((tx, i) => {
      bg.lineStyle(1.5, 0xCCFF00, 0.30);
      bg.strokeLineShape(new Phaser.Geom.Line(tx, hy, laneEdgesBot[i], gy));
    });

    // ── SUELO EXTENDIDO (debajo del suelo del jugador) ──
    bg.fillStyle(0x090a1a);
    bg.fillRect(0, gy, W, H - gy);
    // Franjas laterales
    bg.fillStyle(0x0d0e20);
    bg.fillRect(0, gy, W * 0.08, H - gy);
    bg.fillRect(W * 0.92, gy, W * 0.08, H - gy);

    // Linea del suelo neon
    bg.lineStyle(2, 0xCCFF00, 0.55);
    bg.strokeLineShape(new Phaser.Geom.Line(W * 0.06, gy, W * 0.94, gy));
    bg.lineStyle(10, 0xCCFF00, 0.04);
    bg.strokeLineShape(new Phaser.Geom.Line(W * 0.06, gy, W * 0.94, gy));

    // Punto de fuga (glow en el horizonte)
    bg.fillStyle(0xCCFF00, 0.04);
    bg.fillCircle(W / 2, hy, 60);
    bg.fillStyle(0xCCFF00, 0.03);
    bg.fillCircle(W / 2, hy, 120);
  }

  _drawBuildings(bg, W, hy, color, maxH, avgW, density) {
    bg.fillStyle(color);
    let x = 0;
    const heights = [70, 110, 55, 150, 90, 65, 130, 48, 100, 80, 120, 60];
    const widths  = [22, 34, 18, 42, 28, 20, 38, 16, 30, 25, 36, 20];
    let idx = 0;
    while (x < W) {
      const bw = widths[idx % widths.length];
      const bh = Math.min(maxH, heights[idx % heights.length]);
      bg.fillRect(x, hy - bh, bw, bh);
      // Ventanas (2-3 por edificio)
      const winCount = Math.floor(bw / 10);
      for (let wi = 0; wi < winCount; wi++) {
        if ((idx + wi) % 3 !== 0) {
          bg.fillStyle(0xCCFF00, 0.06 + (idx % 3) * 0.02);
          bg.fillRect(x + 5 + wi * 10, hy - bh + 8, 5, 6);
          bg.fillStyle(color);
        }
      }
      x += bw + Math.round(4 / density);
      idx++;
    }
  }

  // ── LINEAS DE VELOCIDAD (scrolling) ────────────────────────────────────────

  _buildScrollingLines(W, H) {
    this._speedLines = [];
    const hy = H * HORIZON_FRAC;
    const gy = H * GROUND_FRAC;

    // Generamos lineas que parten del punto de fuga hacia afuera
    const count = 14;
    for (let i = 0; i < count; i++) {
      const progress = i / count; // 0 = horizonte, 1 = suelo
      const g = this.add.graphics().setDepth(1).setAlpha(0.18);
      this._speedLines.push({ g, progress });
    }
    this._hy = hy;
    this._gy = gy;
  }

  _updateSpeedLines(speed) {
    const W  = this.scale.width;
    const hy = this._hy;
    const gy = this._gy;
    const vp = W / 2; // vanishing point X

    // Bordes del trapecio en el suelo
    const leftBotX  = W * 0.08;
    const rightBotX = W * 0.92;

    this._speedLines.forEach(line => {
      line.progress += (speed / 60) / (gy - hy) * 0.9;
      if (line.progress > 1.0) line.progress -= 1.0;

      const t  = line.progress;
      const y  = hy + (gy - hy) * t;
      const lx = vp + (leftBotX  - vp) * t;
      const rx = vp + (rightBotX - vp) * t;

      // Alpha: invisible en horizonte, visible en suelo
      const alpha = 0.05 + t * 0.18;

      line.g.clear();
      line.g.lineStyle(0.8 + t * 2, 0xCCFF00, alpha);
      line.g.strokeLineShape(new Phaser.Geom.Line(lx, y, rx, y));
    });
  }

  // ── CONTROLES ──────────────────────────────────────────────────────────────

  _setupControls(W) {
    const p = this.player;
    this.input.keyboard.on('keydown-UP',    () => p.jump());
    this.input.keyboard.on('keydown-SPACE', () => p.jump());
    this.input.keyboard.on('keydown-W',     () => p.jump());
    this.input.keyboard.on('keydown-DOWN',  () => p.duck());
    this.input.keyboard.on('keydown-S',     () => p.duck());
    this.input.keyboard.on('keyup-DOWN',    () => p.standUp());
    this.input.keyboard.on('keyup-S',       () => p.standUp());
    this.input.keyboard.on('keydown-LEFT',  () => p.moveLeft());
    this.input.keyboard.on('keydown-A',     () => p.moveLeft());
    this.input.keyboard.on('keydown-RIGHT', () => p.moveRight());
    this.input.keyboard.on('keydown-D',     () => p.moveRight());
  }

  _setupTouch(W) {
    let sx = 0, sy = 0;
    const MIN = 36;
    this.input.on('pointerdown', p => { sx = p.x; sy = p.y; });
    this.input.on('pointerup',   p => {
      if (this.isOver) return;
      const dx = p.x - sx;
      const dy = p.y - sy;
      if (Math.abs(dx) < MIN && Math.abs(dy) < MIN) { this.player.jump(); return; }
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < -MIN) this.player.jump();
        else {
          this.player.duck();
          this.time.delayedCall(450, () => this.player.standUp());
        }
      } else {
        if (dx < -MIN) this.player.moveLeft();
        else            this.player.moveRight();
      }
    });
  }

  // ── BOTONES NAV ────────────────────────────────────────────────────────────

  _setupNavButtons() {
    const show = (titulo, texto) => {
      const el = document.getElementById('popup-overlay');
      if (!el) return;
      document.getElementById('popup-title').textContent = titulo;
      document.getElementById('popup-body').textContent  = texto;
      el.style.display = 'flex';
    };

    document.getElementById('btn-shop')?.addEventListener('click', () =>
      show('TIENDA', 'Proximamente: comprá escudos, velocidad, vidas extra y personajes con tus monedas.')
    );
    document.getElementById('btn-leaderboard')?.addEventListener('click', () =>
      show('RANKING', `Tu mejor puntaje: ${localStorage.getItem('bestScore') || 0}\n\nProximamente: ranking global.`)
    );
    document.getElementById('btn-profile')?.addEventListener('click', () =>
      show('PERFIL', 'Proximamente: personaliza tu personaje y ve tus estadísticas.')
    );
    document.getElementById('popup-close')?.addEventListener('click', () => {
      document.getElementById('popup-overlay').style.display = 'none';
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  _updateHUD() {
    const s = document.getElementById('score-display');
    const l = document.getElementById('level-display');
    if (s) s.textContent = String(this.score).padStart(7, '0');
    if (l) l.textContent = String(this.level).padStart(2, '0');
    for (let i = 0; i < 3; i++) {
      const h = document.getElementById(`heart-${i}`);
      if (h) h.className = 'heart' + (i < this.lives ? '' : ' dead');
    }
  }

  // ── DAÑO ──────────────────────────────────────────────────────────────────

  _loseLife() {
    this.lives--;
    this.isHurt = true;
    this._updateHUD();
    this.cameras.main.flash(300, 180, 0, 0);
    this.cameras.main.shake(250, 0.012);
    if (this.lives <= 0) { this._gameOver(); return; }
    this.time.delayedCall(1300, () => { this.isHurt = false; });
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────

  _gameOver() {
    this.isOver = true;
    this.obstacles.destroyAll();

    const best = Math.max(this.score, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);

    const W = this.scale.width;
    const H = this.scale.height;

    const ov = this.add.graphics().setDepth(20);
    ov.fillStyle(0x000000, 0.75); ov.fillRect(0, 0, W, H);

    const px = W / 2 - 155, py = H / 2 - 140;
    const panel = this.add.graphics().setDepth(21);
    panel.fillStyle(0x0b0c1f, 0.96);
    panel.fillRoundedRect(px, py, 310, 280, 16);
    panel.lineStyle(2, 0xCCFF00, 0.85);
    panel.strokeRoundedRect(px, py, 310, 280, 16);
    panel.fillStyle(0xCCFF00);
    panel.fillRoundedRect(px, py, 310, 6, { tl: 16, tr: 16, bl: 0, br: 0 });

    const style = (size, color, font) => ({
      fontFamily: font || "'Plus Jakarta Sans', sans-serif",
      fontSize: `${size}px`, color: color || '#ffffff'
    });

    this.add.text(W/2, py+44, 'GAME OVER', {
      ...style(30, '#CCFF00'),
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
      shadow: { blur: 16, color: '#CCFF00', fill: true }
    }).setOrigin(0.5).setDepth(22);

    this.add.text(W/2, py+90, 'SCORE', {
      fontFamily:"'Spline Sans',sans-serif", fontSize:'11px',
      color:'#6b7280', letterSpacing:4
    }).setOrigin(0.5).setDepth(22);

    this.add.text(W/2, py+118, String(this.score).padStart(7,'0'), {
      ...style(28, '#ffffff'), fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);

    this.add.text(W/2, py+158, `Mejor: ${String(best).padStart(7,'0')}`, {
      ...style(15, '#CCFF00')
    }).setOrigin(0.5).setDepth(22);

    this.add.text(W/2, py+186, `Nivel ${this.level}`, {
      ...style(14, '#ffb599')
    }).setOrigin(0.5).setDepth(22);

    const btn = this.add.text(W/2, py+238, 'JUGAR DE NUEVO', {
      fontFamily:"'Spline Sans',sans-serif", fontSize:'15px',
      fontStyle:'bold', color:'#000',
      backgroundColor:'#CCFF00', padding:{ x:28, y:14 }
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor:'#eeff55' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor:'#CCFF00' }));
    btn.on('pointerdown', () => this.scene.restart());
    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    this.input.keyboard.once('keydown-ENTER', () => this.scene.restart());
  }

  // ── LEVEL UP ──────────────────────────────────────────────────────────────

  _showLevelUp() {
    const txt = this.add.text(this.scale.width/2, 220, `NIVEL ${this.level}`, {
      fontFamily:"'Plus Jakarta Sans',sans-serif",
      fontSize:'46px', fontStyle:'bold',
      color:'#CCFF00', stroke:'#000', strokeThickness:5,
      shadow:{ blur:24, color:'#CCFF00', fill:true }
    }).setOrigin(0.5).setDepth(16);

    this.tweens.add({
      targets: txt, y: 130, alpha: 0,
      duration: 1600, ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  update() {
    if (this.isOver) return;

    this.scoreTick++;
    if (this.scoreTick % 5 === 0) { this.score++; this._updateHUD(); }

    const newLevel = Math.floor(this.score / 250) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.speed = Math.min(280 + (this.level - 1) * 50, 750);
      this.obstacles.setDifficulty(this.level);
      this._showLevelUp();
      this._updateHUD();
    }

    this._updateSpeedLines(this.speed);
    this.player.update();
    this.obstacles.update(this.speed);

    if (!this.isHurt) {
      this.obstacles.checkCollision(this.player, obs => {
        this.obstacles.removeObs(obs);
        this._loseLife();
      });
    }
  }
}
