/**
 * Game State Management
 * 
 * Manages all mutable game state variables.
 * Provides centralized state management for the entire game.
 * 
 * @module game-state
 */

'use strict';

import { GAME_STATE } from './constants.js';
import { menuScreen, gameScreen } from './dom-elements.js';

// ============================================================================
// SCREEN AND STATE TRACKING
// ============================================================================

/** Currently active screen element */
export let activeScreen = menuScreen;

/** Current game state (menu, playing, paused, or game over) */
export let gameState = GAME_STATE.MENU;

// ============================================================================
// BOARD AND PIECES
// ============================================================================

/** 2D array representing the game board (null = empty, object = occupied) */
export let board = null;

/** Currently falling piece object */
export let activePiece = null;

/** Next piece to spawn */
export let nextPiece = null;

/** Stored tetromino available through the once-per-piece Hold action. */
export let heldPiece = null;

/** Whether Hold has already been used for the currently falling piece. */
export let holdUsedThisTurn = false;

// ============================================================================
// TIMING
// ============================================================================

/** Interval timer for piece falling */
export let fallingTimer = null;

/** Timer for slow motion duration */
export let slowMotionTimer = null;

/** Timestamp when slow motion ends */
export let slowMotionEndsAt = null;

/** Remaining slow motion time in milliseconds */
export let slowMotionRemainingMs = 0;

/** Whether slow motion is currently active */
export let isSlowMotionActive = false;

// ============================================================================
// SCORING AND PROGRESSION
// ============================================================================

/** Current score */
export let score = 0;

/** Best score across all sessions */
export let bestScore = 0;

/** Total rows cleared in current game */
export let totalRowsCleared = 0;

/** Current difficulty level */
export let currentLevel = 1;

/** Current energy reactor charge */
export let energy = 0;

/** Current combo count */
export let comboCount = 0;

/** Current danger state (stable, warning, critical) */
export let dangerState = 'stable';

// ============================================================================
// AUDIO
// ============================================================================

/** Whether sound effects are enabled */
export let soundEnabled = false;

/** Web Audio API context for sound generation */
export let audioContext = null;

// ============================================================================
// STATE SETTERS
// ============================================================================
// These functions allow other modules to update state

export function setActiveScreen(screen) {
    activeScreen = screen;
}

export function setGameState(state) {
    gameState = state;
}

export function setBoard(newBoard) {
    board = newBoard;
}

export function setActivePiece(piece) {
    activePiece = piece;
}

export function setNextPiece(piece) {
    nextPiece = piece;
}

export function setHeldPiece(piece) {
    heldPiece = piece;
}

export function setHoldUsedThisTurn(used) {
    holdUsedThisTurn = Boolean(used);
}

export function setFallingTimer(timer) {
    fallingTimer = timer;
}

export function setSlowMotionTimer(timer) {
    slowMotionTimer = timer;
}

export function setSlowMotionEndsAt(timestamp) {
    slowMotionEndsAt = timestamp;
}

export function setSlowMotionRemainingMs(ms) {
    slowMotionRemainingMs = ms;
}

export function setIsSlowMotionActive(active) {
    isSlowMotionActive = active;
}

export function setScore(newScore) {
    score = newScore;
}

export function setBestScore(newBestScore) {
    bestScore = newBestScore;
}

export function setTotalRowsCleared(count) {
    totalRowsCleared = count;
}

export function setCurrentLevel(level) {
    currentLevel = level;
}

export function setEnergy(amount) {
    energy = amount;
}

export function setComboCount(count) {
    comboCount = count;
}

export function setDangerState(state) {
    dangerState = state;
}

export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
}

export function setAudioContext(context) {
    audioContext = context;
}
