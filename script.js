const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const box = 20;

let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let food = randomTile();
let score = 0;
let evo = null;
let evoActive = false;
let evoTimer = 0;

let frameCount = 0;
let moveDelay = 7;

let gameRunning = false;
let animationId = null;

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

pauseBtn.disabled = true;
resetBtn.disabled = true;

document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    if (e.key === 'ArrowUp' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    if (e.key === 'ArrowRight' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
    if (e.key === 'ArrowDown' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
});

startBtn.addEventListener('click', () => {
    if (!gameRunning) startGame();
});

pauseBtn.addEventListener('click', () => {
    if (gameRunning || pauseBtn.textContent === 'Resume') pauseGame();
});

resetBtn.addEventListener('click', () => {
    resetGame();
});

function randomTile() {
    return {
        x: Math.floor(Math.random() * canvas.width / box),
        y: Math.floor(Math.random() * canvas.height / box)
    };
}

function randomEmptyTile() {
    let pos;
    do {
        pos = randomTile();
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    return pos;
}

function draw() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food
    ctx.fillStyle = "#ffcb05";
    ctx.fillRect(food.x * box, food.y * box, box, box);

    // Evo powerup
    if (evo) {
        ctx.fillStyle = "#ff45a3";
        ctx.beginPath();
        ctx.arc(evo.x * box + box / 2, evo.y * box + box / 2, box / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i ? "#39ff14" : "#fff";
        ctx.fillRect(snake[i].x * box, snake[i].y * box, box - 2, box - 2);
    }
}

function update() {
    direction = nextDirection;

    if (direction.x === 0 && direction.y === 0) return;

    let head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Wall collision unless evoActive
    if (!evoActive &&
        (head.x < 0 || head.x >= canvas.width / box ||
            head.y < 0 || head.y >= canvas.height / box)
    ) {
        return gameOver();
    }

    // Wall pass effect
    if (evoActive) {
        head.x = (head.x + canvas.width / box) % (canvas.width / box);
        head.y = (head.y + canvas.height / box) % (canvas.height / box);
        evoTimer--;
        if (evoTimer <= 0) {
            evoActive = false;
            document.getElementById('evoBox').textContent = '';
        }
    }

    // Self collision (ignore for single cell)
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) return gameOver();

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = score;
        food = randomEmptyTile();

        // Randomly spawn evolution powerup
        if (!evo && Math.random() < 0.2) evo = randomEmptyTile();

    } else if (evo && head.x === evo.x && head.y === evo.y) {
        evoActive = true;
        evoTimer = 40; 
        document.getElementById('evoBox').textContent = 'Wall pass active!';
        evo = null;
    } else {
        snake.pop();
    }
}

function gameOver() {
    gameRunning = false;
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    alert("Game Over! Final Score: " + score);
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}


function startGame() {
    gameRunning = true;
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    if (!animationId) loop();
}

function pauseGame() {
    if (gameRunning) {
        gameRunning = false;
        pauseBtn.textContent = 'Resume';
    } else {
        gameRunning = true;
        pauseBtn.textContent = 'Pause';
        if (!animationId) loop();
    }
}

function resetGame() {
    gameRunning = false;
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    resetBtn.disabled = true;

    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    food = randomTile();
    score = 0;
    evo = null;
    evoActive = false;
    evoTimer = 0;
    frameCount = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('evoBox').textContent = '';

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    draw();
}

function loop() {
    animationId = requestAnimationFrame(loop);

    if (!gameRunning) return;

    frameCount++;
    if (frameCount >= moveDelay) {
        frameCount = 0;
        update();
    }
    draw();
}

draw();
