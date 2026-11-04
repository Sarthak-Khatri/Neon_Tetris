/**
 * Game Control
 * 
 * Handles game initialization, screen navigation, pause/resume, and game state changes.
 * Orchestrates the overall game flow.
 * 
 * @module game-control
 */

'use strict';

import { GAME_STATE } from './constants.js';
import {
    allScreens,
    menuScreen,
    gameScreen,
    boardFrame,
    previewNotice,
    pauseOverlay,
    gameOverOverlay,
    pauseButton,
    holdButton,
    finalScoreDisplay,
    finalBestDisplay,
    restartButton,
    resumeButton
} from './dom-elements.js';
import * as state from './game-state.js';
import { createBoard, drawBoard } from './board.js';
import { getRandomPiece, drawNextPiece, drawHoldPiece } from './pieces.js';
import { spawnPiece } from './movement.js';
import { updateHud, updateDangerState, resetScoreCelebrations, announceNewHighScore } from './scoring.js';
import { updateAbilityButtons, clearSlowMotion } from './abilities.js';
import { startFallingTimer, stopFallingTimer } from './timing.js';
import { playSound, setMusicMood, pauseMusic, resumeMusic } from './audio.js';
import { pauseSlowMotionTimer, resumeSlowMotionTimer } from './abilities.js';

let bestScoreAtRunStart = state.bestScore;

// ============================================================================
// GAME STATE CONTROL
// ============================================================================

/**
 * Set the game state and update UI accordingly
 * 
 * @param {string} nextState - The new game state (from GAME_STATE constants)
 */
export function setGameState(nextState) {
    const previousState = state.gameState;
    state.setGameState(nextState);

    if (nextState === GAME_STATE.PAUSED) {
        pauseMusic();
        playSound('pause');
    } else if (nextState === GAME_STATE.PLAYING) {
        if (previousState === GAME_STATE.PAUSED) {
            resumeMusic();
            playSound('resume');
        } else {
            setMusicMood('gameplay');
        }
    } else if (nextState === GAME_STATE.GAME_OVER) {
        setMusicMood('gameover');
    } else if (nextState === GAME_STATE.MENU) {
        setMusicMood('menu');
    }
    
    // Show/hide overlays based on state
    pauseOverlay.hidden = nextState !== GAME_STATE.PAUSED;
    gameOverOverlay.hidden = nextState !== GAME_STATE.GAME_OVER;
    
    // Update pause button
    pauseButton.textContent = nextState === GAME_STATE.PAUSED ? 'RESUME' : 'PAUSE';
    pauseButton.setAttribute('aria-pressed', String(nextState === GAME_STATE.PAUSED));
    pauseButton.disabled = nextState === GAME_STATE.GAME_OVER || 
                          nextState === GAME_STATE.MENU;
    if (holdButton) {
        holdButton.disabled = nextState !== GAME_STATE.PLAYING || state.holdUsedThisTurn || !state.activePiece;
    }
    
    // Update game over screen
    if (nextState === GAME_STATE.GAME_OVER) {
        finalScoreDisplay.textContent = String(state.score);
        finalBestDisplay.textContent = String(state.bestScore);
        const recordBadge = document.querySelector('#new-record-badge');
        if (recordBadge) {
            const isNewRecord = state.bestScore > bestScoreAtRunStart;
            recordBadge.hidden = !isNewRecord;
            if (isNewRecord) announceNewHighScore();
        }
    }
    
    // Update ability buttons
    updateAbilityButtons();
}

// ============================================================================
// SCREEN NAVIGATION
// ============================================================================

/**
 * Switch to a different screen
 * 
 * @param {HTMLElement} screen - The screen element to show
 * @param {HTMLElement} [focusTarget] - Optional element to focus after transition
 */
export function showScreen(screen, focusTarget) {
    const previousScreen = state.activeScreen;
    // Clean up when leaving game screen
    if (state.activeScreen === gameScreen && screen !== gameScreen) {
        stopFallingTimer();
        clearSlowMotion();
        setGameState(GAME_STATE.MENU);
    }
    
    // Toggle screen visibility
    allScreens.forEach((item) => {
        const isActive = item === screen;
        item.hidden = !isActive;
        item.classList.toggle('is-active', isActive);
    });
    
    // Update active screen
    state.setActiveScreen(screen);
    updateAbilityButtons();
    if (screen === menuScreen || screen === document.querySelector('#how-screen') || screen === document.querySelector('#settings-screen')) {
        setMusicMood('menu');
    }
    if (previousScreen !== screen) playSound('transition');
    
    // Focus target element if provided
    if (focusTarget) {
        focusTarget.focus();
    }
}

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Start a new game
 * 
 * Resets all game state and begins gameplay.
 */
