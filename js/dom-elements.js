/**
 * DOM Element References
 * 
 * Centralized references to all DOM elements used throughout the game.
 * All elements are queried once at initialization for better performance.
 * 
 * @module dom-elements
 */

'use strict';

// ============================================================================
// SCREEN ELEMENTS
// ============================================================================

/** Main menu screen */
export const menuScreen = document.querySelector('#menu-screen');

/** Game play screen */
export const gameScreen = document.querySelector('#game-screen');

/** How to play instructions screen */
export const howScreen = document.querySelector('#how-screen');

/** Settings screen */
export const settingsScreen = document.querySelector('#settings-screen');

/** Array of all screen elements for easy iteration */
export const allScreens = [menuScreen, gameScreen, howScreen, settingsScreen];

// ============================================================================
// GAME BOARD ELEMENTS
// ============================================================================

/** Container for the game board grid */
export const boardGrid = document.querySelector('#board-grid');

/** Frame around the game board (receives focus) */
export const boardFrame = document.querySelector('#board-frame');

/** Preview area showing the next piece */
export const nextPreview = document.querySelector('#next-preview');

/** Preview area showing the held piece */
export const holdPreview = document.querySelector('#hold-preview');

/** Hold action button */
export const holdButton = document.querySelector('#hold-button');

// ============================================================================
// HUD ELEMENTS (Heads-Up Display)
// ============================================================================

/** Current score display */
export const scoreDisplay = document.querySelector('#score-display');

/** Best score display in game screen */
export const gameBestScoreDisplay = document.querySelector('#game-best-score');

/** Best score display in menu screen */
export const menuBestScoreDisplay = document.querySelector('#best-score');

/** Current level display */
export const levelDisplay = document.querySelector('#level-display');

/** Total rows cleared display */
export const rowsDisplay = document.querySelector('#rows-display');

/** Current combo count display */
export const comboDisplay = document.querySelector('#combo-display');

/** Stack danger state indicator */
export const dangerIndicator = document.querySelector('#danger-indicator');

// ============================================================================
// ENERGY REACTOR ELEMENTS
// ============================================================================

/** Energy track progress bar container */
export const energyTrack = document.querySelector('#energy-track');

/** Energy fill bar (colored portion) */
export const energyFill = document.querySelector('#energy-fill');

/** Energy text value display */
export const energyValue = document.querySelector('#energy-value');

/** Feedback message for abilities */
export const abilityFeedback = document.querySelector('#ability-feedback');

// ============================================================================
// ABILITY BUTTONS
// ============================================================================

/** Energy Blast ability button (60 energy) */
export const energyBlastButton = document.querySelector('#energy-blast-button');

/** Slow Motion ability button (40 energy) */
export const slowMotionButton = document.querySelector('#slow-motion-button');

/** Emergency Shift Left ability button (20 energy) */
export const shiftLeftButton = document.querySelector('#shift-left-button');

/** Emergency Shift Right ability button (20 energy) */
export const shiftRightButton = document.querySelector('#shift-right-button');

// ============================================================================
// CONTROL BUTTONS
// ============================================================================

/** Pause/Resume button */
export const pauseButton = document.querySelector('#pause-button');

/** Resume button in pause overlay */
export const resumeButton = document.querySelector('#resume-button');

/** Restart button in game over overlay */
export const restartButton = document.querySelector('#restart-button');

// ============================================================================
// OVERLAY ELEMENTS
// ============================================================================

/** Pause overlay dialog */
export const pauseOverlay = document.querySelector('#pause-overlay');

/** Game over overlay dialog */
export const gameOverOverlay = document.querySelector('#game-over-overlay');

/** Final score display in game over overlay */
export const finalScoreDisplay = document.querySelector('#final-score-display');

/** Final best score display in game over overlay */
export const finalBestDisplay = document.querySelector('#final-best-display');

// ============================================================================
// NOTIFICATION ELEMENTS
// ============================================================================

/** Preview notice text (instructional messages) */
export const previewNotice = document.querySelector('#preview-notice');

// ============================================================================
// SETTINGS ELEMENTS
// ============================================================================

/** Sound effects toggle checkbox */
export const soundToggle = document.querySelector('#sound-toggle');
