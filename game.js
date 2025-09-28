const CELL_SIZE = 25;
const ROWS = 22;
const COLS = 40;
let enemyMoveCounter = 0;
const ENEMY_MOVE_INTERVAL = 60; // 每 15 幀移動一次 (約 4 次/秒)

// 遊戲狀態
let gameState = {
  player: { x: 1, y: 1 },
  dots: [],
  specialDots: [],
  enemies: [],
  score: 0,
  gameWon: false,
  gameOver: false,
};

// DOM 元素
let canvas, ctx, scoreDisplay, victoryOverlay, restartButton, gameOverOverlay;
let MAZE;

// === 迷宮生成 (DFS) ===
function generateMaze(rows, cols) {
  let maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  function inBounds(x, y) {
    return x > 0 && y > 0 && x < cols - 1 && y < rows - 1;
  }

  function carve(x, y) {
    maze[y][x] = 0;
    const directions = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ].sort(() => Math.random() - 0.5);

    for (let [dx, dy] of directions) {
      const nx = x + dx,
        ny = y + dy;
      if (inBounds(nx, ny) && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  return maze;
}

// === 放豆豆 ===
function placeDots(maze, dotProbability = 0.3, specialProbability = 0.05) {
  let dots = [];
  let specialDots = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 0) {
        if (Math.random() < specialProbability) {
          specialDots.push({ x, y });
        } else if (Math.random() < dotProbability) {
          dots.push({ x, y });
        }
      }
    }
  }
  return { dots, specialDots };
}

// === 放敵人 ===
function placeEnemies(maze, count = 3) {
  const directions = [
    [1, 0], // 右
    [-1, 0], // 左
    [0, 1], // 下
    [0, -1], // 上
  ];
  let enemies = [];
  while (enemies.length < count) {
    let x = Math.floor(Math.random() * COLS);
    let y = Math.floor(Math.random() * ROWS);
    if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
      // 隨機選方向
      const dir = directions[Math.floor(Math.random() * directions.length)];
      enemies.push({ x, y, dx: dir[0], dy: dir[1] });
    }
  }
  return enemies;
}

// === 初始化遊戲 ===
function initGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  scoreDisplay = document.getElementById("scoreDisplay");
  victoryOverlay = document.getElementById("victoryOverlay");
  gameOverOverlay = document.getElementById("gameOverOverlay");
  restartButton = document.getElementById("restartButton");

  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;

  restartButton.addEventListener("click", resetGame);
  document.addEventListener("keydown", handleKeyPress);

  resetGame();
  gameLoop();
}

// === 重置遊戲 ===
function resetGame() {
  MAZE = generateMaze(ROWS, COLS);

  // 生成豆豆與特殊豆豆
  let { dots, specialDots } = placeDots(MAZE, 0.35, 0.07);
  gameState.dots = dots;
  gameState.specialDots = specialDots;

  // 生成敵人
  gameState.enemies = placeEnemies(MAZE, 3);

  // 重置玩家
  gameState.player = { x: 1, y: 1 };
  gameState.score = 0;
  gameState.gameWon = false;
  gameState.gameOver = false;

  victoryOverlay.classList.remove("show");
  gameOverOverlay.classList.remove("show");
  updateScoreDisplay();
}

// === 移動判斷 ===
function canMoveTo(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS && MAZE[y][x] === 0;
}

function movePlayer(dx, dy) {
  if (gameState.gameWon || gameState.gameOver) return;

  const newX = gameState.player.x + dx;
  const newY = gameState.player.y + dy;

  if (!canMoveTo(newX, newY)) return;

  gameState.player.x = newX;
  gameState.player.y = newY;

  // 吃普通豆豆
  const dotIndex = gameState.dots.findIndex(
    (dot) => dot.x === newX && dot.y === newY
  );
  if (dotIndex !== -1) {
    gameState.dots.splice(dotIndex, 1);
    gameState.score++;
    updateScoreDisplay();
  }

  // 吃特殊豆豆
  const specialIndex = gameState.specialDots.findIndex(
    (dot) => dot.x === newX && dot.y === newY
  );
  if (specialIndex !== -1) {
    gameState.specialDots.splice(specialIndex, 1);
    gameState.score += 5; // 特殊豆豆 +5 分
    updateScoreDisplay();
  }

  // 檢查勝利
  if (gameState.dots.length === 0 && gameState.specialDots.length === 0) {
    gameState.gameWon = true;
    victoryOverlay.classList.add("show");
  }
}

