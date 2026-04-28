// Constantes de perspectiva compartidas con GameScene
const HORIZON_FRAC = 0.30;
const GROUND_FRAC  = 0.72;
const LANE_X_TOP   = [0.44, 0.50, 0.56]; // carriles en el horizonte (juntos)
const LANE_X_BOT   = [0.22, 0.50, 0.78]; // carriles en nivel del suelo (separados)

class Player {
  constructor(scene, W, H) {
    this.scene = scene;
    this.W = W; this.H = H;
    this.lane = 1;
    this.isDucking    = false;
    this.isMovingLane = false;
    this.runTick = 0;
    this.groundY = Math.round(H * GROUND_FRAC);

    this._makeTextures();

    const startX = Math.round(W * LANE_X_BOT[1]);
    const startY = this.groundY - 48;

    this.sprite = scene.physics.add.sprite(startX, startY, 'pl_r0');
    this.sprite.setDepth(8);
    this.sprite.body.setSize(34, 72);
    this.sprite.body.setOffset(13, 14);

    // Plataforma del suelo (invisible)
    this.platform = scene.physics.add.staticImage(W / 2, this.groundY + 3, '__DEFAULT');
    this.platform.setDisplaySize(W, 8).setVisible(false).refreshBody();
    scene.physics.add.collider(this.sprite, this.platform);
  }

  // ── TEXTURAS ──────────────────────────────────────────────────────────────

  _makeTextures() {
    const s = this.scene;
    for (let i = 0; i < 4; i++) this._makeRun(s, i);
    this._makeDuck(s);
    this._makeJump(s);
  }

