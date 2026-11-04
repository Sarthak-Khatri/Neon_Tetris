/**
 * Game Constants
 * 
 * All constant values and configuration settings for the Neon Drop game.
 * Modify these to adjust game difficulty and behavior.
 * 
 * @module constants
 */

'use strict';

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

/** Number of columns in the game board */
export const BOARD_COLUMNS = 10;

/** Number of rows in the game board */
export const BOARD_ROWS = 20;

// ============================================================================
// TIMING AND DIFFICULTY
// ============================================================================

/** Initial falling interval in milliseconds for level 1 */
export const START_FALL_INTERVAL_MS = 800;

/** Amount to decrease fall interval per level */
export const FALL_INTERVAL_STEP_MS = 60;

/** Minimum falling interval (maximum speed) */
export const MIN_FALL_INTERVAL_MS = 160;

/** Duration of slow motion ability in milliseconds */
export const SLOW_MOTION_DURATION_MS = 5000;

// ============================================================================
// SCORING SYSTEM
// ============================================================================

/** Points awarded for clearing rows (1-4 rows) */
export const LINE_CLEAR_POINTS = {
    1: 100,  // Single row
    2: 300,  // Double row
    3: 500,  // Triple row
    4: 800   // Tetris (4 rows)
};

// ============================================================================
// ENERGY REACTOR SYSTEM
// ============================================================================

/** Maximum energy capacity */
export const MAX_ENERGY = 100;

/** Energy gained per row cleared */
export const ENERGY_PER_ROW = 15;

/** Energy cost for blast ability (removes bottom row) */
export const ENERGY_BLAST_COST = 60;

/** Energy cost for slow motion ability */
export const SLOW_MOTION_COST = 40;

/** Energy cost for emergency shift ability */
export const EMERGENCY_SHIFT_COST = 20;

// ============================================================================
// DANGER LEVELS
// ============================================================================

/** Stack height that triggers warning state */
export const WARNING_STACK_HEIGHT = 10;

/** Stack height that triggers critical state */
export const CRITICAL_STACK_HEIGHT = 15;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/** Key for storing best score in localStorage */
export const BEST_SCORE_STORAGE_KEY = 'neonDropBestScore';

/** Key for storing sound preference in localStorage */
export const SOUND_STORAGE_KEY = 'neonDropSoundEnabled';

// ============================================================================
// GAME STATES
// ============================================================================

/** All possible game states */
export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
};

// ============================================================================
// TETROMINO DEFINITIONS
// ============================================================================

/**
 * Tetromino piece definitions
 * Each piece has a shape (2D array where 1 = filled, 0 = empty)
 * and a colorClass for styling
 */
export const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        colorClass: 'piece-i'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        colorClass: 'piece-o'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        colorClass: 'piece-t'
    },
    L: {
        shape: [
            [1, 0],
            [1, 0],
            [1, 1]
        ],
        colorClass: 'piece-l'
    },
    J: {
        shape: [
            [0, 1],
            [0, 1],
            [1, 1]
        ],
        colorClass: 'piece-j'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        colorClass: 'piece-s'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        colorClass: 'piece-z'
    }
};

/** Array of all tetromino type names */
export const TETROMINO_NAMES = Object.keys(TETROMINOES);

// ============================================================================
// SOUND FREQUENCIES
// ============================================================================

/** Sound effect frequencies for synthesized audio */
export const SOUND_FREQUENCIES = {
    move: 260,      // Piece movement
    rotate: 420,    // Piece rotation
    drop: 150,      // Hard drop
    clear: 620,     // Row clear
    ability: 520,   // Ability activation
    level: 760,     // Level up
    gameover: 110   // Game over
};
