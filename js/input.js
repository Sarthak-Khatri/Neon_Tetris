/**
 * Input Handling
 * 
 * Manages keyboard and touch input for game controls.
 * Handles menu navigation, gameplay controls, and accessibility features.
 * 
 * @module input
 */

'use strict';

import { GAME_STATE } from './constants.js';
import { gameScreen, howScreen, settingsScreen, pauseOverlay, gameOverOverlay } from './dom-elements.js';
import * as state from './game-state.js';
import { movePiece, softDrop, rotatePiece, hardDrop, holdCurrentPiece } from './movement.js';
import { useEnergyBlast, activateSlowMotion, useEmergencyShift } from './abilities.js';
import { togglePause, closePanel } from './game-control.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if the event target is an interactive element
 * 
 * Used to avoid interfering with form controls and links.
 * 
 * @param {EventTarget} target - The event target to check
 * @returns {boolean} True if target is interactive
 */
function isInteractiveTarget(target) {
    return target instanceof HTMLElement &&
           Boolean(target.closest('button, input, select, textarea, a, [contenteditable="true"]'));
}

/**
 * Keep focus trapped inside an overlay dialog
 * 
 * Implements the Tab key trap for accessibility.
 * 
 * @param {KeyboardEvent} event - The keyboard event
 * @param {HTMLElement} overlay - The overlay element
 */
function keepFocusInsideOverlay(event, overlay) {
    // Only handle Tab key
    if (event.key !== 'Tab') return;
    
    // Find all focusable buttons in the overlay
    const buttons = [...overlay.querySelectorAll('button:not(:disabled)')];
    if (buttons.length === 0) return;
    
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    
    // Wrap focus from last to first
    if (event.shiftKey && document.activeElement === firstButton) {
        event.preventDefault();
        lastButton.focus();
    } 
    // Wrap focus from first to last
    else if (!event.shiftKey && document.activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
    }
}

// ============================================================================
// KEYBOARD INPUT
// ============================================================================

/**
 * Handle keyboard input
 * 
 * Routes key presses to appropriate game actions based on current state.
 * 
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboard(event) {
    // Handle panel closing with Escape key
    if ((state.activeScreen === howScreen || 
         state.activeScreen === settingsScreen) && 
        event.key === 'Escape') {
        event.preventDefault();
        closePanel();
        return;
    }
    
    // Only handle game screen input from here
    if (state.activeScreen !== gameScreen) return;
    
    // Handle pause screen
    if (state.gameState === GAME_STATE.PAUSED) {
        keepFocusInsideOverlay(event, pauseOverlay);
        
        // Allow Escape or P to unpause
        if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
            event.preventDefault();
            togglePause();
        }
        return;
    }
    
    // Handle game over screen
    if (state.gameState === GAME_STATE.GAME_OVER) {
        keepFocusInsideOverlay(event, gameOverOverlay);
        return;
    }
    
    // Handle pause toggle during gameplay
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
        // Don't pause if user is typing in a text field
        if (event.target instanceof HTMLElement && 
            event.target.closest('input, textarea, [contenteditable="true"]')) {
            return;
        }
        
        event.preventDefault();
        togglePause();
        return;
    }
    
    // Only handle controls during active gameplay
    if (state.gameState !== GAME_STATE.PLAYING) return;

    // Reactor shortcuts work even when a game button has focus, but never
    // intercept digits while the player is editing a text or choice field.
    const abilityActions = {
        '1': useEnergyBlast,
        '2': activateSlowMotion,
        '3': () => useEmergencyShift(-1),
        '4': () => useEmergencyShift(1)
    };
    const abilityAction = abilityActions[event.key];
    const editingField = event.target instanceof HTMLElement &&
        event.target.closest('input, select, textarea, [contenteditable="true"]');
    if (abilityAction && !editingField && !event.repeat) {
        event.preventDefault();
        abilityAction();
        return;
    }

    // Don't handle movement controls if focus is on an interactive element.
    if (isInteractiveTarget(event.target)) return;
    
    // Handle gameplay controls
    if (event.key.toLowerCase() === 'c' && !event.repeat) {
        event.preventDefault();
        holdCurrentPiece();
        return;
    }
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            movePiece(-1, 0); // Move left
            break;
            
        case 'ArrowRight':
            event.preventDefault();
            movePiece(1, 0); // Move right
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            // Prevent repeat rotation while key is held
            if (!event.repeat) {
                rotatePiece();
            }
            break;
            
        case 'ArrowDown':
            event.preventDefault();
            softDrop(); // Move down (with points)
            break;
            
        case ' ':
            event.preventDefault();
            // Prevent repeat hard drop while key is held
            if (!event.repeat) {
                hardDrop();
            }
            break;
            
        default:
            // Ignore other keys
            break;
    }
}

// ============================================================================
// TOUCH CONTROLS
// ============================================================================

/**
 * Initialize touch control buttons
 * 
 * Sets up event listeners for on-screen touch buttons.
 */
function initializeTouchControls() {
    document.querySelectorAll('[data-touch-action]').forEach((button) => {
        button.addEventListener('click', () => {
            // Only works during active gameplay
            if (state.gameState !== GAME_STATE.PLAYING) return;
            
            // Route action based on button data attribute
            switch (button.dataset.touchAction) {
                case 'left':
                    movePiece(-1, 0);
                    break;
                    
                case 'right':
                    movePiece(1, 0);
                    break;
                    
                case 'rotate':
                    rotatePiece();
                    break;
                    
                case 'soft-drop':
                    softDrop();
                    break;
                    
                case 'hard-drop':
                    hardDrop();
                    break;

                case 'hold':
                    holdCurrentPiece();
                    break;
                    
                default:
                    break;
            }
        });
    });
}

// ============================================================================
// INPUT INITIALIZATION
// ============================================================================

/**
 * Initialize all input handlers
 * 
 * Sets up keyboard and touch controls.
 */
export function initializeInput() {
    // Listen for all keyboard input
    document.addEventListener('keydown', handleKeyboard);
    
    // Set up touch controls
    initializeTouchControls();
}
