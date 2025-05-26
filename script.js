// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');
const pauseGameButton = document.getElementById('pauseGameButton');
const gameInstructions = document.getElementById('game-instructions');
const gameTimer = document.getElementById('game-timer');
const gameMessage = document.getElementById('game-message');
const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalPlayAgainButton = document.getElementById('modalPlayAgainButton');
const modalCloseButton = document.getElementById('modalCloseButton');
const gameSelector = document.getElementById('game-selector');

// Game state variables
let gameActive = false;
let gamePaused = false;
let gameStartTime;
let gamePauseTime = 0; // Accumulates total paused time
let lastFrameTime = 0;
let gameDuration = 20 * 1000; // 20 seconds in milliseconds
let currentMicrogame = null;
let animationFrameId;
let matchGameTimeout = null;
let mazeGameTimeout = null;

// --- Game Definitions ---
const games = [
    { id: 'cat-asleep', name: 'Keep the Cat Asleep' },
    { id: 'ufo-abduction', name: 'Don\'t Let the UFO Abduct You' },
    { id: 'catch-stars', name: 'Catch the Falling Stars' },
    { id: 'avoid-lasers', name: 'Avoid the Lasers' },
    { id: 'remember-sequence', name: 'Remember the Sequence' },
    { id: 'click-target', name: 'Click the Target' },
    { id: 'balance-ball', name: 'Balance the Ball' },
    { id: 'quick-reflexes', name: 'Quick Reflexes' },
    { id: 'memory-match', name: 'Memory Match (Pairs)' },
    { id: 'maze-runner', name: 'Maze Runner' }
];

// Game 1: Keep the Cat Asleep variables
const CAT_ASLEEP_GAME_ID = 'cat-asleep';
const cat = { x: 0, y: 0, radius: 40 };
let noises = [];
let noiseInterval;

// Game 2: Don't Let the UFO Abduct You variables
const UFO_GAME_ID = 'ufo-abduction';
const player = { x: 0, y: 0, width: 30, height: 30, speed: 5 };
const ufo = { x: 0, y: 50, width: 80, height: 40, speed: 4, targetX: 0 };
let ufoBeamActive = false;
let ufoBeamDuration = 0;
const MAX_BEAM_DURATION = 200;
let keysPressed = {};
let touchStartX = 0;

// Game 3: Catch the Falling Stars variables
const CATCH_STARS_GAME_ID = 'catch-stars';
let stars = [];
let starSpawnInterval;
let score = 0;

// Game 4: Avoid the Lasers variables
const AVOID_LASERS_GAME_ID = 'avoid-lasers';
const laserPlayer = { x: 0, y: 0, radius: 15, speed: 6 };
let lasers = [];
let laserSpawnInterval;
let laserKeysPressed = {};
let laserTouchStartX = 0; // For touch controls
const LASER_WARNING_DURATION = 500; // ms
const LASER_SPAWN_FREQUENCY = 600; // ms
const LASER_ACTIVE_DURATION = 1500; // MODIFICATION: Time laser stays active (ms)

// Game 5: Remember the Sequence variables
const REMEMBER_SEQUENCE_GAME_ID = 'remember-sequence';
const sequenceButtons = [
    { id: 0, x: 0, y: 0, size: 80, color: '#4B0082', highlightColor: '#9932CC' },
    { id: 1, x: 0, y: 0, size: 80, color: '#8B0000', highlightColor: '#FF6347' },
    { id: 2, x: 0, y: 0, size: 80, color: '#006400', highlightColor: '#7CFC00' },
    { id: 3, x: 0, y: 0, size: 80, color: '#FF8C00', highlightColor: '#FFD700' }
];
let gameSequence = [];
let playerSequence = [];
let sequenceStep = 0;
let displayPhase = true;
let currentHighlightButton = -1;
let sequenceGameTimeout;
const DISPLAY_DURATION = 700; // ms
const PAUSE_DURATION = 150;   // ms

// Game 6: Click the Target variables (Note: ID implies 7th, using 'click-target' as ID)
const CLICK_TARGET_GAME_ID = 'click-target';
const target = { x: 0, y: 0, radius: 20, hit: false, spawnTime: 0, color: 'blue' };
let targetScore = 0;
let targetSpawnTimeout;
const TARGET_MIN_RADIUS = 10;
const TARGET_MAX_RADIUS = 30;
const TARGET_SPAWN_INTERVAL = 800; // ms, time between spawns if hit
const TARGET_LIFETIME = 1500;    // ms, how long target stays if not hit

// Game 7: Balance the Ball variables
const BALANCE_BALL_GAME_ID = 'balance-ball';
const platform = { x: 0, y: 0, width: 100, height: 15, speed: 7 };
const ball = { x: 0, y: 0, radius: 10, dx: 0, dy: 0, speed: 9 };
let ballKeysPressed = {};
let ballTouchStartX = 0; // For touch controls

// Game 8: Quick Reflexes variables
const QUICK_REFLEXES_GAME_ID = 'quick-reflexes';
const reflexButton = { x: 0, y: 0, size: 100, color: 'gray', isTarget: false, canClick: false };
const REFLEX_COLORS = ['#FF4500', '#008000', '#4169E1', '#FFD700', '#8A2BE2', '#00CED1']; // OrangeRed, Green, RoyalBlue, Gold, BlueViolet, DarkTurquoise
const REFLEX_TARGET_COLOR = '#008000'; // Green
let reflexScore = 0;
let colorChangeIntervalId; // For changing reflex button color
const COLOR_CHANGE_RATE = 400;     // ms, base rate for color change
const REFLEX_CLICK_WINDOW = 200;   // ms, how long target color is clickable

// Game 9: Memory Match variables
const MEMORY_MATCH_GAME_ID = 'memory-match';
const matchGrid = { rows: 3, cols: 4 };
const cardSize = 80;
const cardPadding = 15;
let matchCards = [];
let flippedCards = [];
let awaitingSecondClick = false;
let matchedPairs = 0;
const MATCH_CARD_BACK_COLOR = '#457b9d';
const MATCH_CARD_MATCHED_COLOR = '#2a9d8f';

// Game 10: Maze Runner
const MAZE_RUNNER_GAME_ID = 'maze-runner';
const mazePlayer = { x: 0, y: 0, size: 15, speed: 3 };
const mazeExit = { x: 0, y: 0, size: 20 };
const mazeWallThickness = 10;
let mazeWalls = [];
let mazeKeysPressed = {};
let mazeTouchStartX = 0;
let mazeTouchStartY = 0;

// --- Utility Functions ---
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    gameModal.style.display = 'flex';
}

function hideModal() {
    gameModal.style.display = 'none';
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function stopGameLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (noiseInterval) clearInterval(noiseInterval);
    if (starSpawnInterval) clearInterval(starSpawnInterval);
    if (laserSpawnInterval) clearInterval(laserSpawnInterval);
    if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout);
    if (targetSpawnTimeout) clearTimeout(targetSpawnTimeout);
    if (colorChangeIntervalId) clearInterval(colorChangeIntervalId);
    if (matchGameTimeout) clearTimeout(matchGameTimeout);
    if (mazeGameTimeout) clearTimeout(mazeGameTimeout);

    gameActive = false;
    // gamePaused remains as is, could be true if stopped while paused
    startGameButton.disabled = false;
    startGameButton.textContent = 'Start Game';
    gameSelector.disabled = false;
    pauseGameButton.style.display = 'none';
    // pauseGameButton.textContent = 'Pause'; // Reset in case it was 'Resume'
}

function endGame(win, message) {
    const finalGamePausedState = gamePaused; // Store if game ended while paused
    stopGameLoop();
    gamePaused = finalGamePausedState; // Restore paused state for modal logic
    cleanupAllListeners(); // Important to call after stopGameLoop

    if (win) {
        gameMessage.textContent = 'You Win!';
        gameMessage.style.color = '#2a9d8f';
        showModal('Victory!', message || 'You successfully completed the challenge!');
    } else {
        gameMessage.textContent = 'Game Over!';
        gameMessage.style.color = '#e63946';
        showModal('Game Over!', message || 'You failed the challenge!');
    }
    gameTimer.textContent = 'Time: 0.00';
}

