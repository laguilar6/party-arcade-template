document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start');
  const screenStart = document.getElementById('screen-start');
  const screenGame = document.getElementById('screen-game');
  const screenVictory = document.getElementById('screen-victory');
  let gameInstance = null;
  let moveLeft = false;
  let moveRight = false;
  let jumpAction = false;
  btnStart.addEventListener('click', () => {
    screenStart.classList.add('hidden');
    screenGame.classList.remove('hidden');
    initPhaserGame();
  });
  function setupTouchControls() {
    const bindBtn = (id, onPress, onRelease) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onPress(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onRelease(); });
      el.addEventListener('mousedown', () => onPress());
      el.addEventListener('mouseup', () => onRelease());
    };
    bindBtn('btn-left', () => moveLeft = true, () => moveLeft = false);
    bindBtn('btn-right', () => moveRight = true, () => moveRight = false);
    bindBtn('btn-action-a', () => jumpAction = true, () => jumpAction = false);
  }
  setupTouchControls();
  function initPhaserGame() {
    const config = {
      type: Phaser.AUTO,
      width: 380,
      height: 520,
      parent: 'phaser-game',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 650 }, debug: false }
      },
      scene: { preload, create, update }
    };
    gameInstance = new Phaser.Game(config);
    let player, cursors, coins, scoreText, score = 0;
    function preload() {
      this.load.image('cloud', 'assets/scenery/overworld/cloud1.png');
      this.load.image('bush', 'assets/scenery/overworld/bush1.png');
      this.load.image('ground', 'assets/scenery/overworld/floorbricks.png');
      this.load.image('block', 'assets/blocks/overworld/block.png');
      this.load.image('coin', 'assets/collectibles/coin.png');
      this.load.spritesheet('mario', 'assets/entities/mario.png', { frameWidth: 18, frameHeight: 16 });
      this.load.audio('jumpSound', 'assets/sound/effects/jump.mp3');
      this.load.audio('coinSound', 'assets/sound/effects/coin.mp3');
      this.load.audio('bgTheme', 'assets/sound/music/overworld/theme.mp3');
    }
    function create() {
      this.add.rectangle(190, 260, 380, 520, 0x5c94fc);
      this.add.image(100, 80, 'cloud').setScale(1.2);
      this.add.image(280, 120, 'cloud');
      this.add.image(300, 470, 'bush');
      const music = this.sound.add('bgTheme', { loop: true, volume: 0.5 });
      music.play();
      const platforms = this.physics.add.staticGroup();
      for (let x = 8; x < 380; x += 16) {
        platforms.create(x, 504, 'ground').refreshBody();
      }
      platforms.create(80, 380, 'block');
      platforms.create(96, 380, 'block');
      platforms.create(112, 380, 'block');
      platforms.create(240, 290, 'block');
      platforms.create(256, 290, 'block');
      player = this.physics.add.sprite(40, 420, 'mario');
      player.setScale(1.6);
      player.setCollideWorldBounds(true);
      player.tint = 0x33ff33;
      this.physics.add.collider(player, platforms);
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('mario', { start: 1, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({ key: 'idle', frames: [{ key: 'mario', frame: 0 }] });
      coins = this.physics.add.group({
        key: 'coin',
        repeat: 9,
        setXY: { x: 30, y: 150, stepX: 35 }
      });
      coins.children.iterate((child) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
      });
      this.physics.add.collider(coins, platforms);
      this.physics.add.overlap(player, coins, collectCoin, null, this);
      scoreText = this.add.text(12, 12, 'SCORE: 0/10', {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'SuperMario'
      });
      cursors = this.input.keyboard.createCursorKeys();
    }
    function update() {
      if (!player) return;
      const goLeft = cursors.left.isDown || moveLeft;
      const goRight = cursors.right.isDown || moveRight;
      const doJump = (cursors.up.isDown || jumpAction) && player.body.touching.down;
      if (goLeft) {
        player.setVelocityX(-150);
        player.flipX = true;
        player.anims.play('walk', true);
      } else if (goRight) {
        player.setVelocityX(150);
        player.flipX = false;
        player.anims.play('walk', true);
      } else {
        player.setVelocityX(0);
        player.anims.play('idle');
      }
      if (doJump) {
        player.setVelocityY(-340);
        this.sound.play('jumpSound');
        jumpAction = false;
      }
    }
    function collectCoin(player, coin) {
      coin.disableBody(true, true);
      this.sound.play('coinSound');
      score += 1;
      scoreText.setText('SCORE: ' + score + '/10');
      if (score >= 10) {
        this.time.delayedCall(400, () => {
          this.sound.stopAll();
          gameInstance.destroy(true);
          screenGame.classList.add('hidden');
          screenVictory.classList.remove('hidden');
        });
      }
    }
  }
});
