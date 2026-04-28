// Motor de carrera — configuración e inicialización de Phaser
const config = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  width: 480,
  height: 860,
  backgroundColor: '#0b0c1f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1800 }, debug: false }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