function togglePause() {
    if (!gameActive) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseGameButton.textContent = 'Resume';
        // Record the time when pause starts to correctly calculate total gamePauseTime later
        // This is implicitly handled by how gamePauseTime is used in gameLoop with performance.now()
        // Effectively, gamePauseTime accumulates the duration of this pause when resuming.
        cancelAnimationFrame(animationFrameId); // Stop the game loop
        gameInstructions.textContent = "Game Paused. Click 'Resume' to continue.";
        gameMessage.textContent = ""; // Clear active game messages
    } else {
        pauseGameButton.textContent = 'Pause';
        // Add the duration of the just-ended pause to the total gamePauseTime
        // This is implicitly handled by gameStartTime and performance.now() in gameLoop.
        // The key is to correctly set lastFrameTime to avoid a jump.
        lastFrameTime = performance.now(); // Reset lastFrameTime to prevent large deltaTime jump
        animationFrameId = requestAnimationFrame(gameLoop);
        restoreGameInstructions();
    }
}

function restoreGameInstructions() {
    const game = games.find(g => g.id === currentMicrogame);
    let instructionText = game ? `Playing: ${game.name}` : "No game selected.";

    switch (currentMicrogame) {
        case CAT_ASLEEP_GAME_ID: instructionText = "Keep the cat asleep! Click the noises."; break;
        case UFO_GAME_ID: instructionText = "Don't let the UFO abduct you! Move with arrows/drag."; break;
        case CATCH_STARS_GAME_ID: instructionText = "Catch the falling stars! Click/tap them."; break;
        case AVOID_LASERS_GAME_ID: instructionText = "Avoid the lasers! Move to dodge beams."; break;
        case REMEMBER_SEQUENCE_GAME_ID:
            instructionText = displayPhase ? "Watch the sequence..." : "Your turn! Repeat the sequence.";
            if (!displayPhase && sequenceGameTimeout) clearTimeout(sequenceGameTimeout); // Clear if resuming to player turn
            if (displayPhase) startSequenceDisplay(); // Re-trigger display if paused mid-display
            break;
        case CLICK_TARGET_GAME_ID: instructionText = "Click the target before it vanishes!"; break;
        case BALANCE_BALL_GAME_ID: instructionText = "Balance the ball! Move platform with arrows/drag."; break;
        case QUICK_REFLEXES_GAME_ID: instructionText = "Click the button when it turns GREEN!"; break;
        case MEMORY_MATCH_GAME_ID: instructionText = "Find all the matching pairs!"; break;
        case MAZE_RUNNER_GAME_ID: instructionText = "Navigate the maze to the exit! Arrows/drag."; break;
    }
    gameInstructions.textContent = instructionText;
}


// --- Game 1: Keep the Cat Asleep ---
function initCatAsleepGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    noises = [];
    cat.x = canvas.width / 2;
    cat.y = canvas.height / 2 + 30;
    if (noiseInterval) clearInterval(noiseInterval); // Clear existing before starting new
    noiseInterval = setInterval(() => {
        if (!gamePaused && gameActive) {
            noises.push({
                x: Math.random() * canvas.width,
                y: 0,
                radius: 10 + Math.random() * 10,
                speed: 1 + Math.random() * 2,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }, 800 + Math.random() * 700);
    canvas.addEventListener('click', handleCatAsleepClick);
    canvas.addEventListener('touchstart', handleCatAsleepClick, { passive: false });
}
function drawCat() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#457b9d';
    ctx.beginPath();
    ctx.arc(cat.x, cat.y, cat.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath(); // Left ear
    ctx.moveTo(cat.x - cat.radius * 0.7, cat.y - cat.radius * 0.8);
    ctx.lineTo(cat.x - cat.radius * 0.3, cat.y - cat.radius * 1.5);
    ctx.lineTo(cat.x, cat.y - cat.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath(); // Right ear
    ctx.moveTo(cat.x + cat.radius * 0.7, cat.y - cat.radius * 0.8);
    ctx.lineTo(cat.x + cat.radius * 0.3, cat.y - cat.radius * 1.5);
    ctx.lineTo(cat.x, cat.y - cat.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#2d3a4b'; // Eyes (closed)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cat.x - cat.radius * 0.3, cat.y - cat.radius * 0.2, 5, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cat.x + cat.radius * 0.3, cat.y - cat.radius * 0.2, 5, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();
}
function drawNoises() { /* ... (drawing logic as before) ... */
    for (let i = noises.length - 1; i >= 0; i--) {
        const noise = noises[i];
        noise.y += noise.speed;

        ctx.fillStyle = noise.color;
        ctx.beginPath();
        ctx.arc(noise.x, noise.y, noise.radius, 0, Math.PI * 2);
        ctx.fill();

        const dist = Math.sqrt(Math.pow(noise.x - cat.x, 2) + Math.pow(noise.y - cat.y, 2));
        if (dist < noise.radius + cat.radius) {
            endGame(false, 'A noise woke the cat!');
            return;
        }
        if (noise.y > canvas.height + noise.radius) {
            noises.splice(i, 1);
        }
    }
}
function handleCatAsleepClick(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }
    for (let i = noises.length - 1; i >= 0; i--) {
        const noise = noises[i];
        const dist = Math.sqrt(Math.pow(clickX - noise.x, 2) + Math.pow(clickY - noise.y, 2));
        if (dist < noise.radius) {
            noises.splice(i, 1);
            break;
        }
    }
}
function cleanupCatAsleepListeners() {
    canvas.removeEventListener('click', handleCatAsleepClick);
    canvas.removeEventListener('touchstart', handleCatAsleepClick);
    if (noiseInterval) clearInterval(noiseInterval);
    noiseInterval = null;
}

// --- Game 2: Don't Let the UFO Abduct You ---
function initUfoGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 50;
    ufo.x = canvas.width / 2;
    ufo.targetX = canvas.width / 2;
    ufoBeamActive = false;
    ufoBeamDuration = 0;
    keysPressed = {};
    document.addEventListener('keydown', handleKeyDownUFO);
    document.addEventListener('keyup', handleKeyUpUFO);
    canvas.addEventListener('touchstart', handleTouchStartUFO, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMoveUFO, { passive: false });
    canvas.addEventListener('touchend', handleTouchEndUFO);
}
function drawPlayer() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#2a9d8f'; // Player color
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Simple "head"
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y - 10, 10, 0, Math.PI * 2);
    ctx.fill();
}
function drawUFO() { /* ... (drawing logic as before) ... */
    // UFO body
    ctx.fillStyle = '#a8dadc'; // Light blue/grey
    ctx.beginPath();
    ctx.ellipse(ufo.x, ufo.y, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // UFO cockpit
    ctx.fillStyle = '#457b9d'; // Darker blue
    ctx.beginPath();
    ctx.arc(ufo.x, ufo.y - ufo.height / 4, ufo.width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Abduction beam
    if (ufoBeamActive) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.4)'; // Semi-transparent yellow
        ctx.beginPath();
        ctx.moveTo(ufo.x - ufo.width * 0.3, ufo.y + ufo.height / 2); // Top-left of beam
        ctx.lineTo(ufo.x - ufo.width * 0.6, player.y + player.height);    // Bottom-left of beam, wider at player
        ctx.lineTo(ufo.x + ufo.width * 0.6, player.y + player.height);    // Bottom-right
        ctx.lineTo(ufo.x + ufo.width * 0.3, ufo.y + ufo.height / 2); // Top-right
        ctx.closePath();
        ctx.fill();
    }
}
function updateUFOAndPlayer() { /* ... (update logic as before) ... */
    // UFO movement
    if (ufo.x < ufo.targetX) ufo.x += ufo.speed;
    else if (ufo.x > ufo.targetX) ufo.x -= ufo.speed;

    if (Math.abs(ufo.x - ufo.targetX) < ufo.speed) { // Reached target, pick new one
        ufo.targetX = Math.random() * (canvas.width - ufo.width) + ufo.width / 2;
    }
    // Player movement
    if (keysPressed['ArrowLeft'] || keysPressed['a']) player.x -= player.speed;
    if (keysPressed['ArrowRight'] || keysPressed['d']) player.x += player.speed;
    // Boundary checks for player
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    // Abduction check
    const beamCenterX = ufo.x;
    const beamEffectiveWidthAtPlayer = ufo.width * 0.8; // Make beam a bit wider for gameplay
    const playerIsUnderBeam = Math.abs(player.x + player.width / 2 - beamCenterX) < beamEffectiveWidthAtPlayer / 2;

    if (playerIsUnderBeam && player.y > ufo.y + ufo.height) { // Player is under and close enough vertically
        ufoBeamActive = true;
        ufoBeamDuration += (1000 / 60); // Approximate deltaTime
        if (ufoBeamDuration >= MAX_BEAM_DURATION) {
            endGame(false, 'You were abducted by the UFO!');
        }
    } else {
        ufoBeamActive = false;
        ufoBeamDuration = Math.max(0, ufoBeamDuration - 50); // Beam power decreases if not on target
    }
}
function handleKeyDownUFO(event) { if (!gamePaused) keysPressed[event.key] = true; }
function handleKeyUpUFO(event) { if (!gamePaused) keysPressed[event.key] = false; }
function handleTouchStartUFO(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    touchStartX = event.touches[0].clientX;
}
function handleTouchMoveUFO(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const touchCurrentX = event.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;
    player.x += deltaX * 0.6; // Sensitivity factor
    touchStartX = touchCurrentX;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x)); // Bounds check during move
}
function handleTouchEndUFO() { /* No specific action needed for this control scheme */ }
function cleanupUfoGameListeners() {
    document.removeEventListener('keydown', handleKeyDownUFO);
    document.removeEventListener('keyup', handleKeyUpUFO);
    canvas.removeEventListener('touchstart', handleTouchStartUFO);
    canvas.removeEventListener('touchmove', handleTouchMoveUFO);
    canvas.removeEventListener('touchend', handleTouchEndUFO);
}

