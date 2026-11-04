'use strict';

// 1. Board constants and page elements
const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;
const START_FALL_INTERVAL_MS = 800;
const FALL_INTERVAL_STEP_MS = 60;
const MIN_FALL_INTERVAL_MS = 160;
const LINE_CLEAR_POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };
const MAX_ENERGY = 100;
const ENERGY_PER_ROW = 15;
const ENERGY_BLAST_COST = 60;
const SLOW_MOTION_COST = 40;
const EMERGENCY_SHIFT_COST = 20;
const SLOW_MOTION_DURATION_MS = 5000;
// Danger is based on stack height, measured upward from the bottom row.
const WARNING_STACK_HEIGHT = 10;
const CRITICAL_STACK_HEIGHT = 15;
const BEST_SCORE_STORAGE_KEY = 'neonDropBestScore';
const SOUND_STORAGE_KEY = 'neonDropSoundEnabled';
const GAME_STATE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'gameover' };

const menuScreen = document.querySelector('#menu-screen');
const gameScreen = document.querySelector('#game-screen');
const howScreen = document.querySelector('#how-screen');
const settingsScreen = document.querySelector('#settings-screen');
const previewNotice = document.querySelector('#preview-notice');
const pauseButton = document.querySelector('#pause-button');
const boardGrid = document.querySelector('#board-grid');
const boardFrame = document.querySelector('#board-frame');
const nextPreview = document.querySelector('#next-preview');
const restartButton = document.querySelector('#restart-button');
const pauseOverlay = document.querySelector('#pause-overlay');
const gameOverOverlay = document.querySelector('#game-over-overlay');
const resumeButton = document.querySelector('#resume-button');
const finalScoreDisplay = document.querySelector('#final-score-display');
const finalBestDisplay = document.querySelector('#final-best-display');
const scoreDisplay = document.querySelector('#score-display');
const gameBestScoreDisplay = document.querySelector('#game-best-score');
const levelDisplay = document.querySelector('#level-display');
const rowsDisplay = document.querySelector('#rows-display');
const energyTrack = document.querySelector('#energy-track');
const energyFill = document.querySelector('#energy-fill');
const energyValue = document.querySelector('#energy-value');
const comboDisplay = document.querySelector('#combo-display');
const dangerIndicator = document.querySelector('#danger-indicator');
const abilityFeedback = document.querySelector('#ability-feedback');
const energyBlastButton = document.querySelector('#energy-blast-button');
const slowMotionButton = document.querySelector('#slow-motion-button');
const shiftLeftButton = document.querySelector('#shift-left-button');
const shiftRightButton = document.querySelector('#shift-right-button');
const allScreens = [menuScreen, gameScreen, howScreen, settingsScreen];

// A 1 is a block and a 0 is an empty square in each tetromino matrix.
const TETROMINOES = {
    I: { shape: [[1, 1, 1, 1]], colorClass: 'piece-i' },
    O: { shape: [[1, 1], [1, 1]], colorClass: 'piece-o' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], colorClass: 'piece-t' },
    L: { shape: [[1, 0], [1, 0], [1, 1]], colorClass: 'piece-l' },
    J: { shape: [[0, 1], [0, 1], [1, 1]], colorClass: 'piece-j' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], colorClass: 'piece-s' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], colorClass: 'piece-z' }
};

const tetrominoNames = Object.keys(TETROMINOES);
let activeScreen = menuScreen;
let gameState = GAME_STATE.MENU;
let board = createBoard();
let activePiece = null;
let nextPiece = null;
let fallingTimer = null;
let score = 0;
let bestScore = 0;
let totalRowsCleared = 0;
let currentLevel = 1;
let energy = 0;
let comboCount = 0;
let dangerState = 'stable';
let slowMotionTimer = null;
let slowMotionEndsAt = null;
let slowMotionRemainingMs = 0;
let isSlowMotionActive = false;
let soundEnabled = false;
let audioContext = null;

// 2. Board initialization
function createBoard() {
    return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
}

