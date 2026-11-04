/**
 * Board Management
 * 
 * Handles game board creation, rendering, and cell manipulation.
 * Manages the visual representation of the game state.
 * 
 * @module board
 */

'use strict';

import { BOARD_COLUMNS, BOARD_ROWS } from './constants.js';
import { boardGrid } from './dom-elements.js';
import * as state from './game-state.js';
import { getRoboticPartClass } from './robotic-parts.js';
import { isValidPosition } from './pieces.js';

const lockingCells = new WeakSet();

function canAnimateGameEffects() {
    return document.documentElement.dataset.effects !== 'off' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function playLockImpact(cell) {
    if (!canAnimateGameEffects() || lockingCells.has(cell)) return;

    lockingCells.add(cell);
    const finishImpact = () => {
        lockingCells.delete(cell);
        cell.classList.remove('is-locking');
        cell.removeEventListener('animationend', finishImpact);
        cell.removeEventListener('animationcancel', finishImpact);
    };

    cell.addEventListener('animationend', finishImpact);
    cell.addEventListener('animationcancel', finishImpact);
    cell.classList.add('is-locking');
}

// ============================================================================
// BOARD INITIALIZATION
// ============================================================================

/**
 * Create a new empty game board
 * 
 * Creates a 2D array filled with null values representing empty cells.
 * 
 * @returns {Array<Array<null>>} A new empty board
 */
export function createBoard() {
    return Array.from({ length: BOARD_ROWS }, () => 
        Array(BOARD_COLUMNS).fill(null)
    );
}

/**
 * Create DOM elements for all board cells
 * 
 * Generates the grid of span elements that represent the visual board.
 * Called once during initialization.
 */
export function createBoardCells() {
    // Clear any existing cells
    boardGrid.replaceChildren();
    
    // Create cells for each position (row * column)
    const totalCells = BOARD_COLUMNS * BOARD_ROWS;
    for (let cellNumber = 0; cellNumber < totalCells; cellNumber += 1) {
        const cell = document.createElement('span');
        cell.className = 'board-cell';
        boardGrid.appendChild(cell);
    }
}

// ============================================================================
// BOARD RENDERING
// ============================================================================

/**
 * Draw the current board state
 * 
 * Updates all board cells to reflect locked pieces and the active piece.
 * This is the main rendering function called after every state change.
 */
export function drawBoard() {
    const cells = boardGrid.children;
    const currentBoard = state.board;
    const piece = state.activePiece;
    
    // First, render all locked pieces
    for (let row = 0; row < BOARD_ROWS; row += 1) {
        for (let column = 0; column < BOARD_COLUMNS; column += 1) {
            const cellIndex = row * BOARD_COLUMNS + column;
            const cell = cells[cellIndex];
            const lockedCell = currentBoard[row][column];
            const wasActive = cell.classList.contains('is-active');
            
            // Reset cell classes
            cell.className = 'board-cell';
            
            // Add locked piece styling if cell is occupied
            if (lockedCell) {
                cell.classList.add('is-occupied', lockedCell.colorClass);
                if (lockedCell.partClass) cell.classList.add(lockedCell.partClass);
                if (wasActive) {
                    playLockImpact(cell);
                } else if (lockingCells.has(cell)) {
                    cell.classList.add('is-locking');
                }
            }
        }
    }
    
    // If no active piece, we're done
    if (!piece) return;
    
    // Render a subtle landing guide before the active piece.
    let ghostY = piece.y;
    while (isValidPosition(piece, piece.x, ghostY + 1)) ghostY += 1;
    if (document.documentElement.dataset.ghost !== 'off' && ghostY !== piece.y) {
        piece.shape.forEach((pieceRow, rowOffset) => pieceRow.forEach((isFilled, columnOffset) => {
            if (!isFilled) return;
            const row = ghostY + rowOffset;
            const column = piece.x + columnOffset;
            if (row >= 0 && row < BOARD_ROWS && column >= 0 && column < BOARD_COLUMNS) {
                cells[row * BOARD_COLUMNS + column].classList.add('is-ghost');
            }
        }));
    }

    // Render the active (falling) piece
    piece.shape.forEach((pieceRow, rowOffset) => {
        pieceRow.forEach((isFilled, columnOffset) => {
            // Skip empty cells in the piece shape
            if (!isFilled) return;
            
            // Calculate board position
            const boardRow = piece.y + rowOffset;
            const boardColumn = piece.x + columnOffset;
            
            // Skip if out of bounds
            if (boardRow < 0 || boardRow >= BOARD_ROWS || 
                boardColumn < 0 || boardColumn >= BOARD_COLUMNS) {
                return;
            }
            
            // Add active piece styling
            const cellIndex = boardRow * BOARD_COLUMNS + boardColumn;
            cells[cellIndex].classList.add(
                'is-active',
                piece.colorClass,
                getRoboticPartClass(piece.type, piece.shape, rowOffset, columnOffset)
            );
        });
    });
}

/** Replay a short cue on the active cells after a successful rotation. */
export function pulseActivePiece() {
    if (!canAnimateGameEffects()) return;

    boardGrid.querySelectorAll('.board-cell.is-active').forEach((cell) => {
        cell.classList.remove('is-rotating');
        void cell.offsetWidth;
        cell.classList.add('is-rotating');
    });
}

/** Show a short energy sweep after rows have been removed from the game state. */
export function animateRowClear() {
    if (!canAnimateGameEffects()) return;

    boardGrid.classList.remove('is-row-clearing');
    void boardGrid.offsetWidth;
    boardGrid.classList.add('is-row-clearing');
}

// ============================================================================
// ROW CLEARING
// ============================================================================

/**
 * Clear completed rows from the board
 * 
 * Identifies rows that are completely filled, removes them,
 * and adds new empty rows at the top.
 * 
 * @returns {number} Number of rows cleared
 */
export function clearCompletedRows() {
    const currentBoard = state.board;
    
    // Keep only incomplete rows (rows with at least one empty cell)
    const remainingRows = currentBoard.filter((row) => 
        row.some((cell) => cell === null)
    );
    
    // Calculate how many rows were cleared
    const clearedCount = BOARD_ROWS - remainingRows.length;
    
    // If no rows were cleared, return early
    if (clearedCount === 0) {
        return 0;
    }
    
    // Add new empty rows at the top to maintain board height
    while (remainingRows.length < BOARD_ROWS) {
        remainingRows.unshift(Array(BOARD_COLUMNS).fill(null));
    }
    
    // Update the board state
    state.setBoard(remainingRows);
    
    return clearedCount;
}

// ============================================================================
// DANGER STATE CALCULATION
// ============================================================================

/**
 * Calculate the current stack danger level
 * 
 * Measures how high the stack has grown from the bottom.
 * Returns one of three states: stable, warning, or critical.
 * 
 * @returns {string} The danger state: 'stable', 'warning', or 'critical'
 */
export function calculateDangerState() {
    const currentBoard = state.board;
    
    // Find the topmost row with any occupied cell
    const topOccupiedRow = currentBoard.findIndex((row) => 
        row.some((cell) => cell !== null)
    );
    
    // If no occupied cells, stack height is 0
    const stackHeight = topOccupiedRow === -1 
        ? 0 
        : BOARD_ROWS - topOccupiedRow;
    
    // Determine danger state based on stack height
    if (stackHeight >= 15) {
        return 'critical';
    } else if (stackHeight >= 10) {
        return 'warning';
    } else {
        return 'stable';
    }
}