export function startNewGame() {
    const restartingInGame = state.activeScreen === gameScreen;
    bestScoreAtRunStart = state.bestScore;
    resetScoreCelebrations();
    // Clear timers
    stopFallingTimer();
    clearSlowMotion();
    if (restartingInGame) playSound('transition');
    
    // Reset game state
    state.setBoard(createBoard());
    state.setScore(0);
    state.setTotalRowsCleared(0);
    state.setCurrentLevel(1);
    state.setEnergy(0);
    state.setComboCount(0);
    state.setActivePiece(null);
    state.setHeldPiece(null);
    state.setHoldUsedThisTurn(false);
    state.setNextPiece(getRandomPiece());
    drawHoldPiece();
    state.setDangerState('stable');
    
    // Set game state to playing
    setGameState(GAME_STATE.PLAYING);
    
    // Update UI
    document.querySelector('#ability-feedback').textContent = 
        'Clear rows to charge the reactor.';
    updateHud();
    updateDangerState();
    previewNotice.textContent = 
        'Arrows move and rotate; Space hard-drops. Press C to hold once per piece; the outline previews its landing.';
    
    // Show game screen if not already visible
    if (state.activeScreen !== gameScreen) {
        showScreen(gameScreen, boardFrame);
    } else {
        boardFrame.focus();
    }
    
    // Spawn first piece and start timer
    if (spawnPiece()) {
        startFallingTimer();
    }
}

/**
 * Return to the main menu
 */
export function returnToMenu() {
    const playButton = document.querySelector('#play-button');
    showScreen(menuScreen, playButton);
}

/**
 * Close an info panel (instructions or settings)
 */
export function closePanel() {
    const howScreen = document.querySelector('#how-screen');
    const settingsScreen = document.querySelector('#settings-screen');
    
    // Determine which button to focus based on which panel was open
    if (state.activeScreen === howScreen || 
        state.activeScreen === settingsScreen) {
        const returnButtonId = state.activeScreen === howScreen 
            ? 'how-button' 
            : 'settings-button';
        const returnButton = document.querySelector(`#${returnButtonId}`);
        showScreen(menuScreen, returnButton);
    }
}

// ============================================================================
// PAUSE/RESUME
// ============================================================================

/**
 * Toggle between paused and playing states
 */
export function togglePause() {
    // Only works when on game screen
    if (state.activeScreen !== gameScreen) return;
    
    if (state.gameState === GAME_STATE.PLAYING) {
        // Pause the game
        setGameState(GAME_STATE.PAUSED);
        stopFallingTimer();
        
        // Pause slow motion timer if active
        if (state.isSlowMotionActive) {
            pauseSlowMotionTimer();
        }
        
        previewNotice.textContent = 'Falling paused. Resume when you are ready.';
        resumeButton.focus();
        
    } else if (state.gameState === GAME_STATE.PAUSED) {
        // Resume the game
        setGameState(GAME_STATE.PLAYING);
        
        // Resume slow motion timer if it was active
        if (state.isSlowMotionActive) {
            resumeSlowMotionTimer();
        }
        
        startFallingTimer();
        previewNotice.textContent = 
            'Use the arrow keys or touch controls to play. Space hard-drops the piece.';
        boardFrame.focus();
    }
}

// ============================================================================
// GAME OVER
// ============================================================================

/**
 * End the current game
 * 
 * Called when a piece cannot spawn (game over condition).
 */
export function endGame() {
    // Prevent multiple game over triggers
    if (state.gameState === GAME_STATE.GAME_OVER) return;
    
    // Clear all timers
    clearSlowMotion();
    stopFallingTimer();
    
    // Set game over state
    setGameState(GAME_STATE.GAME_OVER);
    
    // Update message
    previewNotice.textContent = 'The stack blocked the next piece.';
    
    // Play game over sound
    playSound('gameover');
    
    // Focus restart button
    restartButton.focus();
}