function setGameState(nextState) {
    gameState = nextState;
    pauseOverlay.hidden = gameState !== GAME_STATE.PAUSED;
    gameOverOverlay.hidden = gameState !== GAME_STATE.GAME_OVER;
    pauseButton.textContent = gameState === GAME_STATE.PAUSED ? 'RESUME' : 'PAUSE';
    pauseButton.setAttribute('aria-pressed', String(gameState === GAME_STATE.PAUSED));
    pauseButton.disabled = gameState === GAME_STATE.GAME_OVER || gameState === GAME_STATE.MENU;
    if (gameState === GAME_STATE.GAME_OVER) {
        finalScoreDisplay.textContent = String(score);
        finalBestDisplay.textContent = String(bestScore);
    }
    updateAbilityButtons();
}

function createBoardCells() {
    boardGrid.replaceChildren();
    for (let cellNumber = 0; cellNumber < BOARD_COLUMNS * BOARD_ROWS; cellNumber += 1) {
        const cell = document.createElement('span');
        cell.className = 'board-cell';
        boardGrid.appendChild(cell);
    }
}

// 3. Piece creation, validation, and spawning
function createPiece(type) {
    const definition = TETROMINOES[type];
    return {
        type,
        shape: definition.shape.map((row) => [...row]),
        colorClass: definition.colorClass,
        x: Math.floor((BOARD_COLUMNS - definition.shape[0].length) / 2),
        y: 0
    };
}

function getRandomPiece() {
    const randomIndex = Math.floor(Math.random() * tetrominoNames.length);
    return createPiece(tetrominoNames[randomIndex]);
}

function isValidPosition(piece, x, y, shape = piece.shape) {
    for (let rowOffset = 0; rowOffset < shape.length; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < shape[rowOffset].length; columnOffset += 1) {
            if (!shape[rowOffset][columnOffset]) continue;

            const boardRow = y + rowOffset;
            const boardColumn = x + columnOffset;

            if (boardColumn < 0 || boardColumn >= BOARD_COLUMNS || boardRow >= BOARD_ROWS) return false;
            // A rotated piece may extend slightly above the visible board.
            if (boardRow >= 0 && board[boardRow][boardColumn] !== null) return false;
        }
    }
    return true;
}

function spawnPiece() {
    activePiece = nextPiece || getRandomPiece();
    activePiece.x = Math.floor((BOARD_COLUMNS - activePiece.shape[0].length) / 2);
    activePiece.y = 0;

    // Show the upcoming piece, then check the spawn before drawing or moving it.
    nextPiece = getRandomPiece();
    drawNextPiece();

    if (!isValidPosition(activePiece, activePiece.x, activePiece.y)) {
        activePiece = null;
        endGame();
        return false;
    }

    drawBoard();
    return true;
}

// 4. Rendering
function drawBoard() {
    const cells = boardGrid.children;

    for (let row = 0; row < BOARD_ROWS; row += 1) {
        for (let column = 0; column < BOARD_COLUMNS; column += 1) {
            const cell = cells[row * BOARD_COLUMNS + column];
            const lockedCell = board[row][column];
            cell.className = 'board-cell';
            if (lockedCell) cell.classList.add('is-occupied', lockedCell.colorClass);
        }
    }

    if (!activePiece) return;
    activePiece.shape.forEach((pieceRow, rowOffset) => {
        pieceRow.forEach((isFilled, columnOffset) => {
            if (!isFilled) return;
            const boardRow = activePiece.y + rowOffset;
            const boardColumn = activePiece.x + columnOffset;
            if (boardRow < 0 || boardRow >= BOARD_ROWS || boardColumn < 0 || boardColumn >= BOARD_COLUMNS) return;
            cells[boardRow * BOARD_COLUMNS + boardColumn].classList.add('is-active', activePiece.colorClass);
        });
    });
}