  _makeRun(scene, idx) {
    const key = `pl_r${idx}`;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, 60, 96);
    this._drawRun(tex.getContext(), idx);
    tex.refresh();
  }

  _makeDuck(scene) {
    if (scene.textures.exists('pl_dk')) return;
    const tex = scene.textures.createCanvas('pl_dk', 60, 96);
    this._drawDuck(tex.getContext());
    tex.refresh();
  }

  _makeJump(scene) {
    if (scene.textures.exists('pl_jp')) return;
    const tex = scene.textures.createCanvas('pl_jp', 60, 96);
    this._drawJump(tex.getContext());
    tex.refresh();
  }

  // ── DIBUJO DE FRAMES ──────────────────────────────────────────────────────

  _drawRun(ctx, f) {
    const cx = 30;
    ctx.clearRect(0, 0, 60, 96);
    const t = (f / 4) * Math.PI * 2;
    const ll =  Math.sin(t) * 0.48;  // angulo pierna izquierda
    const rl = -Math.sin(t) * 0.48;  // angulo pierna derecha
    const la = -Math.sin(t) * 0.32;  // brazo izquierdo (opuesto a pierna der)
    const ra =  Math.sin(t) * 0.32;

    // ── BRAZO TRASERO ──
    ctx.save();
    ctx.translate(cx - 12, 34);
    ctx.rotate(la - 0.15);
    ctx.fillStyle = '#1a1b2e';
    ctx.fillRect(-4, 0, 8, 20);
    ctx.translate(0, 18); ctx.rotate(0.5);
    ctx.fillRect(-3, 0, 7, 14);
    ctx.restore();

    // ── PIERNA TRASERA ──
    ctx.save();
    ctx.translate(cx - 9, 60);
    ctx.rotate(ll);
    ctx.fillStyle = '#0e0e20';
    ctx.fillRect(-5, 0, 10, 22);
    ctx.translate(0, 20); ctx.rotate(-ll * 0.55 + 0.08);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-4, 0, 9, 20);
    ctx.fillStyle = '#aad000';
    ctx.fillRect(-7, 18, 16, 7);
    ctx.restore();

    // ── CUERPO ──
    ctx.fillStyle = '#1d1e32';
    ctx.beginPath();
    ctx.moveTo(cx - 15, 30); ctx.lineTo(cx + 15, 30);
    ctx.lineTo(cx + 11, 62); ctx.lineTo(cx - 11, 62);
    ctx.closePath(); ctx.fill();

    // Contorno neon
    ctx.strokeStyle = '#CCFF00'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 15, 30); ctx.lineTo(cx + 15, 30);
    ctx.lineTo(cx + 11, 62); ctx.lineTo(cx - 11, 62);
    ctx.closePath(); ctx.stroke();
    // Linea central
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx, 33); ctx.lineTo(cx, 60); ctx.stroke();

    // Hombreras
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(cx - 18, 27, 7, 5);
    ctx.fillRect(cx + 11, 27, 7, 5);

    // ── CABEZA / CASCO ──
    ctx.fillStyle = '#23243a';
    ctx.beginPath(); ctx.arc(cx, 16, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c2d44';
    ctx.beginPath(); ctx.arc(cx, 12, 11, Math.PI, 0); ctx.fill();
    // Visor
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(cx - 12, 12, 24, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(cx - 12, 12, 9, 10);
    ctx.strokeStyle = '#aadd00'; ctx.lineWidth = 0.8;
    ctx.strokeRect(cx - 12, 12, 24, 10);
    // Menton
    ctx.fillStyle = '#111122'; ctx.fillRect(cx - 8, 26, 16, 7);
    // Antena
    ctx.fillStyle = '#CCFF00'; ctx.fillRect(cx - 3, 3, 6, 4);

    // ── BRAZO FRONTAL ──
    ctx.save();
    ctx.translate(cx + 12, 34);
    ctx.rotate(ra + 0.15);
    ctx.fillStyle = '#252640';
    ctx.fillRect(-4, 0, 8, 20);
    ctx.translate(0, 18); ctx.rotate(-0.5);
    ctx.fillRect(-3, 0, 7, 14);
    ctx.restore();

    // ── PIERNA FRONTAL ──
    ctx.save();
    ctx.translate(cx + 9, 60);
    ctx.rotate(rl);
    ctx.fillStyle = '#1a1a32';
    ctx.fillRect(-5, 0, 10, 22);
    ctx.translate(0, 20); ctx.rotate(-rl * 0.55 - 0.08);
    ctx.fillStyle = '#141428';
    ctx.fillRect(-4, 0, 9, 20);
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(-7, 18, 16, 7);
    ctx.restore();
  }

  _drawDuck(ctx) {
    const cx = 30;
    ctx.clearRect(0, 0, 60, 96);
    const base = 62;

    // Cuerpo agachado (mas bajo en el canvas)
    ctx.fillStyle = '#1d1e32';
    ctx.fillRect(cx - 22, base - 20, 44, 22);
    ctx.strokeStyle = '#CCFF00'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 22, base - 20, 44, 22);

    // Cabeza adelantada
    ctx.fillStyle = '#23243a';
    ctx.beginPath(); ctx.arc(cx + 16, base - 24, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(cx + 5, base - 30, 22, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(cx + 5, base - 30, 8, 9);
    ctx.fillStyle = '#111122'; ctx.fillRect(cx + 8, base - 22, 14, 5);

    // Piernas comprimidas
    ctx.fillStyle = '#0e0e20';
    ctx.fillRect(cx - 20, base + 2, 14, 12);
    ctx.fillRect(cx + 6,  base + 2, 14, 12);
    // Zapatillas
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(cx - 22, base + 12, 18, 7);
    ctx.fillRect(cx + 4,  base + 12, 18, 7);

    // Brazos doblados
    ctx.fillStyle = '#1a1b2e';
    ctx.fillRect(cx - 22, base - 14, 10, 16);
    ctx.fillStyle = '#252640';
    ctx.fillRect(cx + 12, base - 14, 10, 16);
  }

  _drawJump(ctx) {
    const cx = 30;
    ctx.clearRect(0, 0, 60, 96);

    // Cuerpo
    ctx.fillStyle = '#1d1e32';
    ctx.beginPath();
    ctx.moveTo(cx - 14, 28); ctx.lineTo(cx + 14, 28);
    ctx.lineTo(cx + 10, 58); ctx.lineTo(cx - 10, 58);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#CCFF00'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 14, 28); ctx.lineTo(cx + 14, 28);
    ctx.lineTo(cx + 10, 58); ctx.lineTo(cx - 10, 58);
    ctx.closePath(); ctx.stroke();

    // Hombreras
    ctx.fillStyle = '#CCFF00';
    ctx.fillRect(cx - 17, 25, 7, 5); ctx.fillRect(cx + 10, 25, 7, 5);

    // Cabeza
    ctx.fillStyle = '#23243a';
    ctx.beginPath(); ctx.arc(cx, 14, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c2d44';
    ctx.beginPath(); ctx.arc(cx, 10, 11, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#CCFF00'; ctx.fillRect(cx - 12, 10, 24, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(cx - 12, 10, 9, 10);
    ctx.fillStyle = '#111122'; ctx.fillRect(cx - 8, 24, 16, 6);
    ctx.fillStyle = '#CCFF00'; ctx.fillRect(cx - 3, 1, 6, 5);

    // Brazos extendidos arriba-atras
    ctx.save(); ctx.translate(cx - 13, 30); ctx.rotate(-0.9);
    ctx.fillStyle = '#1a1b2e'; ctx.fillRect(-4, -20, 8, 22);
    ctx.translate(0, -18); ctx.rotate(-0.4);
    ctx.fillRect(-3, 0, 7, 14); ctx.restore();

    ctx.save(); ctx.translate(cx + 13, 30); ctx.rotate(0.9);
    ctx.fillStyle = '#252640'; ctx.fillRect(-4, -20, 8, 22);
    ctx.translate(0, -18); ctx.rotate(0.4);
    ctx.fillRect(-3, 0, 7, 14); ctx.restore();

    // Piernas dobladas hacia arriba
    ctx.save(); ctx.translate(cx - 9, 56); ctx.rotate(-0.55);
    ctx.fillStyle = '#0e0e20'; ctx.fillRect(-5, 0, 10, 18);
    ctx.translate(0, 16); ctx.rotate(1.1);
    ctx.fillRect(-4, 0, 9, 16);
    ctx.fillStyle = '#CCFF00'; ctx.fillRect(-7, 14, 16, 7); ctx.restore();

    ctx.save(); ctx.translate(cx + 9, 56); ctx.rotate(0.55);
    ctx.fillStyle = '#1a1a32'; ctx.fillRect(-5, 0, 10, 18);
    ctx.translate(0, 16); ctx.rotate(-1.1);
    ctx.fillRect(-4, 0, 9, 16);
    ctx.fillStyle = '#CCFF00'; ctx.fillRect(-7, 14, 16, 7); ctx.restore();
  }

  // ── ACCIONES ──────────────────────────────────────────────────────────────

  jump() {
    if (this.sprite.body.blocked.down) {
      this.sprite.body.setVelocityY(-920);
      if (this.isDucking) this.standUp();
    }
  }

  duck() {
    if (this.isDucking) return;
    this.isDucking = true;
    this.sprite.setTexture('pl_dk');
    this.sprite.body.setSize(42, 44);
    this.sprite.body.setOffset(9, 42);
    if (!this.sprite.body.blocked.down) this.sprite.body.setVelocityY(700);
  }

  standUp() {
    if (!this.isDucking) return;
    this.isDucking = false;
    this.sprite.body.setSize(34, 72);
    this.sprite.body.setOffset(13, 14);
  }

  moveLeft() {
    if (this.isMovingLane || this.lane === 0) return;
    this.lane--;
    this._slideTo(Math.round(this.W * LANE_X_BOT[this.lane]));
  }

  moveRight() {
    if (this.isMovingLane || this.lane === 2) return;
    this.lane++;
    this._slideTo(Math.round(this.W * LANE_X_BOT[this.lane]));
  }

  _slideTo(x) {
    this.isMovingLane = true;
    this.scene.tweens.add({
      targets: this.sprite,
      x,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => { this.isMovingLane = false; }
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  update() {
    this.runTick++;

    if (!this.isDucking) {
      const onGround = this.sprite.body.blocked.down;
      if (!onGround) {
        this.sprite.setTexture('pl_jp');
      } else {
        // Animar corrida: 1 frame cada 7 ticks
        const frame = Math.floor(this.runTick / 7) % 4;
        this.sprite.setTexture(`pl_r${frame}`);
      }
    }
  }

  get x()         { return this.sprite.x; }
  get y()         { return this.sprite.y; }
  get onGround()  { return this.sprite.body.blocked.down; }
}