function handleKeyPress(event) {
  // 作弊碼：Ctrl + P 直接通關
  if (event.ctrlKey && (event.key === "p" || event.key === "P")) {
    event.preventDefault(); // 防止瀏覽器觸發列印功能

    // 如果遊戲已經結束，則不執行
    if (gameState.gameOver || gameState.gameWon) return;

    // 計算剩餘豆豆的分數並加到總分
    // 普通豆豆 +1 分，特殊豆豆 +5 分
    const remainingScore = gameState.dots.length * 1 + gameState.specialDots.length * 5;
    gameState.score += remainingScore;
    updateScoreDisplay(); // 更新分數顯示

    gameState.dots = [];
    gameState.specialDots = [];
    gameState.gameWon = true;
    victoryOverlay.classList.add("show");
  }

  switch (event.key) {
    case "ArrowUp":
      movePlayer(0, -1);
      break;
    case "ArrowDown":
      movePlayer(0, 1);
      break;
    case "ArrowLeft":
      movePlayer(-1, 0);
      break;
    case "ArrowRight":
      movePlayer(1, 0);
      break;
    case "Enter":
      if (gameState.gameWon || gameState.gameOver) resetGame();
      break;
  }
}

// === 分數 ===
function updateScoreDisplay() {
  scoreDisplay.textContent = gameState.score;
}

// === 敵人移動 ===
function moveEnemies() {
  gameState.enemies.forEach((enemy) => {
    let newX = enemy.x + enemy.dx;
    let newY = enemy.y + enemy.dy;

    if (!canMoveTo(newX, newY)) {
      // 遇牆隨機換一個新方向
      const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      // 隨機選一個可行方向
      const validDirs = directions.filter(([dx, dy]) =>
        canMoveTo(enemy.x + dx, enemy.y + dy)
      );
      if (validDirs.length > 0) {
        const [dx, dy] =
          validDirs[Math.floor(Math.random() * validDirs.length)];
        enemy.dx = dx;
        enemy.dy = dy;
        newX = enemy.x + dx;
        newY = enemy.y + dy;
      } else {
        // 四周全是牆，保持原地
        newX = enemy.x;
        newY = enemy.y;
      }
    }

    enemy.x = newX;
    enemy.y = newY;
  });
}

// === 檢查碰撞 ===
function checkCollisions() {
  gameState.enemies.forEach((enemy) => {
    if (enemy.x === gameState.player.x && enemy.y === gameState.player.y) {
      gameState.gameOver = true;
      gameOverOverlay.classList.add("show");
    }
  });
}