function drawNextPiece() {
    nextPreview.replaceChildren();
    if (!nextPiece) return;

    const previewSize = 4;
    const pieceHeight = nextPiece.shape.length;
    const pieceWidth = nextPiece.shape[0].length;
    const offsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const offsetColumn = Math.floor((previewSize - pieceWidth) / 2);

    for (let row = 0; row < previewSize; row += 1) {
        for (let column = 0; column < previewSize; column += 1) {
            const cell = document.createElement('span');
            const pieceRow = row - offsetRow;
            const pieceColumn = column - offsetColumn;
            if (pieceRow >= 0 && pieceRow < pieceHeight && pieceColumn >= 0 && pieceColumn < pieceWidth
                && nextPiece.shape[pieceRow][pieceColumn]) {
                cell.classList.add('is-preview-piece', nextPiece.colorClass);
            }
            nextPreview.appendChild(cell);
        }
    }
    nextPreview.setAttribute('aria-label', `Next piece: ${nextPiece.type}`);
}

// 5. Movement, rotation, dropping, and locking
function movePiece(dx, dy) {
    if (!activePiece || activeScreen !== gameScreen || gameState !== GAME_STATE.PLAYING) return false;

    const nextX = activePiece.x + dx;
    const nextY = activePiece.y + dy;
    if (isValidPosition(activePiece, nextX, nextY)) {
        activePiece.x = nextX;
        activePiece.y = nextY;
        drawBoard();
        if (dx !== 0) playSound('move');
        return true;
    }

    if (dx === 0 && dy === 1) lockPiece();
    return false;
}

function rotateMatrixClockwise(matrix) {
    const rowCount = matrix.length;
    const columnCount = matrix[0].length;
    return Array.from({ length: columnCount }, (_, newRow) =>
        Array.from({ length: rowCount }, (_, newColumn) => matrix[rowCount - 1 - newColumn][newRow])
    );
}

function rotatePiece() {
    if (!activePiece || activePiece.type === 'O' || gameState !== GAME_STATE.PLAYING || activeScreen !== gameScreen) return;
    const rotatedShape = rotateMatrixClockwise(activePiece.shape);
    if (isValidPosition(activePiece, activePiece.x, activePiece.y, rotatedShape)) {
        activePiece.shape = rotatedShape;
        drawBoard();
        playSound('rotate');
    }
}

function hardDrop() {
    if (!activePiece || gameState !== GAME_STATE.PLAYING || activeScreen !== gameScreen) return;
    let droppedCells = 0;
    while (isValidPosition(activePiece, activePiece.x, activePiece.y + 1)) {
        activePiece.y += 1;
        droppedCells += 1;
    }
    if (droppedCells > 0) updateScore(droppedCells * 2);
    playSound('drop');
    drawBoard();
    lockPiece();
}

function lockPiece() {
    if (!activePiece || gameState !== GAME_STATE.PLAYING) return;

    for (let rowOffset = 0; rowOffset < activePiece.shape.length; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < activePiece.shape[rowOffset].length; columnOffset += 1) {
            if (!activePiece.shape[rowOffset][columnOffset]) continue;
            const boardRow = activePiece.y + rowOffset;
            const boardColumn = activePiece.x + columnOffset;

            if (boardRow < 0) {
                activePiece = null;
                endGame();
                return;
            }

            board[boardRow][boardColumn] = {
                type: activePiece.type,
                colorClass: activePiece.colorClass
            };
        }
    }

    const previousLevel = currentLevel;
    const clearedRows = clearCompletedRows();
    if (clearedRows > 0) {
        totalRowsCleared += clearedRows;
        comboCount += 1;
        const comboBonus = comboCount > 1 ? (comboCount - 1) * 50 : 0;
        updateScore((LINE_CLEAR_POINTS[clearedRows] || 0) + comboBonus);
        addEnergy(clearedRows * ENERGY_PER_ROW);
        abilityFeedback.textContent = comboBonus > 0
            ? `COMBO x${comboCount}! +${comboBonus} bonus points. Reactor +${clearedRows * ENERGY_PER_ROW} energy.`
            : `ROW CLEAR! Reactor +${clearedRows * ENERGY_PER_ROW} energy.`;
        currentLevel = Math.floor(totalRowsCleared / 10) + 1;
        updateHud();
        playSound('clear');
        if (currentLevel !== previousLevel) playSound('level');
    } else {
        comboCount = 0;
        abilityFeedback.textContent = 'Combo reset. Clear a row on the next placement to begin a new combo.';
        updateHud();
    }

    activePiece = null;
    updateDangerState();
    drawBoard();
    spawnPiece();
    if (currentLevel !== previousLevel) startFallingTimer();
}

