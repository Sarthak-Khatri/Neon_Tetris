/**
 * Neon Drop - Main Game Initialization
 * 
 * Entry point for the game. Initializes all modules and starts the game.
 * This file should be loaded as a module in the HTML.
 * 
 * @module main
 * @version 1.0.0
 * @author Neon Drop Team
 */

'use strict';

// Import all necessary modules
import { createBoard, createBoardCells } from './board.js';
import { loadBestScore, updateHud, updateDangerState, resetScoreCelebrations } from './scoring.js';
import { initializeSoundToggle } from './audio.js';
import { initializeInput } from './input.js';
import { initializeUIHandlers } from './ui-handlers.js';
import { initializePreferences } from './preferences.js';
import * as state from './game-state.js';
import { initializeCustomCursor } from './cursor.js';
import { initializeVisualEffects } from './effects.js';

document.documentElement.dataset.cursorLoading = 'true';

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initialize the game application
 * 
 * This function runs once when the page loads.
 * Sets up the DOM, loads saved data, and initializes all systems.
 */
function initializeGame() {
    console.log('🎮 Neon Drop - Initializing...');
    initializeCustomCursor();
    
    // ------------------------------------------------------------------------
    // 1. Load Saved Data
    // ------------------------------------------------------------------------
    
    // Load best score from localStorage
    const savedBestScore = loadBestScore();
    state.setBestScore(savedBestScore);
    console.log(`📊 Best score loaded: ${savedBestScore}`);
    
    // ------------------------------------------------------------------------
    // 2. Initialize Board
    // ------------------------------------------------------------------------
    
    // Create all board cell DOM elements
    createBoardCells();
    state.setBoard(createBoard());
    resetScoreCelebrations();
    initializeVisualEffects();
    console.log('🎲 Game board created');
    
    // ------------------------------------------------------------------------
    // 3. Initialize Audio System
    // ------------------------------------------------------------------------
    
    // Set up sound toggle control
    initializeSoundToggle();
    initializePreferences();
    console.log('🔊 Audio system initialized');
    
    // ------------------------------------------------------------------------
    // 4. Initialize Input Systems
    // ------------------------------------------------------------------------
    
    // Set up keyboard and touch controls
    initializeInput();
    console.log('🎹 Input handlers initialized');
    
    // ------------------------------------------------------------------------
    // 5. Initialize UI Event Handlers
    // ------------------------------------------------------------------------
    
    // Connect all buttons to their actions
    initializeUIHandlers();
    console.log('🖱️  UI handlers initialized');
    
    // ------------------------------------------------------------------------
    // 6. Update Initial Display
    // ------------------------------------------------------------------------
    
    // Update HUD with initial values
    updateHud();
    
    // Set initial danger state
    updateDangerState();
    
    // ------------------------------------------------------------------------
    // 7. Ready to Play
    // ------------------------------------------------------------------------
    
    console.log('✅ Neon Drop ready to play!');
    window.dispatchEvent(new Event('neon:loading-end'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global error handler
 * 
 * Catches and logs any unexpected errors during initialization or gameplay.
 */
window.addEventListener('error', (event) => {
    console.error('❌ Game error:', event.error);
    
    // In production, you might want to show a user-friendly error message
    // and offer to reload the game
});

/**
 * Unhandled promise rejection handler
 * 
 * Catches async errors that weren't handled with .catch()
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});

// ============================================================================
// START THE GAME
// ============================================================================

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOM already loaded
    initializeGame();
}

// ============================================================================
// MODULE EXPORTS (for debugging in console)
// ============================================================================

// Expose state for debugging in development
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1') {
    window.NeonDropDebug = {
        state,
        version: '1.0.0',
        info: 'Debug object for development. Not available in production.'
    };
    console.log('🔧 Debug mode: Access game state via window.NeonDropDebug');
}
