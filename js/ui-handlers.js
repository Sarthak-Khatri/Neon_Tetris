/**
 * UI Event Handlers
 * 
 * Manages button click handlers and other UI interactions.
 * Connects UI elements to game actions.
 * 
 * @module ui-handlers
 */

'use strict';

import { howScreen, settingsScreen } from './dom-elements.js';
import {
    startNewGame,
    returnToMenu,
    closePanel,
    togglePause,
    showScreen
} from './game-control.js';
import {
    useEnergyBlast,
    activateSlowMotion,
    useEmergencyShift
} from './abilities.js';

// ============================================================================
// BUTTON EVENT HANDLERS
// ============================================================================

/**
 * Initialize all UI button handlers
 * 
 * Connects buttons to their respective actions.
 */
export function initializeUIHandlers() {
    const highScoresOverlay = document.querySelector('#high-scores-overlay');
    const highScoresButton = document.querySelector('#high-scores-button');
    const closeHighScoresButton = document.querySelector('#close-high-scores-button');
    const highScoresDoneButton = document.querySelector('#high-scores-done-button');

    const closeHighScores = () => {
        if (!highScoresOverlay) return;
        highScoresOverlay.hidden = true;
        highScoresButton?.focus();
    };

    highScoresButton?.addEventListener('click', () => {
        if (!highScoresOverlay) return;
        highScoresOverlay.hidden = false;
        closeHighScoresButton?.focus();
    });
    closeHighScoresButton?.addEventListener('click', closeHighScores);
    highScoresDoneButton?.addEventListener('click', closeHighScores);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && highScoresOverlay && !highScoresOverlay.hidden) {
            event.preventDefault();
            closeHighScores();
        }
    });

    const fullscreenButton = document.querySelector('#fullscreen-button');
    if (fullscreenButton) {
        const syncFullscreenButton = () => {
            const active = Boolean(document.fullscreenElement);
            fullscreenButton.setAttribute('aria-pressed', String(active));
            fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
        };

        fullscreenButton.disabled = typeof document.documentElement.requestFullscreen !== 'function';
        document.addEventListener('fullscreenchange', syncFullscreenButton);
        fullscreenButton.addEventListener('click', () => {
            const fullscreenPromise = document.fullscreenElement
                ? document.exitFullscreen?.()
                : document.documentElement.requestFullscreen?.();
            fullscreenPromise?.catch(() => {});
        });
    }

    // ========================================================================
    // GAME START/RESTART BUTTONS
    // ========================================================================
    
    // Play button on main menu
    document.querySelector('#play-button')
        .addEventListener('click', startNewGame);
    
    // Restart button in game over overlay
    document.querySelector('#restart-button')
        .addEventListener('click', startNewGame);
    
    // Restart button in game screen footer
    document.querySelector('#restart-now-button')
        .addEventListener('click', startNewGame);
    
    // Restart button in pause overlay
    document.querySelector('#pause-restart-button')
        .addEventListener('click', startNewGame);
    
    // ========================================================================
    // MENU NAVIGATION BUTTONS
    // ========================================================================
    
    // Return to menu from pause overlay
    document.querySelector('#pause-menu-button')
        .addEventListener('click', returnToMenu);
    
    // Return to menu from game over overlay
    document.querySelector('#gameover-menu-button')
        .addEventListener('click', returnToMenu);
    
    // Return button in game screen header
    document.querySelector('#return-button')
        .addEventListener('click', returnToMenu);
    
    // Menu button in game screen footer
    document.querySelector('#menu-button')
        .addEventListener('click', returnToMenu);
    
    // ========================================================================
    // PAUSE/RESUME BUTTONS
    // ========================================================================
    
    // Resume button in pause overlay
    document.querySelector('#resume-button')
        .addEventListener('click', togglePause);
    
    // Pause button in game stats panel
    document.querySelector('#pause-button')
        .addEventListener('click', togglePause);
    
    // ========================================================================
    // PANEL NAVIGATION BUTTONS
    // ========================================================================
    
    // How to play button
    document.querySelector('#how-button')
        .addEventListener('click', () => {
            showScreen(howScreen, howScreen.querySelector('.panel-close'));
        });
    
    // Settings button
    document.querySelector('#settings-button')
        .addEventListener('click', () => {
            showScreen(settingsScreen, settingsScreen.querySelector('.panel-close'));
        });
    
    // All panel close buttons
    document.querySelectorAll('[data-close-panel]').forEach((button) => {
        button.addEventListener('click', closePanel);
    });
    
    // ========================================================================
    // ABILITY BUTTONS
    // ========================================================================
    
    // Energy Blast ability
    document.querySelector('#energy-blast-button')
        .addEventListener('click', useEnergyBlast);
    
    // Slow Motion ability
    document.querySelector('#slow-motion-button')
        .addEventListener('click', activateSlowMotion);
    
    // Emergency Shift Left ability
    document.querySelector('#shift-left-button')
        .addEventListener('click', () => useEmergencyShift(-1));
    
    // Emergency Shift Right ability
    document.querySelector('#shift-right-button')
        .addEventListener('click', () => useEmergencyShift(1));
}