// Keep incomplete rows in order, then add empty rows at the top.
function clearCompletedRows() {
    const remainingRows = board.filter((row) => row.some((cell) => cell === null));
    const clearedCount = BOARD_ROWS - remainingRows.length;
    if (clearedCount === 0) return 0;

    while (remainingRows.length < BOARD_ROWS) {
        remainingRows.unshift(Array(BOARD_COLUMNS).fill(null));
    }
    board = remainingRows;
    return clearedCount;
}

function updateScore(points) {
    score = Math.max(0, score + points);
    if (score > bestScore) {
        bestScore = score;
        saveBestScore();
    }
    updateHud();
}

function updateHud() {
    scoreDisplay.textContent = String(score).padStart(6, '0');
    gameBestScoreDisplay.textContent = String(bestScore);
    levelDisplay.textContent = String(currentLevel).padStart(2, '0');
    rowsDisplay.textContent = String(totalRowsCleared);
    comboDisplay.textContent = String(comboCount);
    document.querySelector('#best-score').textContent = String(bestScore);
    updateEnergyDisplay();
}

function addEnergy(amount) {
    energy = Math.min(MAX_ENERGY, Math.max(0, energy + amount));
    updateEnergyDisplay();
}

function spendEnergy(amount) {
    if (amount < 0 || energy < amount) return false;
    energy = Math.max(0, energy - amount);
    updateEnergyDisplay();
    return true;
}

function updateEnergyDisplay() {
    energyTrack.setAttribute('aria-valuenow', String(energy));
    energyFill.style.width = `${energy}%`;
    energyValue.textContent = `${energy} / ${MAX_ENERGY}`;
    updateAbilityButtons();
}

function updateAbilityButtons() {
    const canUseAbilities = activeScreen === gameScreen && gameState === GAME_STATE.PLAYING;
    energyBlastButton.disabled = !canUseAbilities || energy < ENERGY_BLAST_COST;
    slowMotionButton.disabled = !canUseAbilities || energy < SLOW_MOTION_COST || isSlowMotionActive;
    shiftLeftButton.disabled = !canUseAbilities || energy < EMERGENCY_SHIFT_COST;
    shiftRightButton.disabled = !canUseAbilities || energy < EMERGENCY_SHIFT_COST;
}

function updateDangerState() {
    const topOccupiedRow = board.findIndex((row) => row.some((cell) => cell !== null));
    const stackHeight = topOccupiedRow === -1 ? 0 : BOARD_ROWS - topOccupiedRow;
    dangerState = stackHeight >= CRITICAL_STACK_HEIGHT
        ? 'critical'
        : stackHeight >= WARNING_STACK_HEIGHT ? 'warning' : 'stable';

    dangerIndicator.textContent = dangerState.toUpperCase();
    dangerIndicator.classList.remove('is-stable', 'is-warning', 'is-critical');
    dangerIndicator.classList.add(`is-${dangerState}`);
}

function softDrop() {
    if (movePiece(0, 1)) updateScore(1);
}

function useEnergyBlast() {
    if (activeScreen !== gameScreen || gameState !== GAME_STATE.PLAYING) return;
    if (energy < ENERGY_BLAST_COST) {
        abilityFeedback.textContent = `Energy Blast needs ${ENERGY_BLAST_COST} energy.`;
        return;
    }

    const bottomRow = board[BOARD_ROWS - 1];
    if (!bottomRow.some((cell) => cell !== null)) {
        abilityFeedback.textContent = 'Energy Blast failed: the bottom row is already empty. No energy spent.';
        return;
    }
    if (!spendEnergy(ENERGY_BLAST_COST)) return;

    board.pop();
    board.unshift(Array(BOARD_COLUMNS).fill(null));
    updateDangerState();
    drawBoard();
    abilityFeedback.textContent = 'ENERGY BLAST! The bottom row was removed. No line-clear points or combo added.';
    playSound('ability');
}