// --- Game 3: Catch the Falling Stars ---
function initCatchStarsGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    stars = [];
    score = 0;
    if (starSpawnInterval) clearInterval(starSpawnInterval);
    starSpawnInterval = setInterval(() => {
        if (!gamePaused && gameActive) {
            stars.push({
                x: Math.random() * canvas.width,
                y: 0,
                radius: 10 + Math.random() * 10,
                speed: 1 + Math.random() * 2,
                color: `hsl(${Math.random() * 60 + 30}, 90%, 70%)` // Yellows and oranges
            });
        }
    }, 400 + Math.random() * 600);
    canvas.addEventListener('click', handleCatchStarsClick);
    canvas.addEventListener('touchstart', handleCatchStarsClick, { passive: false });
}
function drawStar(star) { /* ... (drawing logic as before) ... */
    ctx.fillStyle = star.color;
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = star.radius;
    const innerRadius = star.radius / 2;
    let rot = Math.PI / 2 * 3; // Start at the top point
    let x = star.x;
    let y = star.y;
    let step = Math.PI / spikes;

    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = star.x + Math.cos(rot) * outerRadius;
        y = star.y + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = star.x + Math.cos(rot) * innerRadius;
        y = star.y + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(star.x, star.y - outerRadius); // Close path to starting point
    ctx.closePath();
    ctx.fill();
}
function drawStars() { /* ... (drawing logic as before) ... */
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.y += star.speed;
        drawStar(star);
        if (star.y > canvas.height - star.radius / 2) { // Check ground collision
            endGame(false, `A star hit the ground! You caught ${score} stars.`);
            return;
        }
    }
    gameMessage.textContent = `Stars Caught: ${score}`;
}
function handleCatchStarsClick(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        // Simple bounding box for click, more accurate would be distance to center
        const dist = Math.sqrt(Math.pow(clickX - star.x, 2) + Math.pow(clickY - star.y, 2));
        if (dist < star.radius * 1.2) { // Increased click radius slightly for ease
            stars.splice(i, 1);
            score++;
            break; // Only catch one star per click
        }
    }
}
function cleanupCatchStarsListeners() {
    canvas.removeEventListener('click', handleCatchStarsClick);
    canvas.removeEventListener('touchstart', handleCatchStarsClick);
    if (starSpawnInterval) clearInterval(starSpawnInterval);
    starSpawnInterval = null;
}

