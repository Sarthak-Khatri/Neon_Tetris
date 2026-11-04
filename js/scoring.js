/**
 * Scoring and HUD Management
 * 
 * Manages score, energy, danger levels, and HUD updates.
 * Handles all game progression and stat tracking.
 * 
 * @module scoring
 */

'use strict';

import { MAX_ENERGY, BEST_SCORE_STORAGE_KEY, GAME_STATE, LINE_CLEAR_POINTS } from './constants.js';
import {
    scoreDisplay,
    gameBestScoreDisplay,
    menuBestScoreDisplay,
    levelDisplay,
    rowsDisplay,
    comboDisplay,
    dangerIndicator,
    energyTrack,
    energyFill,
    energyValue
} from './dom-elements.js';
import * as state from './game-state.js';
import { calculateDangerState } from './board.js';
import { updateAbilityButtons } from './abilities.js';
import { playSound, setDangerMusic } from './audio.js';
import { emitReactorBurst, emitReactorCharge, showFloatingText } from './effects.js';

let runBestAtStart = 0;
let announcedNewBest = false;
let reactorReadyShown = false;

/** Apply the current level multiplier and the existing additive combo bonus. */
export function calculateLineClearPoints(lineCount, level, comboCount) {
    const basePoints = LINE_CLEAR_POINTS[lineCount] || 0;
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const safeCombo = Math.max(0, Math.floor(Number(comboCount) || 0));
    const comboBonus = Math.max(0, safeCombo - 1) * 50;
    return basePoints * safeLevel + comboBonus;
}

export function resetScoreCelebrations() {
    runBestAtStart = state.bestScore;
    announcedNewBest = false;
}

export function announceNewHighScore() {
    if (announcedNewBest) return;
    announcedNewBest = true;
    showFloatingText('NEW HIGH SCORE', scoreDisplay, '#d3b7ff');
    playSound('achievement');
}

// ============================================================================
// SCORE MANAGEMENT
// ============================================================================

/**
 * Update the player's score
 * 
 * Adds points to the current score and updates best score if needed.
 * 
 * @param {number} points - Non-negative points to add
 */
export function updateScore(points) {
    const scoreBefore = state.score;
    const awardedPoints = Number.isFinite(points) ? Math.max(0, points) : 0;
    state.setScore(scoreBefore + awardedPoints);

    if (awardedPoints > 0 && scoreDisplay && document.documentElement.dataset.animationIntensity !== 'off') {
        scoreDisplay.classList.remove('is-score-pulse');
        void scoreDisplay.offsetWidth;
        scoreDisplay.classList.add('is-score-pulse');
        if (awardedPoints >= 50) showFloatingText(`+${awardedPoints}`, scoreDisplay, '#b2f8ff');
    }
    
    // Update best score if current score is higher
    if (state.score > state.bestScore) {
        state.setBestScore(state.score);
        saveBestScore();
    }

    if (!announcedNewBest && state.score >= 100 && state.score > runBestAtStart) {
        announceNewHighScore();
    }

    updateHud();
}

/**
 * Load the best score from localStorage
 * 
 * @returns {number} The stored best score, or 0 if none found
 */
export function loadBestScore() {
    try {
        const storedValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
        
        // No score stored
        if (storedValue === null || storedValue.trim() === '') {
            return 0;
        }
        
        const parsedScore = Number(storedValue);
        
        // Validate the stored value
        if (!Number.isFinite(parsedScore) || parsedScore < 0) {
            // Invalid score, clear it
            window.localStorage.removeItem(BEST_SCORE_STORAGE_KEY);
            return 0;
        }
        
        return Math.floor(parsedScore);
    } catch (error) {
        // localStorage unavailable or blocked
        return 0;
    }
}

/**
 * Save the best score to localStorage
 */
export function saveBestScore() {
    try {
        window.localStorage.setItem(
            BEST_SCORE_STORAGE_KEY, 
            String(state.bestScore)
        );
    } catch (error) {
        // Storage blocked or quota exceeded
        // Score still persists for this session
    }
}

