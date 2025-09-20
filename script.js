const firebaseConfig = {
    apiKey: "AIzaSyDRDvlwalRpidbThvTEMK6FZVsDnK5FSOQ",
    authDomain: "snakeevolution-90ebd.firebaseapp.com",
    projectId: "snakeevolution-90ebd",
    storageBucket: "snakeevolution-90ebd.firebasestorage.app",
    messagingSenderId: "408698178876",
    appId: "1:408698178876:web:86c7ec9e7d802556f2a239"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


const loginBtn = document.getElementById('login-btn');
const profileBtn = document.getElementById('profile-btn');
const profileMenu = document.getElementById('profile-menu');
const profilePic = document.getElementById('profile-pic');
const profileName = document.getElementById('profile-name');
const profilePicMenu = document.getElementById('profile-pic-menu');
const menuUsername = document.getElementById('menu-username');
const menuEmail = document.getElementById('menu-email');
const logoutBtn = document.getElementById('logoutBtn');
const showLeaderboardBtn = document.getElementById('showLeaderboardBtn');
const leaderboardSection = document.getElementById('leadboard-section');
const leaderboardDiv = document.getElementById('leaderboard');
const noLeaderboardMsg = document.getElementById('no-leaderboard-msg');

function hideProfileMenuEverywhere(e) {
    if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
        profileMenu.style.display = 'none';
    }
}
document.body.addEventListener('click', hideProfileMenuEverywhere);

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (profileMenu.style.display === 'block') profileMenu.style.display = 'none';
    else profileMenu.style.display = 'block';
});

// Hide menu by default
profileMenu.style.display = 'none';

logoutBtn.onclick = () => {
    auth.signOut();
    profileMenu.style.display = 'none';
    leaderboardSection.style.display = 'none';
};

// Navbar UI reacts to Auth
auth.onAuthStateChanged((user) => {
    if (user) {
        // Show profile UI
        loginBtn.style.display = 'none';
        profileBtn.style.display = '';
        profilePic.src = user.photoURL || "https://i.imgur.com/LN8kHtP.png";
        profilePicMenu.src = user.photoURL || "https://i.imgur.com/LN8kHtP.png";
        profileName.textContent = user.displayName?.split(' ')[0] || '';
        menuUsername.textContent = user.displayName || user.email;
        menuEmail.textContent = user.email;
        document.getElementById('submitScoreBtn').disabled = false;
        noLeaderboardMsg.textContent = '';
    } else {
        // Show login btn, hide profile stuff
        loginBtn.style.display = '';
        profileBtn.style.display = 'none';
        profileMenu.style.display = 'none';
        profilePic.src = "https://i.imgur.com/LN8kHtP.png";
        profileName.textContent = '';
        leaderboardSection.style.display = 'none';
        document.getElementById('submitScoreBtn').disabled = true;
        noLeaderboardMsg.textContent = "Login to submit and view the leaderboard!";
    }
});

// Leaderboard menu opens leaderboard section
showLeaderboardBtn.onclick = async function () {
    leaderboardSection.style.display = 'block';
    if (!auth.currentUser) {
        leaderboardDiv.innerHTML = `<p>Login to see leaderboard.</p>`;
        return;
    }
    const query = await db.collection('scores').orderBy('score', 'desc').limit(10).get();
    let html = `<table style="width:100%; color:#fff;"><tr><th>Rank</th><th>User</th><th>Score</th></tr>`;
    let rank = 1;
    query.forEach(doc => {
        const data = doc.data();
        html += `<tr><td>${rank}</td><td>${data.username || 'Unknown'}</td><td>${data.score}</td></tr>`;
        rank++;
    });
    html += `</table>`;
    leaderboardDiv.innerHTML = html;
    profileMenu.style.display = 'none';
};

// ---- Snake Game + Leaderboard submit (same as before) ----
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
let gameRunning = false;
let frameCount = 0;
let moveDelay = 9;
let bestScore = 0;
let animationId = null;

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

document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    if (e.key === 'ArrowUp' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    if (e.key === 'ArrowRight' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
    if (e.key === 'ArrowDown' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
});

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
    if (direction.x === 0 && direction.y === 0) return;
    direction = nextDirection;
    let head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    if (!evoActive &&
        (head.x < 0 || head.x >= canvas.width / box ||
            head.y < 0 || head.y >= canvas.height / box)) {
        return gameOver();
    }
    if (evoActive) {
        head.x = (head.x + canvas.width / box) % (canvas.width / box);
        head.y = (head.y + canvas.height / box) % (canvas.height / box);
        evoTimer--;
        if (evoTimer <= 0) {
            evoActive = false;
            document.getElementById('evoBox').textContent = '';
        }
    }
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) return gameOver();
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = score;
        food = randomEmptyTile();
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
    if (score > bestScore) bestScore = score;
    gameRunning = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('submitScoreBtn').disabled = !auth.currentUser;
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

function resetGame() {
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
}

// Button controls
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const submitScoreBtn = document.getElementById('submitScoreBtn');

startBtn.onclick = () => {
    if (!gameRunning) {
        gameRunning = true;
        pauseBtn.textContent = 'Pause';
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        if (!animationId) {
            loop();
        }
    }
};
pauseBtn.onclick = () => {
    if (gameRunning) {
        gameRunning = false;
        pauseBtn.textContent = 'Resume';
    } else {
        gameRunning = true;
        pauseBtn.textContent = 'Pause';
        if (!animationId) loop();
    }
};
resetBtn.onclick = () => {
    gameRunning = false;
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    submitScoreBtn.disabled = true;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    resetGame();
    draw();
};

submitScoreBtn.onclick = async function () {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const docRef = db.collection('scores').doc(user.uid);
    const doc = await docRef.get();
    if (doc.exists && doc.data().score >= bestScore) {
        alert('Your previous best score is higher!');
        return;
    }
    await docRef.set({ username: user.displayName, score: bestScore });
    alert('Score submitted!');
    submitScoreBtn.disabled = true;
};

draw();