// --- Game 4: Avoid the Lasers ---
function initAvoidLasersGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    lasers = [];
    laserPlayer.x = canvas.width / 2;
    laserPlayer.y = canvas.height / 2;
    laserKeysPressed = {};
    if (laserSpawnInterval) clearInterval(laserSpawnInterval);
    laserSpawnInterval = setInterval(() => {
        if (!gamePaused && gameActive) {
            const edge = Math.floor(Math.random() * 4); // 0:top, 1:right, 2:bottom, 3:left
            let startX, startY, endX, endY;
            switch (edge) {
                case 0: startX = Math.random() * canvas.width; startY = 0; endX = Math.random() * canvas.width; endY = canvas.height; break;
                case 1: startX = canvas.width; startY = Math.random() * canvas.height; endX = 0; endY = Math.random() * canvas.height; break;
                case 2: startX = Math.random() * canvas.width; startY = canvas.height; endX = Math.random() * canvas.width; endY = 0; break;
                case 3: startX = 0; startY = Math.random() * canvas.height; endX = canvas.width; endY = Math.random() * canvas.height; break;
            }
            lasers.push({
                startX, startY, endX, endY,
                width: 10 + Math.random() * 5, // Vary laser width slightly
                warningTime: LASER_WARNING_DURATION, // ms, will count down
                active: false // Becomes true after warningTime
            });
        }
    }, LASER_SPAWN_FREQUENCY);
    document.addEventListener('keydown', handleLaserKeyDown);
    document.addEventListener('keyup', handleLaserKeyUp);
    canvas.addEventListener('touchstart', handleLaserTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleLaserTouchMove, { passive: false });
}
function drawLaserPlayer() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#1d3557'; // Player color
    ctx.beginPath();
    ctx.arc(laserPlayer.x, laserPlayer.y, laserPlayer.radius, 0, Math.PI * 2);
    ctx.fill();
}
// MODIFIED drawLasers function
function drawLasers() {
    const frameDeltaTime = 1000 / 60; // Approximate time per frame in ms (assuming 60FPS)

    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];

        if (laser.warningTime > 0) { // Still in WARNING phase
            laser.warningTime -= frameDeltaTime;
            laser.active = false;
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)'; // Orange warning
            ctx.lineWidth = laser.width / 2;
            ctx.setLineDash([10, 5]); // Dashed line for warning
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        } else { // ACTIVE phase or EXPIRED
            if (!laser.active) { // First frame of being active
                laser.active = true;
                laser.activeTime = 0; // Initialize active timer
            }

            laser.activeTime += frameDeltaTime;

            if (laser.activeTime > LASER_ACTIVE_DURATION) {
                lasers.splice(i, 1); // Remove the laser after its active duration
                continue;
            }

            // Draw ACTIVE laser
            ctx.strokeStyle = '#e63946'; // Red active laser color
            ctx.lineWidth = laser.width;
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();

            // Collision detection for active laser
            const distToLine = distToSegment(laserPlayer, {x: laser.startX, y: laser.startY}, {x: laser.endX, y: laser.endY});
            if (distToLine < laserPlayer.radius + laser.width / 2) {
                endGame(false, 'Hit by a laser!');
                return;
            }
        }
    }
}
function distToSegment(p, v, w) { /* ... (helper function as before) ... */
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.sqrt((p.x - projX)**2 + (p.y - projY)**2);
}
function updateLaserPlayerPosition() { /* ... (update logic as before) ... */
    if (laserKeysPressed['ArrowLeft'] || laserKeysPressed['a']) laserPlayer.x -= laserPlayer.speed;
    if (laserKeysPressed['ArrowRight'] || laserKeysPressed['d']) laserPlayer.x += laserPlayer.speed;
    if (laserKeysPressed['ArrowUp'] || laserKeysPressed['w']) laserPlayer.y -= laserPlayer.speed;
    if (laserKeysPressed['ArrowDown'] || laserKeysPressed['s']) laserPlayer.y += laserPlayer.speed;
    // Boundary checks
    laserPlayer.x = Math.max(laserPlayer.radius, Math.min(canvas.width - laserPlayer.radius, laserPlayer.x));
    laserPlayer.y = Math.max(laserPlayer.radius, Math.min(canvas.height - laserPlayer.radius, laserPlayer.y));
}
function handleLaserKeyDown(event) { if (!gamePaused) laserKeysPressed[event.key] = true; }
function handleLaserKeyUp(event) { if (!gamePaused) laserKeysPressed[event.key] = false; }
function handleLaserTouchStart(event) { /* ... (event handling as before for direct position) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    laserPlayer.x = event.touches[0].clientX - rect.left;
    laserPlayer.y = event.touches[0].clientY - rect.top;
    // Keep within bounds immediately on touch
    laserPlayer.x = Math.max(laserPlayer.radius, Math.min(canvas.width - laserPlayer.radius, laserPlayer.x));
    laserPlayer.y = Math.max(laserPlayer.radius, Math.min(canvas.height - laserPlayer.radius, laserPlayer.y));
}
function handleLaserTouchMove(event) { /* ... (event handling as before for direct position) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    laserPlayer.x = event.touches[0].clientX - rect.left;
    laserPlayer.y = event.touches[0].clientY - rect.top;
    laserPlayer.x = Math.max(laserPlayer.radius, Math.min(canvas.width - laserPlayer.radius, laserPlayer.x));
    laserPlayer.y = Math.max(laserPlayer.radius, Math.min(canvas.height - laserPlayer.radius, laserPlayer.y));
}
function cleanupAvoidLasersListeners() {
    document.removeEventListener('keydown', handleLaserKeyDown);
    document.removeEventListener('keyup', handleLaserKeyUp);
    canvas.removeEventListener('touchstart', handleLaserTouchStart);
    canvas.removeEventListener('touchmove', handleLaserTouchMove);
    if (laserSpawnInterval) clearInterval(laserSpawnInterval);
    laserSpawnInterval = null;
}

// --- Game 5: Remember the Sequence ---
function initRememberSequenceGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    gameSequence = [];
    playerSequence = [];
    sequenceStep = 0;
    displayPhase = true;
    currentHighlightButton = -1;

    const buttonSize = sequenceButtons[0].size;
    const spacing = 20;
    const totalWidth = (buttonSize * 2) + spacing;
    const totalHeight = (buttonSize * 2) + spacing;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - totalHeight) / 2;

    sequenceButtons[0].x = startX; sequenceButtons[0].y = startY;
    sequenceButtons[1].x = startX + buttonSize + spacing; sequenceButtons[1].y = startY;
    sequenceButtons[2].x = startX; sequenceButtons[2].y = startY + buttonSize + spacing;
    sequenceButtons[3].x = startX + buttonSize + spacing; sequenceButtons[3].y = startY + buttonSize + spacing;

    addNewToSequence();
    startSequenceDisplay();
    canvas.addEventListener('click', handleSequenceClick);
    canvas.addEventListener('touchstart', handleSequenceClick, { passive: false });
}
function addNewToSequence() { gameSequence.push(Math.floor(Math.random() * sequenceButtons.length)); }
function startSequenceDisplay() {
    if (!gameActive) return; // Don't start if game isn't active (e.g. from togglePause)
    displayPhase = true;
    playerSequence = [];
    // sequenceStep is for player input, display uses its own index
    currentHighlightButton = -1;
    gameInstructions.textContent = "Watch the sequence...";
    let displayIndex = 0;

    function showNext() {
        if (!gameActive || gamePaused) { // Stop if game state changes
            if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout);
            return;
        }
        if (displayIndex < gameSequence.length) {
            currentHighlightButton = gameSequence[displayIndex];
            sequenceGameTimeout = setTimeout(() => {
                currentHighlightButton = -1;
                sequenceGameTimeout = setTimeout(() => {
                    displayIndex++;
                    showNext();
                }, PAUSE_DURATION);
            }, DISPLAY_DURATION);
        } else { // Sequence display finished
            displayPhase = false;
            currentHighlightButton = -1;
            sequenceStep = 0; // Reset for player's turn
            gameInstructions.textContent = "Your turn! Repeat the sequence.";
        }
    }
    if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout); // Clear any old one
    showNext();
}
function drawSequenceButtons() { /* ... (drawing logic as before) ... */
    sequenceButtons.forEach((button, index) => {
        let fillColor = button.color;
        if (displayPhase && index === currentHighlightButton) {
            fillColor = button.highlightColor;
        } else if (!displayPhase && currentHighlightButton === index) { // Briefly highlight player's correct tap
            fillColor = button.highlightColor;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(button.x, button.y, button.size, button.size);
        ctx.strokeStyle = '#fff'; // White border
        ctx.lineWidth = 2;
        ctx.strokeRect(button.x, button.y, button.size, button.size);
    });
}
function handleSequenceClick(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused || displayPhase) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }

    for (let i = 0; i < sequenceButtons.length; i++) {
        const button = sequenceButtons[i];
        if (clickX > button.x && clickX < button.x + button.size &&
            clickY > button.y && clickY < button.y + button.size) {

            playerSequence.push(i);
            currentHighlightButton = i; // Highlight the pressed button briefly

            if (playerSequence[sequenceStep] !== gameSequence[sequenceStep]) {
                endGame(false, `Wrong sequence! You remembered ${Math.max(0, sequenceStep)} step(s).`);
                return;
            }

            sequenceStep++;

            if (sequenceStep === gameSequence.length) { // Player completed the current sequence
                if (gameSequence.length >= 6) { // Win condition (e.g., 6 steps)
                    endGame(true, `Sequence remembered! You completed ${gameSequence.length} steps.`);
                } else {
                    addNewToSequence();
                    if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout);
                    sequenceGameTimeout = setTimeout(startSequenceDisplay, 700); // Pause before new sequence
                }
            } else {
                // Player continues current sequence, turn off highlight after a bit
                if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout);
                sequenceGameTimeout = setTimeout(() => { currentHighlightButton = -1; }, 150);
            }
            break; // Processed click
        }
    }
}
function cleanupRememberSequenceListeners() {
    canvas.removeEventListener('click', handleSequenceClick);
    canvas.removeEventListener('touchstart', handleSequenceClick);
    if (sequenceGameTimeout) clearTimeout(sequenceGameTimeout);
    sequenceGameTimeout = null;
}

// --- Game 6: Click the Target ---
function initClickTargetGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    targetScore = 0;
    spawnTarget(); // Initial target
    canvas.addEventListener('click', handleClickTarget);
    canvas.addEventListener('touchstart', handleClickTarget, { passive: false });
}
function spawnTarget() {
    if (!gameActive || gamePaused) return; // Don't spawn if game not running
    if (targetSpawnTimeout) clearTimeout(targetSpawnTimeout);

    target.hit = false;
    target.radius = TARGET_MIN_RADIUS + Math.random() * (TARGET_MAX_RADIUS - TARGET_MIN_RADIUS);
    target.x = target.radius + Math.random() * (canvas.width - 2 * target.radius);
    target.y = target.radius + Math.random() * (canvas.height - 2 * target.radius);
    target.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    target.spawnTime = performance.now();

    targetSpawnTimeout = setTimeout(() => {
        if (!target.hit && gameActive && !gamePaused) { // If target still exists and not hit
            // endGame(false, "Target disappeared!"); // Or just let it respawn
            spawnTarget(); // Spawn a new one
        }
    }, TARGET_LIFETIME);
}
function drawTarget() { /* ... (drawing logic as before) ... */
    if (!target.hit) {
        const timeSinceSpawn = performance.now() - target.spawnTime;
        let lifetimeProgress = timeSinceSpawn / TARGET_LIFETIME;
        lifetimeProgress = Math.min(1, lifetimeProgress); // Cap at 1

        // Target shrinks or fades over its lifetime
        const currentRadius = target.radius * (1 - lifetimeProgress * 0.7); // Shrinks more significantly
        // const currentAlpha = 1 - lifetimeProgress * 0.5; // Fades out

        if (currentRadius < TARGET_MIN_RADIUS / 3 && !target.hit) { // If shrunk too much, consider it missed
             // Already handled by timeout to respawn
            return;
        }

        // ctx.globalAlpha = currentAlpha; // Apply fade
        ctx.fillStyle = target.color;
        ctx.beginPath();
        ctx.arc(target.x, target.y, Math.max(5, currentRadius), 0, Math.PI * 2);
        ctx.fill();
        // ctx.globalAlpha = 1.0; // Reset alpha

        // Optional: inner rings for visual flair or different points
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(target.x, target.y, Math.max(5, currentRadius) * 0.66, 0, Math.PI * 2);
        ctx.stroke();
    }
}
function handleClickTarget(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused || target.hit) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }

    const dist = Math.sqrt(Math.pow(clickX - target.x, 2) + Math.pow(clickY - target.y, 2));
    const timeSinceSpawn = performance.now() - target.spawnTime;
    const currentRadius = target.radius * (1 - Math.min(1, timeSinceSpawn / TARGET_LIFETIME) * 0.7);


    if (dist < currentRadius) { // Check against current, possibly shrunk, radius
        target.hit = true;
        targetScore++;
        gameMessage.textContent = `Score: ${targetScore}`;

        if (targetScore >= 10) { // Win condition
            endGame(true, `Great shooting! You hit ${targetScore} targets.`);
        } else {
            if (targetSpawnTimeout) clearTimeout(targetSpawnTimeout); // Clear old timeout
            targetSpawnTimeout = setTimeout(spawnTarget, TARGET_SPAWN_INTERVAL / 2); // Spawn next target faster
        }
    }
}
function cleanupClickTargetListeners() {
    canvas.removeEventListener('click', handleClickTarget);
    canvas.removeEventListener('touchstart', handleClickTarget);
    if (targetSpawnTimeout) clearTimeout(targetSpawnTimeout);
    targetSpawnTimeout = null;
}