function activateSlowMotion() {
    if (activeScreen !== gameScreen || gameState !== GAME_STATE.PLAYING) return;
    if (isSlowMotionActive) {
        abilityFeedback.textContent = 'Slow Motion is already active.';
        return;
    }
    if (energy < SLOW_MOTION_COST) {
        abilityFeedback.textContent = `Slow Motion needs ${SLOW_MOTION_COST} energy.`;
        return;
    }
    if (!spendEnergy(SLOW_MOTION_COST)) return;

    isSlowMotionActive = true;
    slowMotionRemainingMs = SLOW_MOTION_DURATION_MS;
    resumeSlowMotionTimer();
    startFallingTimer();
    abilityFeedback.textContent = 'SLOW MOTION active for five seconds. Its countdown pauses with gameplay.';
    playSound('ability');
    updateAbilityButtons();
}

function useEmergencyShift(direction) {
    if (activeScreen !== gameScreen || gameState !== GAME_STATE.PLAYING) return;
    if (energy < EMERGENCY_SHIFT_COST) {
        abilityFeedback.textContent = `Emergency Shift needs ${EMERGENCY_SHIFT_COST} energy.`;
        return;
    }
    if (!activePiece || !isValidPosition(activePiece, activePiece.x + direction, activePiece.y)) {
        abilityFeedback.textContent = 'Emergency Shift blocked: there is no room in that direction. No energy spent.';
        return;
    }

    if (movePiece(direction, 0) && spendEnergy(EMERGENCY_SHIFT_COST)) {
        abilityFeedback.textContent = `Emergency Shift ${direction < 0 ? 'Left' : 'Right'} succeeded.`;
        playSound('ability');
    }
}

function pauseSlowMotionTimer() {
    if (slowMotionTimer === null) return;
    slowMotionRemainingMs = Math.max(0, slowMotionEndsAt - Date.now());
    window.clearTimeout(slowMotionTimer);
    slowMotionTimer = null;
    slowMotionEndsAt = null;
}

function resumeSlowMotionTimer() {
    if (!isSlowMotionActive || slowMotionTimer !== null) return;
    slowMotionEndsAt = Date.now() + slowMotionRemainingMs;
    slowMotionTimer = window.setTimeout(() => {
        slowMotionTimer = null;
        slowMotionEndsAt = null;
        slowMotionRemainingMs = 0;
        isSlowMotionActive = false;
        updateAbilityButtons();
        abilityFeedback.textContent = 'Slow Motion ended. Normal level speed restored.';
        startFallingTimer();
    }, slowMotionRemainingMs);
}

function clearSlowMotion() {
    if (slowMotionTimer !== null) window.clearTimeout(slowMotionTimer);
    slowMotionTimer = null;
    slowMotionEndsAt = null;
    slowMotionRemainingMs = 0;
    isSlowMotionActive = false;
    updateAbilityButtons();
}

function endGame() {
    if (gameState === GAME_STATE.GAME_OVER) return;
    clearSlowMotion();
    stopFallingTimer();
    setGameState(GAME_STATE.GAME_OVER);
    previewNotice.textContent = 'The stack blocked the next piece.';
    playSound('gameover');
    restartButton.focus();
}

// 6. One falling timer and pause handling
function stopFallingTimer() {
    if (fallingTimer !== null) {
        window.clearInterval(fallingTimer);
        fallingTimer = null;
    }
}

function startFallingTimer() {
    stopFallingTimer();
    if (activeScreen !== gameScreen || gameState !== GAME_STATE.PLAYING) return;
    const normalInterval = Math.max(MIN_FALL_INTERVAL_MS, START_FALL_INTERVAL_MS - (currentLevel - 1) * FALL_INTERVAL_STEP_MS);
    const interval = isSlowMotionActive ? normalInterval * 2 : normalInterval;
    fallingTimer = window.setInterval(() => movePiece(0, 1), interval);
}

