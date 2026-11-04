/**
 * Energy Reactor Abilities
 * 
 * Manages special ability activation and their effects.
 * Includes Energy Blast, Slow Motion, and Emergency Shift abilities.
 * 
 * @module abilities
 */

'use strict';

import {
    GAME_STATE,
    ENERGY_BLAST_COST,
    SLOW_MOTION_COST,
    EMERGENCY_SHIFT_COST,
    SLOW_MOTION_DURATION_MS,
    BOARD_ROWS,
    BOARD_COLUMNS
} from './constants.js';
import {
    gameScreen,
    abilityFeedback,
    energyBlastButton,
    slowMotionButton,
    shiftLeftButton,
    shiftRightButton
} from './dom-elements.js';
import * as state from './game-state.js';
import { drawBoard } from './board.js';
import { spendEnergy } from './scoring.js';
import { updateDangerState } from './scoring.js';
import { movePiece } from './movement.js';
import { isValidPosition } from './pieces.js';
import { playSound } from './audio.js';
import { startFallingTimer } from './timing.js';
import { emitLineClear, emitReactorBurst, triggerScreenShake, showFloatingText } from './effects.js';

// ============================================================================
// ENERGY BLAST ABILITY
// ============================================================================

/**
 * Use Energy Blast ability
 * 
 * Removes the bottom row of the board, shifting everything down.
 * Costs 60 energy. No points or combo awarded.
 */
