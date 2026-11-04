/**
 * Piece Movement and Control
 * 
 * Handles all piece movement, rotation, and dropping mechanics.
 * Includes collision detection and piece locking logic.
 * 
 * @module movement
 */

'use strict';

import { GAME_STATE, ENERGY_PER_ROW } from './constants.js';
import { gameScreen, abilityFeedback, previewNotice, levelDisplay, holdButton } from './dom-elements.js';
import * as state from './game-state.js';
import { drawBoard, clearCompletedRows, pulseActivePiece, animateRowClear } from './board.js';
import { isValidPosition, rotateMatrixClockwise, getRandomPiece, createPiece, drawNextPiece, drawHoldPiece } from './pieces.js';
import { updateScore, updateHud, addEnergy, updateDangerState, calculateLineClearPoints } from './scoring.js';
import { playSound } from './audio.js';
import { endGame } from './game-control.js';
import { startFallingTimer, stopFallingTimer } from './timing.js';
import { getRoboticPartClass } from './robotic-parts.js';
import { emitPieceLanding, emitLineClear, triggerScreenShake, triggerDropStreak, showFloatingText } from './effects.js';

let lockInProgress = false;

function replayHudAnimation(element, className) {
    if (document.documentElement.dataset.effects === 'off' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
}

// ============================================================================
// BASIC MOVEMENT
// ============================================================================

/**
 * Move the active piece by the specified offset
 * 
 * Attempts to move the piece and locks it if moving down fails.
 * 
 * @param {number} dx - Horizontal offset (-1 for left, 1 for right, 0 for none)
 * @param {number} dy - Vertical offset (1 for down, 0 for none)
 * @returns {boolean} True if the move was successful
 */
export function movePiece(dx, dy) {
    const piece = state.activePiece;
    
    // Can only move during active gameplay
    if (!piece || 
        state.activeScreen !== gameScreen || 
        state.gameState !== GAME_STATE.PLAYING) {
        return false;
    }
    
    // Calculate new position
    const nextX = piece.x + dx;
    const nextY = piece.y + dy;
    
    // Check if new position is valid
    if (isValidPosition(piece, nextX, nextY)) {
        // Move successful
        piece.x = nextX;
        piece.y = nextY;
        drawBoard();
        
        // Play move sound for horizontal movement
        if (dx !== 0) {
            playSound('move');
        }
        
        return true;
    }
    
    // If moving down failed, lock the piece
    if (dx === 0 && dy === 1) {
        lockPiece();
    }
    
    return false;
}

/**
 * Move piece down one cell (soft drop)
 * 
 * Adds 1 point for each cell dropped.
 */
export function softDrop() {
    if (movePiece(0, 1)) {
        updateScore(1);
        playSound('soft-drop');
    }
}

// ============================================================================
// ROTATION
// ============================================================================

/**
 * Rotate the active piece clockwise
 * 
 * Only rotates if the new orientation fits on the board.
 * The O piece doesn't rotate.
 */
export function rotatePiece() {
    const piece = state.activePiece;
    
    // Can't rotate if no piece, O-piece, or not playing
    if (!piece || 
        piece.type === 'O' || 
        state.gameState !== GAME_STATE.PLAYING || 
        state.activeScreen !== gameScreen) {
        return;
    }
    
    // Calculate rotated shape
    const rotatedShape = rotateMatrixClockwise(piece.shape);
    
    // Only apply rotation if it fits
    if (isValidPosition(piece, piece.x, piece.y, rotatedShape)) {
        piece.shape = rotatedShape;
        drawBoard();
        pulseActivePiece();
        playSound('rotate');
    }
}

// ============================================================================
// DROPPING
// ============================================================================

/**
 * Drop piece instantly to the bottom (hard drop)
 * 
 * Adds 2 points per cell dropped, then locks the piece immediately.
 */
export function hardDrop() {
    const piece = state.activePiece;
    
    if (!piece || 
        state.gameState !== GAME_STATE.PLAYING || 
        state.activeScreen !== gameScreen) {
        return;
    }
    
    // Count cells dropped
    let droppedCells = 0;
    
    // Move down until collision
    while (isValidPosition(piece, piece.x, piece.y + 1)) {
        piece.y += 1;
        droppedCells += 1;
    }
    
    // Add points for hard drop
    if (droppedCells > 0) {
        updateScore(droppedCells * 2);
    }
    
    playSound('drop');
    triggerDropStreak();
    if (droppedCells >= 3) triggerScreenShake(.48);
    drawBoard();
    lockPiece();
}

/** Store the current piece or swap it with the held piece, once per turn. */
export function holdCurrentPiece() {
    const current = state.activePiece;
    if (!current || state.gameState !== GAME_STATE.PLAYING || state.activeScreen !== gameScreen) return;
    if (state.holdUsedThisTurn) {
        abilityFeedback.textContent = 'Hold is available again after this piece locks.';
        return;
    }

    const previousHeld = state.heldPiece;
    const replacement = previousHeld ? createPiece(previousHeld) : null;
    if (replacement) {
        replacement.x = Math.floor((10 - replacement.shape[0].length) / 2);
        replacement.y = 0;
        if (!isValidPosition(replacement, replacement.x, replacement.y)) {
            abilityFeedback.textContent = 'Hold swap blocked: the incoming piece cannot enter the field.';
            return;
        }
    }

    state.setHeldPiece(current.type);
    state.setHoldUsedThisTurn(true);
    drawHoldPiece();
    if (holdButton) holdButton.disabled = true;
    if (replacement) {
        state.setActivePiece(replacement);
        drawBoard();
    } else {
        state.setActivePiece(null);
        spawnPiece();
        state.setHoldUsedThisTurn(true);
        if (holdButton) holdButton.disabled = true;
    }
}

// ============================================================================
// PIECE LOCKING
// ============================================================================

/**
 * Lock the active piece to the board
 * 
 * Converts the active piece into locked cells on the board,
 * clears completed rows, handles scoring, and spawns the next piece.
 */
export function lockPiece() {
    const piece = state.activePiece;
    const currentBoard = state.board;
    
    if (lockInProgress || !piece || state.gameState !== GAME_STATE.PLAYING) {
        return;
    }

    lockInProgress = true;
    stopFallingTimer();

    try {
    
    // Add each filled cell of the piece to the board
    for (let rowOffset = 0; rowOffset < piece.shape.length; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < piece.shape[rowOffset].length; columnOffset += 1) {
            if (!piece.shape[rowOffset][columnOffset]) continue;
            
            const boardRow = piece.y + rowOffset;
            const boardColumn = piece.x + columnOffset;
            
            // If piece extends above board, game over
            if (boardRow < 0) {
                state.setActivePiece(null);
                endGame();
                return;
            }
            
            // Lock the cell
            currentBoard[boardRow][boardColumn] = {
                type: piece.type,
                colorClass: piece.colorClass,
                partClass: getRoboticPartClass(piece.type, piece.shape, rowOffset, columnOffset)
            };
        }
    }

    emitPieceLanding(piece);
    playSound('piece-lock');
    
    // Check for level up
    const previousLevel = state.currentLevel;
    
    // Clear any completed rows
    const rowsForEffect = currentBoard.reduce((indexes, row, index) => {
        if (row.every((cell) => cell !== null)) indexes.push(index);
        return indexes;
    }, []);
    const clearedRows = clearCompletedRows();
    
    if (clearedRows > 0) {
        animateRowClear();
        emitLineClear(rowsForEffect);
        triggerScreenShake(clearedRows >= 4 ? .82 : .38);

        // Handle row clearing
        state.setTotalRowsCleared(state.totalRowsCleared + clearedRows);
        state.setComboCount(state.comboCount + 1);
        
        // Calculate combo bonus
        const comboBonus = state.comboCount > 1 
            ? (state.comboCount - 1) * 50 
            : 0;
        
        updateScore(calculateLineClearPoints(clearedRows, state.currentLevel, state.comboCount));
        
        // Add energy
        addEnergy(clearedRows * ENERGY_PER_ROW);
        
        // Update feedback message
        abilityFeedback.textContent = comboBonus > 0
            ? `COMBO x${state.comboCount}! +${comboBonus} bonus points. Reactor +${clearedRows * ENERGY_PER_ROW} energy.`
            : `ROW CLEAR! Reactor +${clearedRows * ENERGY_PER_ROW} energy.`;
        if (comboBonus > 0) {
            replayHudAnimation(abilityFeedback, 'is-combo-burst');
            showFloatingText(`COMBO ×${state.comboCount}`, gameScreen, '#b8a4ff');
            playSound('combo', { combo: state.comboCount });
        }
        if (state.totalRowsCleared === clearedRows) {
            showFloatingText('FIRST LINE CLEAR', gameScreen, '#a8f7ff');
            playSound('achievement');
        } else if (clearedRows > 1) {
            showFloatingText(`${clearedRows} ROW CLEAR`, gameScreen, '#a8f7ff');
        }
        
        // Calculate new level
        state.setCurrentLevel(Math.floor(state.totalRowsCleared / 10) + 1);
        
        updateHud();
        playSound('clear', { rows: clearedRows });
        
        // Play level up sound if level changed
        if (state.currentLevel !== previousLevel) {
            playSound('level');
            replayHudAnimation(levelDisplay, 'is-level-up');
            showFloatingText(`LEVEL ${state.currentLevel}`, levelDisplay, '#c3a6ff');
        }
    } else {
        // No rows cleared, reset combo
        state.setComboCount(0);
        abilityFeedback.textContent = 'Combo reset. Clear a row on the next placement to begin a new combo.';
        updateHud();
    }
    
    // Clear active piece
    state.setActivePiece(null);
    state.setHoldUsedThisTurn(false);
    
    // Update danger state and visuals
    updateDangerState();
    drawBoard();
    
    // Spawn next piece
    spawnPiece();
    
    } finally {
        // Resume exactly one fall timer after the board and next piece are ready.
        lockInProgress = false;
        startFallingTimer();
    }
}

// ============================================================================
// PIECE SPAWNING
// ============================================================================

/**
 * Spawn the next piece at the top of the board
 * 
 * @returns {boolean} True if spawn was successful, false if game over
 */
export function spawnPiece() {
    // Use next piece or create random if first spawn
    const piece = state.nextPiece || getRandomPiece();
    
    // Reset position to top center
    piece.x = Math.floor((10 - piece.shape[0].length) / 2);
    piece.y = 0;
    
    state.setActivePiece(piece);
    state.setHoldUsedThisTurn(false);
    if (holdButton) holdButton.disabled = false;
    
    // Generate new next piece
    state.setNextPiece(getRandomPiece());
    drawNextPiece();
    drawHoldPiece();
    
    // Check if piece fits (game over if blocked)
    if (!isValidPosition(piece, piece.x, piece.y)) {
        state.setActivePiece(null);
        endGame();
        return false;
    }
    
    drawBoard();
    return true;
}