function togglePause() {
    if (activeScreen !== gameScreen) return;
    if (gameState === GAME_STATE.PLAYING) {
        setGameState(GAME_STATE.PAUSED);
        stopFallingTimer();
        pauseSlowMotionTimer();
        previewNotice.textContent = 'Falling paused. Resume when you are ready.';
        resumeButton.focus();
    } else if (gameState === GAME_STATE.PAUSED) {
        setGameState(GAME_STATE.PLAYING);
        resumeSlowMotionTimer();
        startFallingTimer();
        previewNotice.textContent = 'Use the arrow keys or touch controls to play. Space hard-drops the piece.';
        boardFrame.focus();
    }
}

// 7. Keyboard input
function isInteractiveTarget(target) {
    return target instanceof HTMLElement
        && Boolean(target.closest('button, input, select, textarea, a, [contenteditable="true"]'));
}

function keepFocusInsideOverlay(event, overlay) {
    if (event.key !== 'Tab') return;
    const buttons = [...overlay.querySelectorAll('button:not(:disabled)')];
    if (buttons.length === 0) return;
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
    }
}

document.addEventListener('keydown', (event) => {
    if ((activeScreen === howScreen || activeScreen === settingsScreen) && event.key === 'Escape') {
        event.preventDefault();
        closePanel();
        return;
    }
    if (activeScreen !== gameScreen) return;

    if (gameState === GAME_STATE.PAUSED) {
        keepFocusInsideOverlay(event, pauseOverlay);
        if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
            event.preventDefault();
            togglePause();
        }
        return;
    }
    if (gameState === GAME_STATE.GAME_OVER) {
        keepFocusInsideOverlay(event, gameOverOverlay);
        return;
    }
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) return;
        event.preventDefault();
        togglePause();
        return;
    }
    if (isInteractiveTarget(event.target)) return;

    if (gameState !== GAME_STATE.PLAYING) return;

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            event.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (!event.repeat) rotatePiece();
            break;
        case 'ArrowDown':
            event.preventDefault();
            softDrop();
            break;
        case ' ':
            event.preventDefault();
            if (!event.repeat) hardDrop();
            break;
        default:
            break;
    }
});

// 8. Screen navigation and new runs
function showScreen(screen, focusTarget) {
    if (activeScreen === gameScreen && screen !== gameScreen) {
        stopFallingTimer();
        clearSlowMotion();
        setGameState(GAME_STATE.MENU);
    }

    allScreens.forEach((item) => {
        const isActive = item === screen;
        item.hidden = !isActive;
        item.classList.toggle('is-active', isActive);
    });
    activeScreen = screen;
    updateAbilityButtons();
    if (focusTarget) focusTarget.focus();
}

function startNewGame() {
    stopFallingTimer();
    clearSlowMotion();
    board = createBoard();
    score = 0;
    totalRowsCleared = 0;
    currentLevel = 1;
    energy = 0;
    comboCount = 0;
    activePiece = null;
    nextPiece = getRandomPiece();
    dangerState = 'stable';
    setGameState(GAME_STATE.PLAYING);
    abilityFeedback.textContent = 'Clear rows to charge the reactor.';
    updateHud();
    updateDangerState();
    previewNotice.textContent = 'Use the arrow keys or touch controls to play. Space hard-drops the piece.';

    if (activeScreen !== gameScreen) showScreen(gameScreen, boardFrame);
    else boardFrame.focus();

    if (spawnPiece()) startFallingTimer();
}

function returnToMenu() {
    showScreen(menuScreen, document.querySelector('#play-button'));
}

function closePanel() {
    if (activeScreen === howScreen || activeScreen === settingsScreen) {
        const returnButtonId = activeScreen === howScreen ? 'how-button' : 'settings-button';
        showScreen(menuScreen, document.querySelector(`#${returnButtonId}`));
    }
}