export function useEnergyBlast() {
    // Only works during active gameplay
    if (state.activeScreen !== gameScreen || 
        state.gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    // Check energy cost
    if (state.energy < ENERGY_BLAST_COST) {
        abilityFeedback.textContent = `Energy Blast needs ${ENERGY_BLAST_COST} energy.`;
        return;
    }
    
    // Check if bottom row has any blocks
    const bottomRow = state.board[BOARD_ROWS - 1];
    if (!bottomRow.some((cell) => cell !== null)) {
        abilityFeedback.textContent = 'Energy Blast failed: the bottom row is already empty. No energy spent.';
        return;
    }
    
    // Spend energy
    if (!spendEnergy(ENERGY_BLAST_COST)) return;
    
    // Remove bottom row and add empty row at top
    state.board.pop();
    state.board.unshift(Array(BOARD_COLUMNS).fill(null));
    emitLineClear([BOARD_ROWS - 1]);
    emitReactorBurst();
    triggerScreenShake(.68);
    
    // Update visuals
    updateDangerState();
    drawBoard();
    
    abilityFeedback.textContent = 'ENERGY BLAST! The bottom row was removed. No line-clear points or combo added.';
    showFloatingText('ENERGY BLAST', abilityFeedback, '#b9faff');
    playSound('ability');
}

// ============================================================================
// SLOW MOTION ABILITY
// ============================================================================

/**
 * Activate Slow Motion ability
 * 
 * Slows piece falling speed by 50% for 5 seconds.
 * Costs 40 energy. Timer pauses when game is paused.
 */
export function activateSlowMotion() {
    // Only works during active gameplay
    if (state.activeScreen !== gameScreen || 
        state.gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    // Check if already active
    if (state.isSlowMotionActive) {
        abilityFeedback.textContent = 'Slow Motion is already active.';
        return;
    }
    
    // Check energy cost
    if (state.energy < SLOW_MOTION_COST) {
        abilityFeedback.textContent = `Slow Motion needs ${SLOW_MOTION_COST} energy.`;
        return;
    }
    
    // Spend energy
    if (!spendEnergy(SLOW_MOTION_COST)) return;
    
    // Activate slow motion
    state.setIsSlowMotionActive(true);
    emitReactorBurst();
    state.setSlowMotionRemainingMs(SLOW_MOTION_DURATION_MS);
    resumeSlowMotionTimer();
    
    // Restart falling timer with new speed
    startFallingTimer();
    
    abilityFeedback.textContent = 'SLOW MOTION active for five seconds. Its countdown pauses with gameplay.';
    showFloatingText('SLOW MOTION', abilityFeedback, '#baa6ff');
    playSound('ability');
    updateAbilityButtons();
}

/**
 * Pause the slow motion timer
 * 
 * Called when the game is paused. Saves remaining time.
 */
export function pauseSlowMotionTimer() {
    if (state.slowMotionTimer === null) return;
    
    // Calculate remaining time
    state.setSlowMotionRemainingMs(
        Math.max(0, state.slowMotionEndsAt - Date.now())
    );
    
    // Clear the timer
    window.clearTimeout(state.slowMotionTimer);
    state.setSlowMotionTimer(null);
    state.setSlowMotionEndsAt(null);
}

/**
 * Resume the slow motion timer
 * 
 * Called when game is unpaused. Continues from saved time.
 */
export function resumeSlowMotionTimer() {
    // Don't resume if not active or already running
    if (!state.isSlowMotionActive || state.slowMotionTimer !== null) {
        return;
    }
    
    // Calculate end time
    state.setSlowMotionEndsAt(Date.now() + state.slowMotionRemainingMs);
    
    // Set timer to end slow motion
    const timer = window.setTimeout(() => {
        endSlowMotion();
    }, state.slowMotionRemainingMs);
    
    state.setSlowMotionTimer(timer);
}

/**
 * End slow motion effect
 * 
 * Clears the timer and restores normal speed.
 */
function endSlowMotion() {
    state.setSlowMotionTimer(null);
    state.setSlowMotionEndsAt(null);
    state.setSlowMotionRemainingMs(0);
    state.setIsSlowMotionActive(false);
    
    updateAbilityButtons();
    abilityFeedback.textContent = 'Slow Motion ended. Normal level speed restored.';
    
    // Restart timer at normal speed
    startFallingTimer();
}

/**
 * Clear slow motion completely
 * 
 * Used when ending game or returning to menu.
 */
export function clearSlowMotion() {
    if (state.slowMotionTimer !== null) {
        window.clearTimeout(state.slowMotionTimer);
    }
    
    state.setSlowMotionTimer(null);
    state.setSlowMotionEndsAt(null);
    state.setSlowMotionRemainingMs(0);
    state.setIsSlowMotionActive(false);
    
    updateAbilityButtons();
}

// ============================================================================
// EMERGENCY SHIFT ABILITY
// ============================================================================

/**
 * Use Emergency Shift ability
 * 
 * Instantly moves the active piece left or right.
 * Costs 20 energy.
 * 
 * @param {number} direction - Direction to shift (-1 for left, 1 for right)
 */
export function useEmergencyShift(direction) {
    // Only works during active gameplay
    if (state.activeScreen !== gameScreen || 
        state.gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    // Check energy cost
    if (state.energy < EMERGENCY_SHIFT_COST) {
        abilityFeedback.textContent = `Emergency Shift needs ${EMERGENCY_SHIFT_COST} energy.`;
        return;
    }
    
    const piece = state.activePiece;
    
    // Check if shift is possible
    if (!piece || !isValidPosition(piece, piece.x + direction, piece.y)) {
        abilityFeedback.textContent = 'Emergency Shift blocked: there is no room in that direction. No energy spent.';
        return;
    }
    
    // Perform shift and spend energy
    if (movePiece(direction, 0) && spendEnergy(EMERGENCY_SHIFT_COST)) {
        emitReactorBurst();
        const directionText = direction < 0 ? 'Left' : 'Right';
        abilityFeedback.textContent = `Emergency Shift ${directionText} succeeded.`;
        playSound('ability');
    }
}

// ============================================================================
// ABILITY BUTTON STATES
// ============================================================================

/**
 * Update the enabled/disabled state of all ability buttons
 * 
 * Buttons are disabled if not enough energy or ability is on cooldown.
 */
export function updateAbilityButtons() {
    const canUseAbilities = state.activeScreen === gameScreen && 
                           state.gameState === GAME_STATE.PLAYING;
    
    // Energy Blast (60 energy)
    energyBlastButton.disabled = !canUseAbilities || 
                                 state.energy < ENERGY_BLAST_COST;
    
    // Slow Motion (40 energy, can't use if already active)
    slowMotionButton.disabled = !canUseAbilities || 
                                state.energy < SLOW_MOTION_COST || 
                                state.isSlowMotionActive;
    
    // Emergency Shift Left (20 energy)
    shiftLeftButton.disabled = !canUseAbilities || 
                               state.energy < EMERGENCY_SHIFT_COST;
    
    // Emergency Shift Right (20 energy)
    shiftRightButton.disabled = !canUseAbilities || 
                                state.energy < EMERGENCY_SHIFT_COST;
}
