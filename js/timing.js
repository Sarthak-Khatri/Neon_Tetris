/**
 * Game Timing Control
 * 
 * Manages the falling timer that controls piece descent speed.
 * Handles timer creation, clearing, and speed calculations based on level.
 * 
 * @module timing
 */

'use strict';

import {
    GAME_STATE,
    START_FALL_INTERVAL_MS,
    FALL_INTERVAL_STEP_MS,
    MIN_FALL_INTERVAL_MS
} from './constants.js';
import { gameScreen } from './dom-elements.js';
import * as state from './game-state.js';
import { movePiece } from './movement.js';

// ============================================================================
// FALLING TIMER
// ============================================================================

/**
 * Stop the falling timer
 * 
 * Clears the interval that makes pieces fall automatically.
 */
export function stopFallingTimer() {
    if (state.fallingTimer !== null) {
        window.clearInterval(state.fallingTimer);
        state.setFallingTimer(null);
    }
}

/**
 * Start or restart the falling timer
 * 
 * Creates a new interval based on current level and slow motion state.
 * Faster levels have shorter intervals (pieces fall faster).
 */
export function startFallingTimer() {
    // Clear any existing timer first
    stopFallingTimer();
    
    // Only start timer during active gameplay
    if (state.activeScreen !== gameScreen || 
        state.gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    // Calculate interval based on level
    // Each level reduces the interval by FALL_INTERVAL_STEP_MS
    const normalInterval = Math.max(
        MIN_FALL_INTERVAL_MS,
        START_FALL_INTERVAL_MS - (state.currentLevel - 1) * FALL_INTERVAL_STEP_MS
    );
    
    // Double the interval if slow motion is active (half speed)
    const interval = state.isSlowMotionActive 
        ? normalInterval * 2 
        : normalInterval;
    
    // Create interval timer that moves piece down repeatedly
    const timer = window.setInterval(() => {
        movePiece(0, 1); // Move down one cell
    }, interval);
    
    state.setFallingTimer(timer);
}

/**
 * Pause all game timers
 * 
 * Called when game is paused or ended.
 */
export function pauseTimers() {
    stopFallingTimer();
}

/**
 * Resume game timers
 * 
 * Called when game is resumed from pause.
 */
export function resumeTimers() {
    startFallingTimer();
}