document.querySelector('#play-button').addEventListener('click', startNewGame);
document.querySelector('#restart-button').addEventListener('click', startNewGame);
document.querySelector('#restart-now-button').addEventListener('click', startNewGame);
document.querySelector('#pause-restart-button').addEventListener('click', startNewGame);
document.querySelector('#pause-menu-button').addEventListener('click', returnToMenu);
document.querySelector('#gameover-menu-button').addEventListener('click', returnToMenu);
resumeButton.addEventListener('click', togglePause);
document.querySelector('#return-button').addEventListener('click', returnToMenu);
document.querySelector('#menu-button').addEventListener('click', returnToMenu);
document.querySelector('#how-button').addEventListener('click', () => showScreen(howScreen, howScreen.querySelector('.panel-close')));
document.querySelector('#settings-button').addEventListener('click', () => showScreen(settingsScreen, settingsScreen.querySelector('.panel-close')));
pauseButton.addEventListener('click', togglePause);
energyBlastButton.addEventListener('click', useEnergyBlast);
slowMotionButton.addEventListener('click', activateSlowMotion);
shiftLeftButton.addEventListener('click', () => useEmergencyShift(-1));
shiftRightButton.addEventListener('click', () => useEmergencyShift(1));

document.querySelectorAll('[data-close-panel]').forEach((button) => {
    button.addEventListener('click', closePanel);
});

// One click listener per touch button also supports keyboard and screen-reader activation.
document.querySelectorAll('[data-touch-action]').forEach((button) => {
    button.addEventListener('click', () => {
        if (gameState !== GAME_STATE.PLAYING) return;
        switch (button.dataset.touchAction) {
            case 'left': movePiece(-1, 0); break;
            case 'right': movePiece(1, 0); break;
            case 'rotate': rotatePiece(); break;
            case 'soft-drop': softDrop(); break;
            case 'hard-drop': hardDrop(); break;
            default: break;
        }
    });
});

// 9. Best-score storage, sound, and existing local preferences
const soundToggle = document.querySelector('#sound-toggle');
const bestScoreDisplay = document.querySelector('#best-score');

function loadBestScore() {
    try {
        const storedValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
        if (storedValue === null || storedValue.trim() === '') return 0;
        const parsedScore = Number(storedValue);
        if (!Number.isFinite(parsedScore) || parsedScore < 0) {
            window.localStorage.removeItem(BEST_SCORE_STORAGE_KEY);
            return 0;
        }
        return Math.floor(parsedScore);
    } catch (error) {
        // The in-memory score still works when storage is unavailable.
        return 0;
    }
}

function saveBestScore() {
    try {
        window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(bestScore));
    } catch (error) {
        // Keep the record for this page session even when storage is blocked.
    }
}

function playSound(soundName) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const soundFrequencies = {
        move: 260, rotate: 420, drop: 150, clear: 620,
        ability: 520, level: 760, gameover: 110
    };

    try {
        if (!audioContext) audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();
        const now = audioContext.currentTime;
        oscillator.type = soundName === 'gameover' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(soundFrequencies[soundName] || 300, now);
        volume.gain.setValueAtTime(0.0001, now);
        volume.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
        volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
        oscillator.connect(volume);
        volume.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.12);
    } catch (error) {
        // Sound support is optional and must never interrupt gameplay.
    }
}

bestScore = loadBestScore();
try {
    soundEnabled = window.localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
} catch (error) {
    soundEnabled = false;
}
soundToggle.checked = soundEnabled;
soundToggle.setAttribute('aria-label', soundEnabled ? 'Sound effects on' : 'Sound effects off');

soundToggle.addEventListener('change', () => {
    soundEnabled = soundToggle.checked;
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Sound effects on' : 'Sound effects off');
    try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    } catch (error) {
        // Sound can still be toggled for this page session.
    }
    playSound('ability');
});

try {
    bestScoreDisplay.textContent = String(bestScore);
} catch (error) { /* The page can continue if an optional display is unavailable. */ }
updateHud();
updateDangerState();

createBoardCells();