// --- Game 7: Balance the Ball ---
function initBalanceBallGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    platform.x = canvas.width / 2 - platform.width / 2;
    platform.y = canvas.height - 40; // A bit higher
    ball.x = canvas.width / 2;
    ball.y = platform.y - ball.radius - 60; // Start well above platform
    ball.dx = (Math.random() - 0.5) * ball.speed * 0.5;
    ball.dy = -ball.speed * 0.7; // Initial upward pop
    ballKeysPressed = {};
    document.addEventListener('keydown', handleBallKeyDown);
    document.addEventListener('keyup', handleBallKeyUp);
    canvas.addEventListener('touchstart', handleBallTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleBallTouchMove, { passive: false });
}
function drawPlatform() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#457b9d'; // Platform color
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    // Add a small highlight to the platform
    ctx.fillStyle = '#a8dadc';
    ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
}
function drawBall() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#e63946'; // Ball color
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    // Add a small shine to the ball
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}
function updateBallAndPlatform() { /* ... (update logic as before) ... */
    // Platform movement
    if (ballKeysPressed['ArrowLeft'] || ballKeysPressed['a']) platform.x -= platform.speed;
    if (ballKeysPressed['ArrowRight'] || ballKeysPressed['d']) platform.x += platform.speed;
    platform.x = Math.max(0, Math.min(canvas.width - platform.width, platform.x)); // Boundary check

    // Ball movement with simple gravity
    ball.dy += 0.15; // Gravity effect
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions (sides and top)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx *= -0.9; // Dampen horizontal bounce slightly
        ball.x = (ball.x - ball.radius < 0) ? ball.radius : (canvas.width - ball.radius);
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -0.8; // Dampen bounce off top
        ball.y = ball.radius;
    }

    // Platform collision
    if (ball.y + ball.radius >= platform.y && // Ball's bottom edge is at or below platform top
        ball.y - ball.radius <= platform.y + platform.height && // Ball's top edge is not fully through platform
        ball.x + ball.radius >= platform.x && // Ball is horizontally within platform's left edge
        ball.x - ball.radius <= platform.x + platform.width && // Ball is horizontally within platform's right edge
        ball.dy > 0) { // Ball is moving downwards

        ball.y = platform.y - ball.radius; // Correct position to be on top of platform
        ball.dy *= -0.85; // Bounce with some energy loss
        if (Math.abs(ball.dy) < 1) ball.dy = -1; // Ensure minimum bounce if too slow

        // Influence horizontal speed based on where it hit the platform
        let hitPosRatio = (ball.x - (platform.x + platform.width / 2)) / (platform.width / 2); // -1 (left) to 1 (right)
        ball.dx += hitPosRatio * 1.5; // Add some horizontal impulse
        ball.dx = Math.max(-ball.speed * 1.2, Math.min(ball.speed * 1.2, ball.dx)); // Clamp dx
    } else if (ball.y - ball.radius > canvas.height) { // Ball fell off bottom
        endGame(false, "The ball fell off the platform!");
    }
}
function handleBallKeyDown(event) { if (!gamePaused) ballKeysPressed[event.key] = true; }
function handleBallKeyUp(event) { if (!gamePaused) ballKeysPressed[event.key] = false; }
function handleBallTouchStart(event) { /* ... (event handling as before for direct platform position) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    // Move platform center to touch X
    platform.x = event.touches[0].clientX - rect.left - platform.width / 2;
    platform.x = Math.max(0, Math.min(canvas.width - platform.width, platform.x));
}
function handleBallTouchMove(event) { /* ... (event handling as before for direct platform position) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    platform.x = event.touches[0].clientX - rect.left - platform.width / 2;
    platform.x = Math.max(0, Math.min(canvas.width - platform.width, platform.x));
}
function cleanupBalanceBallListeners() {
    document.removeEventListener('keydown', handleBallKeyDown);
    document.removeEventListener('keyup', handleBallKeyUp);
    canvas.removeEventListener('touchstart', handleBallTouchStart);
    canvas.removeEventListener('touchmove', handleBallTouchMove);
}

// --- Game 8: Quick Reflexes ---
function initQuickReflexesGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    reflexScore = 0;
    reflexButton.x = canvas.width / 2 - reflexButton.size / 2;
    reflexButton.y = canvas.height / 2 - reflexButton.size / 2;
    reflexButton.color = 'grey';
    reflexButton.isTarget = false;
    reflexButton.canClick = false;
    if (colorChangeIntervalId) clearTimeout(colorChangeIntervalId);
    changeReflexColor(); // Start the cycle
    canvas.addEventListener('click', handleReflexClick);
    canvas.addEventListener('touchstart', handleReflexClick, { passive: false });
}
function changeReflexColor() {
    if (!gameActive || gamePaused) return; // Stop if game isn't running
    if (colorChangeIntervalId) clearTimeout(colorChangeIntervalId);

    const isTargetColor = Math.random() < 0.3; // 30% chance to be the target color
    if (isTargetColor) {
        reflexButton.color = REFLEX_TARGET_COLOR;
        reflexButton.isTarget = true;
        reflexButton.canClick = true;
        // Timeout for how long the target color stays and is clickable
        colorChangeIntervalId = setTimeout(() => {
            if (reflexButton.isTarget && gameActive && !gamePaused) { // If it was target and not clicked in time
                // endGame(false, "Too slow!"); // Optional: Penalize for being too slow
                reflexButton.isTarget = false;
                reflexButton.canClick = false;
                changeReflexColor(); // Change to a new color
            }
        }, COLOR_CHANGE_RATE + REFLEX_CLICK_WINDOW + Math.random() * 200); // Slightly variable window
    } else {
        let newColor;
        do { newColor = REFLEX_COLORS[Math.floor(Math.random() * REFLEX_COLORS.length)]; }
        while (newColor === REFLEX_TARGET_COLOR); // Ensure it's not green if not target
        reflexButton.color = newColor;
        reflexButton.isTarget = false;
        reflexButton.canClick = false; // Cannot click non-target colors
        colorChangeIntervalId = setTimeout(changeReflexColor, COLOR_CHANGE_RATE + Math.random() * 400); // Vary timing
    }
}
function drawReflexButton() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = reflexButton.color;
    ctx.fillRect(reflexButton.x, reflexButton.y, reflexButton.size, reflexButton.size);
    ctx.strokeStyle = '#fff'; // White border
    ctx.lineWidth = 3;
    ctx.strokeRect(reflexButton.x, reflexButton.y, reflexButton.size, reflexButton.size);
    gameMessage.textContent = `Score: ${reflexScore}`;
}
function handleReflexClick(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }

    if (clickX > reflexButton.x && clickX < reflexButton.x + reflexButton.size &&
        clickY > reflexButton.y && clickY < reflexButton.y + reflexButton.size) {

        if (reflexButton.isTarget && reflexButton.canClick) {
            reflexScore++;
            // gameMessage.textContent = `Score: ${reflexScore}`; // Updated in drawReflexButton
            reflexButton.isTarget = false; // Prevent multiple scores for one green
            reflexButton.canClick = false;
            if (reflexScore >= 5) { // Win condition
                endGame(true, `Great reflexes! Score: ${reflexScore}`);
            } else {
                if (colorChangeIntervalId) clearTimeout(colorChangeIntervalId);
                changeReflexColor(); // Immediately change color after correct click
            }
        } else if (!reflexButton.isTarget) { // Clicked on non-target color
            endGame(false, "Clicked on the wrong color!");
        }
        // If canClick is false but was target, it means they were too slow (handled by timeout in changeReflexColor)
    }
}
function cleanupQuickReflexesListeners() {
    canvas.removeEventListener('click', handleReflexClick);
    canvas.removeEventListener('touchstart', handleReflexClick);
    if (colorChangeIntervalId) clearTimeout(colorChangeIntervalId);
    colorChangeIntervalId = null;
}

// --- Game 9: Memory Match ---
function initMemoryMatchGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    matchCards = [];
    flippedCards = [];
    awaitingSecondClick = false;
    matchedPairs = 0;

    const symbolsBase = ['🍎', '🍌', '🍒', '🍇', '🍓', '🥝', '🍍', '🍉', '🍊', '🍋', '🍑', '🥭'];
    const numPairs = (matchGrid.rows * matchGrid.cols) / 2;
    let symbolsForGame = symbolsBase.slice(0, numPairs);
    let cardSymbols = [...symbolsForGame, ...symbolsForGame];
    shuffleArray(cardSymbols);

    const totalGridWidth = matchGrid.cols * cardSize + (matchGrid.cols - 1) * cardPadding;
    const totalGridHeight = matchGrid.rows * cardSize + (matchGrid.rows - 1) * cardPadding;
    const startX = (canvas.width - totalGridWidth) / 2;
    const startY = (canvas.height - totalGridHeight) / 2;

    for (let r = 0; r < matchGrid.rows; r++) {
        for (let c = 0; c < matchGrid.cols; c++) {
            matchCards.push({
                x: startX + c * (cardSize + cardPadding),
                y: startY + r * (cardSize + cardPadding),
                size: cardSize,
                symbol: cardSymbols.pop(),
                isFlipped: false,
                isMatched: false,
                id: r * matchGrid.cols + c // Unique ID
            });
        }
    }
    if (matchGameTimeout) clearTimeout(matchGameTimeout);
    canvas.addEventListener('click', handleMemoryMatchClick);
    canvas.addEventListener('touchstart', handleMemoryMatchClick, { passive: false });
}
function drawMemoryMatchCards() { /* ... (drawing logic as before) ... */
    matchCards.forEach(card => {
        ctx.fillStyle = card.isMatched ? MATCH_CARD_MATCHED_COLOR : (card.isFlipped ? '#f1faee' : MATCH_CARD_BACK_COLOR);
        ctx.fillRect(card.x, card.y, card.size, card.size);
        ctx.strokeStyle = '#1d3557'; // Dark border
        ctx.lineWidth = 2;
        ctx.strokeRect(card.x, card.y, card.size, card.size);

        if (card.isFlipped || card.isMatched) {
            ctx.fillStyle = card.isMatched ? '#fff' : '#1d3557'; // Text color
            ctx.font = `${card.size * 0.55}px Arial`; // Slightly larger font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(card.symbol, card.x + card.size / 2, card.y + card.size / 2 + 2); // Adjust for vertical centering
        }
    });
}
function handleMemoryMatchClick(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused || awaitingSecondClick) return;
    event.preventDefault();
    let clickX, clickY;
    const rect = canvas.getBoundingClientRect();
    if (event.type === 'touchstart') {
        clickX = event.touches[0].clientX - rect.left;
        clickY = event.touches[0].clientY - rect.top;
    } else {
        clickX = event.clientX - rect.left;
        clickY = event.clientY - rect.top;
    }

    for (const card of matchCards) {
        if (!card.isFlipped && !card.isMatched && // Can only click unflipped, unmatched cards
            clickX > card.x && clickX < card.x + card.size &&
            clickY > card.y && clickY < card.y + card.size) {

            card.isFlipped = true;
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                awaitingSecondClick = true; // Prevent more clicks until check is done
                if (flippedCards[0].symbol === flippedCards[1].symbol && flippedCards[0].id !== flippedCards[1].id) {
                    // Match found
                    flippedCards[0].isMatched = true;
                    flippedCards[1].isMatched = true;
                    matchedPairs++;
                    gameMessage.textContent = `Pairs found: ${matchedPairs}`;
                    flippedCards = []; // Clear for next pair
                    awaitingSecondClick = false;
                    if (matchedPairs === (matchGrid.rows * matchGrid.cols) / 2) {
                        endGame(true, `All pairs matched! Well done!`);
                    }
                } else {
                    // No match, or clicked same card twice (though id check should prevent this)
                    if (matchGameTimeout) clearTimeout(matchGameTimeout);
                    matchGameTimeout = setTimeout(() => {
                        if (gameActive && !gamePaused) { // Check game state before flipping back
                           if(flippedCards[0]) flippedCards[0].isFlipped = false;
                           if(flippedCards[1]) flippedCards[1].isFlipped = false;
                        }
                        flippedCards = [];
                        awaitingSecondClick = false;
                    }, 900); // Slightly shorter delay
                }
            }
            break; // Process only one card click at a time
        }
    }
}
function cleanupMemoryMatchListeners() {
    canvas.removeEventListener('click', handleMemoryMatchClick);
    canvas.removeEventListener('touchstart', handleMemoryMatchClick);
    if (matchGameTimeout) clearTimeout(matchGameTimeout);
    matchGameTimeout = null;
}