// ============================================================================
// ENERGY MANAGEMENT
// ============================================================================

/**
 * Add energy to the reactor
 * 
 * @param {number} amount - Amount of energy to add
 */
export function addEnergy(amount) {
    const newEnergy = state.energy + amount;
    state.setEnergy(Math.min(MAX_ENERGY, Math.max(0, newEnergy)));
    updateEnergyDisplay();
    if (amount > 0) emitReactorCharge(amount);
}

/**
 * Spend energy from the reactor
 * 
 * @param {number} amount - Amount of energy to spend
 * @returns {boolean} True if energy was successfully spent
 */
export function spendEnergy(amount) {
    // Validate amount
    if (amount < 0 || state.energy < amount) {
        return false;
    }
    
    state.setEnergy(Math.max(0, state.energy - amount));
    updateEnergyDisplay();
    return true;
}

/**
 * Update the energy reactor display
 */
export function updateEnergyDisplay() {
    const currentEnergy = state.energy;
    
    // Update progress bar
    energyTrack.setAttribute('aria-valuenow', String(currentEnergy));
    energyFill.style.width = `${currentEnergy}%`;
    
    // Update text value
    energyValue.textContent = `${currentEnergy} / ${MAX_ENERGY}`;

    const reactorVisual = document.querySelector('#reactor-visual');
    const reactorState = document.querySelector('#reactor-state');
    if (reactorVisual) {
        reactorVisual.style.setProperty('--reactor-charge', `${currentEnergy}%`);
        reactorVisual.style.setProperty('--reactor-intensity', String(.08 + (currentEnergy / MAX_ENERGY) * .45));
        reactorVisual.classList.toggle('is-ready', currentEnergy >= MAX_ENERGY);
        reactorVisual.classList.toggle('is-charging', currentEnergy < MAX_ENERGY);
    }
    if (reactorState) reactorState.textContent = currentEnergy >= MAX_ENERGY ? 'READY · ABILITY AVAILABLE' : `CHARGING · ${currentEnergy}%`;
    if (currentEnergy >= MAX_ENERGY && !reactorReadyShown) {
        reactorReadyShown = true;
        playSound('reactor-ready');
        emitReactorBurst();
    } else if (currentEnergy < MAX_ENERGY) {
        reactorReadyShown = false;
    }
    
    // Update ability button states
    updateAbilityButtons();
}

// ============================================================================
// DANGER STATE MANAGEMENT
// ============================================================================

/**
 * Update the stack danger state indicator
 * 
 * Calculates and displays the current danger level based on stack height.
 */
export function updateDangerState() {
    const previousState = state.dangerState;
    const newState = calculateDangerState();
    state.setDangerState(newState);
    document.documentElement.dataset.danger = newState;
    if (state.gameState === GAME_STATE.PLAYING) setDangerMusic(newState, previousState);
    
    // Update indicator text
    dangerIndicator.textContent = newState.toUpperCase();
    
    // Update indicator styling
    dangerIndicator.classList.remove('is-stable', 'is-warning', 'is-critical');
    dangerIndicator.classList.add(`is-${newState}`);
}

// ============================================================================
// HUD UPDATES
// ============================================================================

/**
 * Update all HUD elements
 * 
 * Refreshes all score, level, and stat displays.
 */
export function updateHud() {
    // Format score with leading zeros
    scoreDisplay.textContent = String(state.score).padStart(6, '0');
    
    // Update best score displays
    gameBestScoreDisplay.textContent = String(state.bestScore);
    if (menuBestScoreDisplay) {
        menuBestScoreDisplay.textContent = String(state.bestScore);
    }
    
    // Format level with leading zeros
    levelDisplay.textContent = String(state.currentLevel).padStart(2, '0');
    
    // Update progression stats
    rowsDisplay.textContent = String(state.totalRowsCleared);
    comboDisplay.textContent = String(state.comboCount);
    
    // Update energy display
    updateEnergyDisplay();
}
