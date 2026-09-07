document.addEventListener('DOMContentLoaded', () => {
  const screenStart = document.getElementById('screen-start');
  const screenGame = document.getElementById('screen-game');
  const screenVictory = document.getElementById('screen-victory');
  const modalInstructions = document.getElementById('modal-instructions');
  const modalGameOver = document.getElementById('modal-gameover');

  const btnStart = document.getElementById('btn-start');
  const btnDismissInstructions = document.getElementById('btn-dismiss-instructions');
  const btnRetry = document.getElementById('btn-retry');

  const hudHearts = document.getElementById('hud-hearts');
  const hudScore = document.getElementById('hud-score');
  const hudTimer = document.getElementById('hud-timer');

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // CARGA DE SPRITES DESDE /assets
  const assets = {};
  const imageSources = {
    bgHills1: 'assets/background-hills1.png',
    bgHills2: 'assets/background-hills2.png',
    blockFloor: 'assets/block-floor.png',
    blockGreen: 'assets/block-green.png',
    coinYellow: 'assets/coin-yellow.png',
    coinRed: 'assets/coin-red.png',
    heartFull: 'assets/icon-heart-full.png',
    heartEmpty: 'assets/icon-heart-empty.png',
    luigiIdle: 'assets/luigi-idle.png',
    luigiRun1: 'assets/luigi-run1.png',
    luigiRun2: 'assets/luigi-run2.png',
    luigiRun3: 'assets/luigi-run3.png',
    luigiJump1: 'assets/luigi-jump1.png'
  };

  Object.keys(imageSources).forEach(key => {
    assets[key] = new Image();
    assets[key].src = imageSources[key];
  });

  // ESTADO DEL JUEGO
  let lives = 3;
  let timer = 30;
  let yellowCoinsRemaining = 0;
  let gameInterval = null;
  let timerInterval = null;
  let isGameOver = false;
  let animFrame = 0;

  const player = {
    x: 30,
    y: 150,
    width: 24,
    height: 32,
    vx: 0,
    vy: 0,
    speed: 2.5,
    isJumping: false,
    facingLeft: false
  };

  const bricks = [
    { x: 30, y: 150, width: 80, height: 16 },
    { x: 180, y: 120, width: 100, height: 16 }
  ];

  let coins = [];
  const keys = { left: false, right: false };

  function setupControls() {
    const bindTouch = (id, startAction, endAction) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); startAction(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); if (endAction) endAction(); });
      el.addEventListener('mousedown', () => startAction());
      el.addEventListener('mouseup', () => { if (endAction) endAction(); });
    };

    bindTouch('btn-left', () => { keys.left = true; player.facingLeft = true; }, () => keys.left = false);
    bindTouch('btn-right', () => { keys.right = true; player.facingLeft = false; }, () => keys.right = false);

    const jump = () => {
      if (!player.isJumping) {
        player.vy = -8;
        player.isJumping = true;
      }
    };

    bindTouch('btn-up', jump);
    bindTouch('btn-action-a', jump);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = true; player.facingLeft = true; }
      if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = true; player.facingLeft = false; }
      if (e.key === 'ArrowUp' || e.key === ' ') jump();
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });
  }

  btnStart.addEventListener('click', () => modalInstructions.classList.remove('hidden'));
  btnDismissInstructions.addEventListener('click', () => {
    modalInstructions.classList.add('hidden');
    screenStart.classList.add('hidden');
    screenGame.classList.remove('hidden');
    initGame();
  });
  btnRetry.addEventListener('click', () => {
    modalGameOver.classList.add('hidden');
    initGame();
  });

  function initGame() {
    lives = 3;
    timer = 30;
    isGameOver = false;

    player.x = 30;
    player.y = 150;
    player.vx = 0;
    player.vy = 0;
    player.isJumping = false;

    spawnCoins();
    updateHUD();

    if (gameInterval) clearInterval(gameInterval);
    if (timerInterval) clearInterval(timerInterval);

    gameInterval = setInterval(updateGame, 1000 / 60);
    timerInterval = setInterval(updateTimer, 1000);
  }

  function spawnCoins() {
    coins = [];
    yellowCoinsRemaining = 0;
    for (let i = 0; i < 10; i++) {
      const isBad = (i === 3 || i === 7);
      if (!isBad) yellowCoinsRemaining++;
      coins.push({
        x: 35 + i * 28,
        y: 90 - Math.sin(i) * 20,
        width: 16,
        height: 20,
        isBad: isBad,
        collected: false
      });
    }
  }

  function updateHUD() {
    hudHearts.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = (i < lives) ? 'assets/icon-heart-full.png' : 'assets/icon-heart-empty.png';
      img.className = 'hud-heart-img';
      hudHearts.appendChild(img);
    }
    hudScore.textContent = `${10 - yellowCoinsRemaining}/10`;
    hudTimer.textContent = `${timer}s`;
  }

  function updateTimer() {
    if (isGameOver) return;
    timer--;
    updateHUD();
    if (timer <= 0) triggerGameOver();
  }

  function updateGame() {
    if (isGameOver) return;
    animFrame++;

    if (keys.left) player.vx = -player.speed;
    else if (keys.right) player.vx = player.speed;
    else player.vx = 0;

    player.x += player.vx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.y += player.vy;
    player.vy += 0.4;

    const groundY = 190;
    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      player.vy = 0;
      player.isJumping = false;
    }

    bricks.forEach(b => {
      if (player.x + player.width > b.x &&
          player.x < b.x + b.width &&
          player.y + player.height >= b.y &&
          player.y + player.height <= b.y + 8 &&
          player.vy >= 0) {
        player.y = b.y - player.height;
        player.vy = 0;
        player.isJumping = false;
      }
    });

    coins.forEach(coin => {
      if (!coin.collected) {
        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
          
          coin.collected = true;

          if (coin.isBad) {
            lives--;
            updateHUD();
            if (lives <= 0) triggerGameOver();
          } else {
            yellowCoinsRemaining--;
            updateHUD();
            if (yellowCoinsRemaining === 0) triggerVictory();
          }
        }
      }
    });

    renderCanvas();
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo Colinas
    if (assets.bgHills1.complete) ctx.drawImage(assets.bgHills1, 10, 140, 90, 50);
    if (assets.bgHills2.complete) ctx.drawImage(assets.bgHills2, 240, 145, 100, 45);

    // Suelo
    for (let x = 0; x < canvas.width; x += 16) {
      if (assets.blockFloor.complete) ctx.drawImage(assets.blockFloor, x, 190, 16, 50);
    }

    // Plataformas
    bricks.forEach(b => {
      for (let bx = b.x; bx < b.x + b.width; bx += 16) {
        if (assets.blockGreen.complete) ctx.drawImage(assets.blockGreen, bx, b.y, 16, b.height);
      }
    });

    // Monedas
    coins.forEach(coin => {
      if (!coin.collected) {
        const sprite = coin.isBad ? assets.coinRed : assets.coinYellow;
        if (sprite && sprite.complete) {
          ctx.drawImage(sprite, coin.x, coin.y, coin.width, coin.height);
        }
      }
    });

    // Animación de Luigi
    let currentSprite = assets.luigiIdle;

    if (player.isJumping) {
      currentSprite = assets.luigiJump1;
    } else if (player.vx !== 0) {
      const runFrames = [assets.luigiRun1, assets.luigiRun2, assets.luigiRun3];
      const frameIdx = Math.floor(animFrame / 8) % 3;
      currentSprite = runFrames[frameIdx];
    }

    ctx.save();
    if (player.facingLeft) {
      ctx.translate(player.x + player.width, player.y);
      ctx.scale(-1, 1);
      if (currentSprite && currentSprite.complete) ctx.drawImage(currentSprite, 0, 0, player.width, player.height);
    } else {
      if (currentSprite && currentSprite.complete) ctx.drawImage(currentSprite, player.x, player.y, player.width, player.height);
    }
    ctx.restore();
  }

  function triggerGameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    modalGameOver.classList.remove('hidden');
  }

  function triggerVictory() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    screenGame.classList.add('hidden');
    screenVictory.classList.remove('hidden');
  }

  setupControls();
});