// === 繪製 ===
function draw() {
  // 1️⃣ 背景：淺色漸層
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, "#fdf6e3"); // 淺米色
  bgGradient.addColorStop(1, "#e0f7fa"); // 淺藍
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2️⃣ 迷宮牆：柔和的圓角立體感
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (MAZE[y][x] === 1) {
        // 簡單立體感
        ctx.fillStyle = "#90a4ae"; // 淺灰藍
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = "#cfd8dc";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x * CELL_SIZE + 1,
          y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    }
  }

  // 3️⃣ 普通豆豆：亮色小球 + 發光效果
  // 普通豆豆
  gameState.dots.forEach((dot) => {
    const cx = dot.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = dot.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.fillStyle = "#FF8A65"; // 珊瑚色
    ctx.shadowColor = "#FF8A65";
    ctx.shadowBlur = 10; // 光暈加大
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI); // 半徑變大
    ctx.fill();

    ctx.shadowBlur = 0; // 重置光暈
  });

  // 4️⃣ 特殊豆豆：紅色 + 發光 + 大一點
  gameState.specialDots.forEach((dot) => {
    const cx = dot.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = dot.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = "#ff5252"; // 紅色
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowColor = "#ff5252";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // 5️⃣ 敵人：藍色 + 漸層圓球
  gameState.enemies.forEach((enemy) => {
    const ex = enemy.x * CELL_SIZE + CELL_SIZE / 2;
    const ey = enemy.y * CELL_SIZE + CELL_SIZE / 2;
    const enemyGradient = ctx.createRadialGradient(ex, ey, 3, ex, ey, 10);
    enemyGradient.addColorStop(0, "#42a5f5"); // 中心亮藍
    enemyGradient.addColorStop(1, "#1565c0"); // 外圈深藍
    ctx.fillStyle = enemyGradient;
    ctx.beginPath();
    ctx.arc(ex, ey, 10, 0, 2 * Math.PI);
    ctx.fill();
  });

  // 6️⃣ 玩家：亮綠 + 發光
  // 玩家位置
  // 假設這些是玩家當前方向
  let playerDir = { x: 1, y: 0 }; // 右

  // 張嘴動畫
  const step = Math.sin(Date.now() / 150) * 0.2;
  const mouthAngle = Math.PI / 4 + step;

  // 玩家位置
  const px = gameState.player.x * CELL_SIZE + CELL_SIZE / 2;
  const py = gameState.player.y * CELL_SIZE + CELL_SIZE / 2;

  // 計算嘴巴朝向角
  let dirAngle = 0;
  if (playerDir.x === 1) dirAngle = 0; // 右
  else if (playerDir.x === -1) dirAngle = Math.PI; // 左
  else if (playerDir.y === 1) dirAngle = Math.PI / 2; // 下
  else if (playerDir.y === -1) dirAngle = -Math.PI / 2; // 上

  // 玩家顏色漸層
  const playerGradient = ctx.createRadialGradient(px, py, 3, px, py, 10);
  playerGradient.addColorStop(0, "#a5d6a7"); // 中心亮綠
  playerGradient.addColorStop(1, "#388e3c"); // 外圈深綠
  ctx.fillStyle = playerGradient;

  // 畫玩家（帶嘴巴）
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(
    px,
    py,
    10,
    dirAngle + mouthAngle,
    dirAngle - mouthAngle + 2 * Math.PI
  );
  ctx.closePath();
  ctx.fill();

  // 發光效果
  ctx.shadowColor = "#a5d6a7";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function gameLoop() {
  if (!gameState.gameOver && !gameState.gameWon) {
    enemyMoveCounter++;
    if (enemyMoveCounter >= ENEMY_MOVE_INTERVAL) {
      moveEnemies();
      enemyMoveCounter = 0;
    }
    checkCollisions();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// 假設這是角色初始位置
let player = { x: 5, y: 5 };

// 移動函式
function move(direction) {
  switch (direction) {
    case "up":
      player.y -= 1;
      break;
    case "down":
      player.y += 1;
      break;
    case "left":
      player.x -= 1;
      break;
    case "right":
      player.x += 1;
      break;
  }
  console.log("角色位置:", player);
  drawGame(); // 更新畫面（你原本的畫面更新函式）
}

document.addEventListener("DOMContentLoaded", () => {
  initGame(); // 初始化遊戲

  document
    .getElementById("upButton")
    .addEventListener("click", () => movePlayer(0, -1));
  document
    .getElementById("downButton")
    .addEventListener("click", () => movePlayer(0, 1));
  document
    .getElementById("leftButton")
    .addEventListener("click", () => movePlayer(-1, 0));
  document
    .getElementById("rightButton")
    .addEventListener("click", () => movePlayer(1, 0));
});
