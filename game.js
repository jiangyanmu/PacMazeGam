// 2D 迷宮吃豆豆遊戲 JavaScript 代碼

// 遊戲常數
const CELL_SIZE = 25;
const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// 遊戲狀態
let gameState = {
    player: { x: 9, y: 9 },
    dots: [],
    score: 0,
    gameWon: false
};

// DOM 元素
let canvas, ctx, scoreDisplay, victoryOverlay, restartButton;

// 初始化遊戲
function initGame() {
    // 獲取 DOM 元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreDisplay = document.getElementById('scoreDisplay');
    victoryOverlay = document.getElementById('victoryOverlay');
    restartButton = document.getElementById('restartButton');

    // 設置 canvas 尺寸
    canvas.width = MAZE[0].length * CELL_SIZE;
    canvas.height = MAZE.length * CELL_SIZE;

    // 重置遊戲狀態
    resetGame();

    // 添加事件監聽器
    document.addEventListener('keydown', handleKeyPress);
    restartButton.addEventListener('click', resetGame);

    // 開始遊戲循環
    gameLoop();
}

// 重置遊戲
function resetGame() {
    // 初始化小豆豆位置
    gameState.dots = [];
    for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[y].length; x++) {
            if (MAZE[y][x] === 2) {
                gameState.dots.push({ x, y });
            }
        }
    }

    // 重置遊戲狀態
    gameState.player = { x: 9, y: 9 };
    gameState.score = 0;
    gameState.gameWon = false;

    // 隱藏勝利覆蓋層
    victoryOverlay.classList.remove('show');
    
    // 更新分數顯示
    updateScoreDisplay();
}

// 檢查位置是否可移動
function canMoveTo(x, y) {
    if (x < 0 || x >= MAZE[0].length || y < 0 || y >= MAZE.length) {
        return false;
    }
    return MAZE[y][x] !== 1; // 1是牆壁
}

// 移動玩家
function movePlayer(dx, dy) {
    if (gameState.gameWon) return;

    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;

    if (!canMoveTo(newX, newY)) {
        return;
    }

    gameState.player.x = newX;
    gameState.player.y = newY;

    // 檢查是否吃到小豆豆
    const dotIndex = gameState.dots.findIndex(dot => dot.x === newX && dot.y === newY);
    if (dotIndex !== -1) {
        gameState.dots.splice(dotIndex, 1);
        gameState.score++;
        updateScoreDisplay();

        // 檢查是否獲勝
        if (gameState.dots.length === 0) {
            gameState.gameWon = true;
            victoryOverlay.classList.add('show');
        }
    }
}

// 鍵盤事件處理
function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowUp':
            event.preventDefault();
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            event.preventDefault();
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            event.preventDefault();
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            event.preventDefault();
            movePlayer(1, 0);
            break;
        case 'Enter':
            event.preventDefault();
            if (gameState.gameWon) {
                resetGame();
            }
            break;
    }
}

// 更新分數顯示
function updateScoreDisplay() {
    scoreDisplay.textContent = gameState.score;
    
    // 添加分數增加動畫效果
    if (gameState.score > 0) {
        scoreDisplay.style.transform = 'scale(1.2)';
        scoreDisplay.style.color = 'hsl(50, 100%, 90%)';
        
        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
            scoreDisplay.style.color = 'hsl(50, 100%, 85%)';
        }, 200);
    }
}

// 繪製遊戲
function draw() {
    // 清除畫布
    ctx.fillStyle = 'hsl(220, 15%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製迷宮
    for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[y].length; x++) {
            const cellX = x * CELL_SIZE;
            const cellY = y * CELL_SIZE;

            if (MAZE[y][x] === 1) {
                // 繪製牆壁
                ctx.fillStyle = 'hsl(240, 20%, 25%)';
                ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
                
                // 添加邊框
                ctx.strokeStyle = 'hsl(240, 30%, 40%)';
                ctx.lineWidth = 1;
                ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // 繪製小豆豆
    gameState.dots.forEach(dot => {
        const centerX = dot.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = dot.y * CELL_SIZE + CELL_SIZE / 2;
        
        ctx.fillStyle = 'hsl(45, 100%, 70%)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // 添加發光效果
        ctx.save();
        ctx.shadowColor = 'hsl(45, 100%, 70%)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.restore();
    });

    // 繪製玩家
    const playerCenterX = gameState.player.x * CELL_SIZE + CELL_SIZE / 2;
    const playerCenterY = gameState.player.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.fillStyle = 'hsl(50, 100%, 60%)';
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 10, 0, 2 * Math.PI);
    ctx.fill();

    // 添加玩家發光效果
    ctx.save();
    ctx.shadowColor = 'hsl(50, 100%, 60%)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
}

// 遊戲主循環
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// 當頁面加載完成時初始化遊戲
document.addEventListener('DOMContentLoaded', initGame);