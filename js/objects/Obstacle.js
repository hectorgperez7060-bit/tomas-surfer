// Tipos de obstaculos
const OBS_TYPES = [
  {
    key: 'box',   // saltar encima
    draw(ctx) {
      // Caja electrica roja
      ctx.fillStyle = '#1a0505';
      ctx.fillRect(2, 2, 52, 52);
      // Borde rojo brillante
      ctx.strokeStyle = '#ff2d20'; ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 52, 52);
      // Cruz de advertencia
      ctx.strokeStyle = '#ff2d20'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(15, 28); ctx.lineTo(41, 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 15); ctx.lineTo(28, 41); ctx.stroke();
      // Tornillos en esquinas
      ctx.fillStyle = '#333';
      [10,46].forEach(cx => [10,46].forEach(cy => {
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
      }));
      // Glow exterior
      ctx.strokeStyle = 'rgba(255,45,32,0.2)'; ctx.lineWidth = 8;
      ctx.strokeRect(2, 2, 52, 52);
    },
    w: 56, h: 56
  },
  {
    key: 'bar',   // agacharse
    draw(ctx) {
      // Barra laser naranja
      // Soportes
      ctx.fillStyle = '#2a1800';
      ctx.fillRect(0, 4, 10, 36);
      ctx.fillRect(70, 4, 10, 36);
      ctx.strokeStyle = '#ff6a00'; ctx.lineWidth = 2;
      ctx.strokeRect(0, 4, 10, 36);
      ctx.strokeRect(70, 4, 10, 36);
      // Laser beam
      ctx.fillStyle = 'rgba(255,106,0,0.18)';
      ctx.fillRect(8, 0, 64, 44);
      ctx.fillStyle = '#ff6a00';
      ctx.fillRect(10, 14, 60, 16);
      // Nucleo brillante
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(10, 19, 60, 6);
      // Glow
      ctx.strokeStyle = 'rgba(255,106,0,0.35)'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(10, 22); ctx.lineTo(70, 22); ctx.stroke();
    },
    w: 80, h: 44
  },
  {
    key: 'wall',  // cambiar carril
    draw(ctx) {
      // Barrera metalica
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(2, 2, 36, 72);
      ctx.strokeStyle = '#4a4a6a'; ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 36, 72);
      // Rayas advertencia
      const stripeH = 14;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,181,153,0.35)' : 'rgba(255,181,153,0.08)';
        ctx.fillRect(2, 2 + i * stripeH, 36, stripeH);
      }
      // Borde neon sutil
      ctx.strokeStyle = 'rgba(204,255,0,0.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(2, 2, 36, 72);
      // Remaches
      ctx.fillStyle = '#555';
      [12, 28].forEach(cx => [12, 36, 60].forEach(cy => {
        ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
      }));
    },
    w: 40, h: 76
  }
];

class ObstacleManager {
  constructor(scene, W, H) {
    this.scene    = scene;
    this.W = W; this.H = H;
    this.list     = [];
    this.spawnTimer  = 0;
    this.interval    = 140;
    this.minInterval = 80;

    this._makeTextures();
  }

  _makeTextures() {
    OBS_TYPES.forEach(type => {
      const key = `obs_${type.key}`;
      if (this.scene.textures.exists(key)) return;
      const tex = this.scene.textures.createCanvas(key, type.w, type.h);
      type.draw(tex.getContext());
      tex.refresh();
    });
  }

  // Posicion X del carril en una Y dada (perspectiva)
  _laneXatY(lane, y) {
    const H = this.H;
    const W = this.W;
    const hy = H * HORIZON_FRAC;
    const gy = H * GROUND_FRAC;
    const t  = Math.max(0, Math.min(1, (y - hy) / (gy - hy)));
    return W * (LANE_X_TOP[lane] + (LANE_X_BOT[lane] - LANE_X_TOP[lane]) * t);
  }

  spawn(speed) {
    const type = Phaser.Math.RND.pick(OBS_TYPES);
    const lane = Phaser.Math.Between(0, 2);
    const hy   = this.H * HORIZON_FRAC;

    const img = this.scene.add.image(
      this._laneXatY(lane, hy),
      hy,
      `obs_${type.key}`
    ).setDepth(7).setOrigin(0.5, 0.5);

    this.list.push({ img, lane, y: hy, type: type.key, checked: false, speed });
  }

  update(speed) {
    this.spawnTimer++;
    if (this.spawnTimer >= this.interval) {
      this.spawnTimer = 0;
      this.spawn(speed);
    }

    const H  = this.H;
    const hy = H * HORIZON_FRAC;
    const gy = H * GROUND_FRAC;

    for (let i = this.list.length - 1; i >= 0; i--) {
      const obs = this.list[i];

      // Velocidad perspectiva: mas rapido al acercarse
      const tNorm = Math.max(0, (obs.y - hy) / (gy - hy));
      const velFactor = 0.3 + 0.7 * tNorm;
      obs.y += (obs.speed / 60) * velFactor;

      // Posicion X segun perspectiva
      const x = this._laneXatY(obs.lane, obs.y);
      obs.img.setPosition(x, obs.y);

      // Escala perspectiva: 0.15 en el horizonte → 1.0 en el suelo
      const scale = 0.15 + 0.85 * Math.max(0, Math.min(1, tNorm));
      obs.img.setScale(scale);

      // Profundidad visual (los mas cercanos encima)
      obs.img.setDepth(5 + tNorm * 4);

      // Destruir si paso al jugador
      if (obs.y > H + 60) {
        obs.img.destroy();
        this.list.splice(i, 1);
      }
    }
  }

  checkCollision(player, onHit) {
    const triggerY = this.H * GROUND_FRAC - 10;

    this.list.forEach(obs => {
      if (obs.checked) return;
      if (obs.y < triggerY - 30) return;

      obs.checked = true;

      if (obs.lane !== player.lane) return; // carril diferente: esquivo

      const inAir  = !player.onGround;
      const ducked = player.isDucking;

      if (obs.type === 'box' && inAir)  return; // salto sobre caja
      if (obs.type === 'bar' && ducked) return; // agachado bajo barra

      onHit(obs);
    });
  }

  removeObs(obs) {
    obs.img.destroy();
    const idx = this.list.indexOf(obs);
    if (idx >= 0) this.list.splice(idx, 1);
  }

  setDifficulty(level) {
    this.interval = Math.max(this.minInterval, 140 - level * 8);
  }

  destroyAll() {
    this.list.forEach(o => o.img.destroy());
    this.list = [];
  }
}