// --- Game 10: Maze Runner ---
function initMazeRunnerGame() {
    restoreGameInstructions();
    gameMessage.textContent = "";
    // Calculate cell size based on canvas and desired number of columns/rows
    const numCols = 8; // Example: 8 columns
    const numRows = 5; // Example: 5 rows
    const cellWidth = (canvas.width - mazeWallThickness * (numCols + 1)) / numCols;
    const cellHeight = (canvas.height - mazeWallThickness * (numRows + 1)) / numRows;

    mazePlayer.x = mazeWallThickness + cellWidth / 2; // Start in first cell
    mazePlayer.y = mazeWallThickness + cellHeight / 2;
    mazeExit.x = canvas.width - mazeWallThickness - cellWidth / 2; // Exit in last cell
    mazeExit.y = canvas.height - mazeWallThickness - cellHeight / 2;

    mazeWalls = generateSimpleMaze(canvas.width, canvas.height, mazeWallThickness, numCols, numRows);
    mazeKeysPressed = {};
    document.addEventListener('keydown', handleMazeKeyDown);
    document.addEventListener('keyup', handleMazeKeyUp);
    canvas.addEventListener('touchstart', handleMazeTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleMazeTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleMazeTouchEnd);
}
function generateSimpleMaze(Cwidth, Cheight, wallThick, numCols, numRows) { /* ... (maze generation as before, or improved) ... */
    const walls = [];
    const cellWidth = (Cwidth - wallThick * (numCols + 1)) / numCols;
    const cellHeight = (Cheight - wallThick * (numRows + 1)) / numRows;

    // Outer walls
    walls.push({ x: 0, y: 0, width: Cwidth, height: wallThick }); // Top
    walls.push({ x: 0, y: Cheight - wallThick, width: Cwidth, height: wallThick }); // Bottom
    walls.push({ x: 0, y: 0, width: wallThick, height: Cheight }); // Left
    walls.push({ x: Cwidth - wallThick, y: 0, width: wallThick, height: Cheight }); // Right

    // Example fixed internal walls for a simple path
    // This needs a proper maze generation algorithm for a real maze.
    // Horizontal walls
    for (let r = 1; r < numRows; r++) {
        for (let c = 0; c < numCols -1; c++) { // Avoid walling off last column entirely for exit
            if (Math.random() > 0.6) { // More open maze
                 walls.push({
                    x: wallThick + c * (cellWidth + wallThick),
                    y: r * (cellHeight + wallThick),
                    width: cellWidth + wallThick,
                    height: wallThick
                });
            }
        }
    }
    // Vertical walls
     for (let c = 1; c < numCols; c++) {
        for (let r = 0; r < numRows -1 ; r++) { // Avoid walling off last row entirely
            if (Math.random() > 0.6) {
                walls.push({
                    x: c * (cellWidth + wallThick),
                    y: wallThick + r * (cellHeight + wallThick),
                    width: wallThick,
                    height: cellHeight + wallThick
                });
            }
        }
    }
    // Ensure start and end cells are not completely blocked by random walls
    // (More robust maze generation would handle this inherently)
    return walls;
}
function drawMazePlayer() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#2a9d8f'; // Player color
    ctx.beginPath();
    ctx.arc(mazePlayer.x, mazePlayer.y, mazePlayer.size / 2, 0, Math.PI * 2);
    ctx.fill();
}
function drawMazeExit() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#e63946'; // Exit color (red)
    ctx.fillRect(mazeExit.x - mazeExit.size / 2, mazeExit.y - mazeExit.size / 2, mazeExit.size, mazeExit.size);
    // Add a small "E" to exit for clarity
    ctx.fillStyle = '#fff';
    ctx.font = `${mazeExit.size * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("E", mazeExit.x, mazeExit.y + 1);
}
function drawMazeWalls() { /* ... (drawing logic as before) ... */
    ctx.fillStyle = '#1d3557'; // Wall color
    mazeWalls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
}
function updateMazeRunner() { /* ... (update logic with improved collision as before) ... */
    let prevX = mazePlayer.x;
    let prevY = mazePlayer.y;

    if (mazeKeysPressed['ArrowLeft'] || mazeKeysPressed['a']) mazePlayer.x -= mazePlayer.speed;
    if (mazeKeysPressed['ArrowRight'] || mazeKeysPressed['d']) mazePlayer.x += mazePlayer.speed;
    if (mazeKeysPressed['ArrowUp'] || mazeKeysPressed['w']) mazePlayer.y -= mazePlayer.speed;
    if (mazeKeysPressed['ArrowDown'] || mazeKeysPressed['s']) mazePlayer.y += mazePlayer.speed;

    // Collision with walls (refined)
    const playerHalfSize = mazePlayer.size / 2;
    for (const wall of mazeWalls) {
        // Check potential X collision
        if (mazePlayer.x + playerHalfSize > wall.x &&
            mazePlayer.x - playerHalfSize < wall.x + wall.width &&
            prevY + playerHalfSize > wall.y && // Use prevY for X-collision check
            prevY - playerHalfSize < wall.y + wall.height) {
            mazePlayer.x = prevX; // Revert X move
        }
        // Check potential Y collision (with current X, potentially reverted)
        if (mazePlayer.x + playerHalfSize > wall.x &&
            mazePlayer.x - playerHalfSize < wall.x + wall.width &&
            mazePlayer.y + playerHalfSize > wall.y &&
            mazePlayer.y - playerHalfSize < wall.y + wall.height) {
            mazePlayer.y = prevY; // Revert Y move
        }
    }
    // Keep player within canvas bounds (important if maze doesn't perfectly fill)
    mazePlayer.x = Math.max(playerHalfSize, Math.min(canvas.width - playerHalfSize, mazePlayer.x));
    mazePlayer.y = Math.max(playerHalfSize, Math.min(canvas.height - playerHalfSize, mazePlayer.y));

    // Check for reaching the exit
    const distToExit = Math.sqrt(Math.pow(mazePlayer.x - mazeExit.x, 2) + Math.pow(mazePlayer.y - mazeExit.y, 2));
    if (distToExit < playerHalfSize + mazeExit.size / 2) {
        endGame(true, "You escaped the maze!");
    }
}
function handleMazeKeyDown(event) { if (!gamePaused) mazeKeysPressed[event.key] = true; }
function handleMazeKeyUp(event) { if (!gamePaused) mazeKeysPressed[event.key] = false; }
function handleMazeTouchStart(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mazeTouchStartX = event.touches[0].clientX - rect.left;
    mazeTouchStartY = event.touches[0].clientY - rect.top;
    // No immediate movement, wait for move
}
function handleMazeTouchMove(event) { /* ... (event handling as before) ... */
    if (!gameActive || gamePaused) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchCurrentX = event.touches[0].clientX - rect.left;
    const touchCurrentY = event.touches[0].clientY - rect.top;

    const deltaX = touchCurrentX - mazeTouchStartX;
    const deltaY = touchCurrentY - mazeTouchStartY;
    const deadZone = mazePlayer.size / 2; // Minimum movement to register as intent

    // Reset all arrow key states before determining new direction
    mazeKeysPressed['ArrowLeft'] = false; mazeKeysPressed['ArrowRight'] = false;
    mazeKeysPressed['ArrowUp'] = false; mazeKeysPressed['ArrowDown'] = false;

    if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal movement is dominant
        if (deltaX > deadZone) mazeKeysPressed['ArrowRight'] = true;
        else if (deltaX < -deadZone) mazeKeysPressed['ArrowLeft'] = true;
    } else { // Vertical movement is dominant (or equal)
        if (deltaY > deadZone) mazeKeysPressed['ArrowDown'] = true;
        else if (deltaY < -deadZone) mazeKeysPressed['ArrowUp'] = true;
    }
    // Don't update mazeTouchStart/Y here for continuous drag from initial point.
    // This makes it behave like a virtual joystick centered at the initial touch.
}
function handleMazeTouchEnd(event) {
    // Clear all movement keys on touch end to stop player
    mazeKeysPressed['ArrowLeft'] = false; mazeKeysPressed['ArrowRight'] = false;
    mazeKeysPressed['ArrowUp'] = false; mazeKeysPressed['ArrowDown'] = false;
}
function cleanupMazeRunnerListeners() {
    document.removeEventListener('keydown', handleMazeKeyDown);
    document.removeEventListener('keyup', handleMazeKeyUp);
    canvas.removeEventListener('touchstart', handleMazeTouchStart);
    canvas.removeEventListener('touchmove', handleMazeTouchMove);
    canvas.removeEventListener('touchend', handleMazeTouchEnd);
    // if (mazeGameTimeout) clearTimeout(mazeGameTimeout); // If any specific maze timeouts
}

// --- General Game Logic ---
function populateGameSelector() {
    games.forEach(game => {
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = game.name;
        gameSelector.appendChild(option);
    });
    if (games.length > 0) {
      currentMicrogame = games[0].id; // Default to first game
      gameSelector.value = currentMicrogame;
    }
}

function initSelectedGame() {
    cleanupAllListeners(); // Clean up listeners from any previous game
    clearCanvas();

    // Reset common game state variables that might persist visually or functionally
    noises = []; stars = []; lasers = []; gameSequence = []; playerSequence = [];
    flippedCards = []; matchCards = []; mazeWalls = [];
    score = 0; targetScore = 0; reflexScore = 0; matchedPairs = 0;
    if (target) target.hit = false; // Reset specific target state

    // Call the init function for the currently selected game
    switch (currentMicrogame) {
        case CAT_ASLEEP_GAME_ID: initCatAsleepGame(); break;
        case UFO_GAME_ID: initUfoGame(); break;
        case CATCH_STARS_GAME_ID: initCatchStarsGame(); break;
        case AVOID_LASERS_GAME_ID: initAvoidLasersGame(); break;
        case REMEMBER_SEQUENCE_GAME_ID: initRememberSequenceGame(); break;
        case CLICK_TARGET_GAME_ID: initClickTargetGame(); break;
        case BALANCE_BALL_GAME_ID: initBalanceBallGame(); break;
        case QUICK_REFLEXES_GAME_ID: initQuickReflexesGame(); break;
        case MEMORY_MATCH_GAME_ID: initMemoryMatchGame(); break;
        case MAZE_RUNNER_GAME_ID: initMazeRunnerGame(); break;
        default:
            console.error("Unknown game selected for init:", currentMicrogame);
            gameInstructions.textContent = "Error: Unknown game selected.";
            return;
    }
    gameTimer.textContent = `Time: ${(gameDuration / 1000).toFixed(2)}`;
    gameMessage.textContent = ""; // Clear previous game messages
    restoreGameInstructions(); // Set instructions for the new game
}

function gameLoop(timestamp) {
    if (!gameActive) return; // If game has been stopped (e.g., by endGame), don't continue

    if (gamePaused) {
        // If paused, we still need to request the next frame to keep the pause screen responsive
        // or to allow unpausing. However, game logic and drawing for the game itself should not run.
        // The lastFrameTime should be updated when resuming to avoid a large deltaTime jump.
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = timestamp - lastFrameTime; // Milliseconds since last frame
    lastFrameTime = timestamp;

    // Update total elapsed active time
    // gamePauseTime accumulates total paused duration.
    // gameStartTime is the initial start time.
    // performance.now() is current time.
    // Effective active time = current time - initial start time - total paused time.
    const elapsedTime = performance.now() - gameStartTime - gamePauseTime;
    const timeRemaining = gameDuration - elapsedTime;
    gameTimer.textContent = `Time: ${(Math.max(0, timeRemaining) / 1000).toFixed(2)}`;

    if (timeRemaining <= 0) {
        let win = false;
        let endMsg = "Time's up!";
        // Determine win/loss based on game state at timeout
        switch (currentMicrogame) {
            case CAT_ASLEEP_GAME_ID: case UFO_GAME_ID: case AVOID_LASERS_GAME_ID: case BALANCE_BALL_GAME_ID:
                win = true; endMsg = "Time's up! You survived!"; break; // These games lose on event, so time out is a win
            case CATCH_STARS_GAME_ID:
                win = score >= 5; // Example win condition: 5 stars
                endMsg = `Time's up! You caught ${score} stars. ` + (win ? "You win!" : "Try for 5!"); break;
            case REMEMBER_SEQUENCE_GAME_ID:
                win = gameSequence.length > 3; // Example: remembered a sequence of decent length
                endMsg = `Time's up! Remembered ${Math.max(0, gameSequence.length - (displayPhase ? 1:0) -1)} correct steps.`; break;
            case CLICK_TARGET_GAME_ID:
                win = targetScore >= 5; // Example: 5 targets hit
                endMsg = `Time's up! You hit ${targetScore} targets.`; break;
            case QUICK_REFLEXES_GAME_ID:
                win = reflexScore >= 3; // Example: 3 correct clicks
                endMsg = `Time's up! Score: ${reflexScore}.`; break;
            case MEMORY_MATCH_GAME_ID:
                win = matchedPairs === (matchGrid.rows * matchGrid.cols) / 2;
                endMsg = win ? "Time's up! All pairs matched!" : `Time's up! ${matchedPairs} pairs found.`; break;
            case MAZE_RUNNER_GAME_ID:
                win = false; // Maze game typically ends on reaching exit, not by time for a win
                endMsg = "Time's up! You didn't reach the exit."; break;
        }
        endGame(win, endMsg);
        return;
    }

    clearCanvas();

    // Draw game-specific elements by calling their respective update/draw functions
    switch (currentMicrogame) {
        case CAT_ASLEEP_GAME_ID: drawCat(); drawNoises(); break;
        case UFO_GAME_ID: updateUFOAndPlayer(); drawPlayer(); drawUFO(); break;
        case CATCH_STARS_GAME_ID: drawStars(); break;
        case AVOID_LASERS_GAME_ID: updateLaserPlayerPosition(); drawLaserPlayer(); drawLasers(); break;
        case REMEMBER_SEQUENCE_GAME_ID: drawSequenceButtons(); break; // Highlight logic is within its own system
        case CLICK_TARGET_GAME_ID: drawTarget(); break;
        case BALANCE_BALL_GAME_ID: updateBallAndPlatform(); drawPlatform(); drawBall(); break;
        case QUICK_REFLEXES_GAME_ID: drawReflexButton(); break; // Color change is interval-based
        case MEMORY_MATCH_GAME_ID: drawMemoryMatchCards(); break;
        case MAZE_RUNNER_GAME_ID: updateMazeRunner(); drawMazeWalls(); drawMazeExit(); drawMazePlayer(); break;
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function cleanupAllListeners() {
    cleanupCatAsleepListeners();
    cleanupUfoGameListeners();
    cleanupCatchStarsListeners();
    cleanupAvoidLasersListeners();
    cleanupRememberSequenceListeners();
    cleanupClickTargetListeners();
    cleanupBalanceBallListeners();
    cleanupQuickReflexesListeners();
    cleanupMemoryMatchListeners();
    cleanupMazeRunnerListeners();
    // General listeners (if any were added to document/window directly and not per-game)
    // should also be removed here.
}

// --- Event Listeners ---
startGameButton.addEventListener('click', () => {
    if (gameActive && !gamePaused) return; // Prevent re-start if already running and not paused

    gameActive = true;
    gamePaused = false;
    gameStartTime = performance.now(); // Record the absolute start time
    gamePauseTime = 0; // Reset accumulated pause time for this new game session
    lastFrameTime = gameStartTime; // Initialize lastFrameTime for the first frame

    startGameButton.disabled = true;
    startGameButton.textContent = 'Game On!';
    gameSelector.disabled = true;
    pauseGameButton.style.display = 'inline-block';
    pauseGameButton.textContent = 'Pause';

    initSelectedGame(); // Initialize game elements and specific listeners
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Cancel any old loop
    animationFrameId = requestAnimationFrame(gameLoop); // Start the new game loop
});

pauseGameButton.addEventListener('click', () => {
    if (!gameActive) return; // Can only pause an active game
    // The togglePause function handles the logic for pausing and resuming,
    // including updating gamePauseTime and managing the animationFrameId.
    togglePause();
});

gameSelector.addEventListener('change', (event) => {
    if (gameActive && !gamePaused) { // If a game is running and not paused, don't allow change
        gameSelector.value = currentMicrogame; // Revert selection to current game
        return;
    }
    currentMicrogame = event.target.value;
    // Update instructions and reset timer/message for the newly selected game preview
    const selectedGameDef = games.find(g => g.id === currentMicrogame);
    gameInstructions.textContent = selectedGameDef ? `Selected: ${selectedGameDef.name}. Click "Start Game"!` : "Select a game.";
    gameTimer.textContent = `Time: ${(gameDuration / 1000).toFixed(2)}`;
    gameMessage.textContent = "";
    // If a game was active but paused, stopping it before initializing new one
    if (gameActive && gamePaused) {
        stopGameLoop(); // Fully stop the paused game
        gameActive = false; // Ensure it's marked as not active
        gamePaused = false;
    }
    initSelectedGame(); // Initialize visuals for the newly selected game
});

modalPlayAgainButton.addEventListener('click', () => {
    hideModal();
    gameActive = false; // Ensure game is marked as not active before starting again
    gamePaused = false;
    startGameButton.disabled = false;
    startGameButton.textContent = 'Start Game';
    gameSelector.disabled = false; // Allow changing game if they want
    pauseGameButton.style.display = 'none';
    // currentMicrogame should still be the one they just played
    initSelectedGame(); // Re-initialize the same game
    // startGameButton.click(); // Optionally auto-start, or let user click
});

modalCloseButton.addEventListener('click', () => {
    hideModal();
    gameActive = false;
    gamePaused = false;
    startGameButton.disabled = false;
    startGameButton.textContent = 'Start Game';
    gameSelector.disabled = false;
    pauseGameButton.style.display = 'none';
    gameInstructions.textContent = "Select a game and click \"Start Game\"!";
    gameTimer.textContent = `Time: ${(gameDuration / 1000).toFixed(2)}`;
    gameMessage.textContent = "";
    clearCanvas();
    // currentMicrogame is already set by the selector if changed, or is the last played
    initSelectedGame(); // Prepare the selected game visuals (or last played one)
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    populateGameSelector();
    // Set canvas preferred drawing dimensions (CSS handles display size)
    canvas.width = 500;
    canvas.height = 300;

    if (currentMicrogame) { // If games were populated and currentMicrogame is set (first game by default)
        initSelectedGame(); // Initialize the default game's visuals and instructions
    } else {
        gameInstructions.textContent = "No games available to load.";
    }
});