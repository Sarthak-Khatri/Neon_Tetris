/**
 * Piece Management
 * 
 * Handles tetromino piece creation, validation, rotation, and spawning.
 * Contains all logic related to individual game pieces.
 * 
 * @module pieces
 */

'use strict';

import { TETROMINOES, TETROMINO_NAMES, BOARD_COLUMNS, BOARD_ROWS } from './constants.js';
import { nextPreview, holdPreview } from './dom-elements.js';
import * as state from './game-state.js';
import { getRoboticPartClass } from './robotic-parts.js';

// ============================================================================
// PIECE CREATION
// ============================================================================

/**
 * Create a new piece of the specified type
 * 
 * @param {string} type - The tetromino type (I, O, T, L, J, S, or Z)
 * @returns {Object} A new piece object with shape, color, and position
 */
export function createPiece(type) {
    const definition = TETROMINOES[type];
    
    return {
        type,
        // Deep copy the shape array to avoid mutations
        shape: definition.shape.map((row) => [...row]),
        colorClass: definition.colorClass,
        // Center horizontally at top of board
        x: Math.floor((BOARD_COLUMNS - definition.shape[0].length) / 2),
        y: 0
    };
}

/**
 * Get a random piece type
 * 
 * @returns {Object} A new random piece object
 */
export function getRandomPiece() {
    const randomIndex = Math.floor(Math.random() * TETROMINO_NAMES.length);
    return createPiece(TETROMINO_NAMES[randomIndex]);
}

// ============================================================================
// PIECE VALIDATION
// ============================================================================

/**
 * Check if a piece can be placed at the given position
 * 
 * Validates that all filled cells of the piece are within bounds
 * and don't collide with locked pieces on the board.
 * 
 * @param {Object} piece - The piece to validate
 * @param {number} x - The x position to check
 * @param {number} y - The y position to check
 * @param {Array} [shape] - Optional shape override (for rotation testing)
 * @returns {boolean} True if the position is valid
 */
export function isValidPosition(piece, x, y, shape = piece.shape) {
    const currentBoard = state.board;
    
    // Check each filled cell in the piece shape
    for (let rowOffset = 0; rowOffset < shape.length; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < shape[rowOffset].length; columnOffset += 1) {
            // Skip empty cells in the piece
            if (!shape[rowOffset][columnOffset]) continue;
            
            const boardRow = y + rowOffset;
            const boardColumn = x + columnOffset;
            
            // Check horizontal bounds and bottom bound
            if (boardColumn < 0 || 
                boardColumn >= BOARD_COLUMNS || 
                boardRow >= BOARD_ROWS) {
                return false;
            }
            
            // Allow pieces to extend slightly above visible board during rotation
            // But check for collisions if within visible area
            if (boardRow >= 0 && currentBoard[boardRow][boardColumn] !== null) {
                return false;
            }
        }
    }
    
    return true;
}

// ============================================================================
// PIECE ROTATION
// ============================================================================

/**
 * Rotate a matrix 90 degrees clockwise
 * 
 * Transposes the matrix and reverses each row.
 * 
 * @param {Array<Array>} matrix - The 2D array to rotate
 * @returns {Array<Array>} The rotated matrix
 */
export function rotateMatrixClockwise(matrix) {
    const rowCount = matrix.length;
    const columnCount = matrix[0].length;
    
    // Create new rotated matrix
    return Array.from({ length: columnCount }, (_, newRow) =>
        Array.from({ length: rowCount }, (_, newColumn) => 
            matrix[rowCount - 1 - newColumn][newRow]
        )
    );
}

// ============================================================================
// NEXT PIECE PREVIEW
// ============================================================================

/**
 * Draw the next piece in the preview area
 * 
 * Renders the upcoming piece in a 4x4 grid, centered.
 */
export function drawNextPiece() {
    drawPiecePreview(nextPreview, state.nextPiece, 'Next');
}

/** Draw the currently held piece, or an empty hold slot. */
export function drawHoldPiece() {
    const piece = state.heldPiece ? createPiece(state.heldPiece) : null;
    drawPiecePreview(holdPreview, piece, 'Hold');
}

function drawPiecePreview(preview, piece, label) {
    if (!preview) return;
    preview.replaceChildren();
    if (!piece) {
        for (let index = 0; index < 16; index += 1) preview.appendChild(document.createElement('span'));
        preview.setAttribute('aria-label', `${label} slot empty`);
        return;
    }
    // Preview is always 4x4 grid
    const previewSize = 4;
    const pieceHeight = piece.shape.length;
    const pieceWidth = piece.shape[0].length;
    
    // Center the piece in the preview
    const offsetRow = Math.floor((previewSize - pieceHeight) / 2);
    const offsetColumn = Math.floor((previewSize - pieceWidth) / 2);
    
    // Create 4x4 grid of cells
    for (let row = 0; row < previewSize; row += 1) {
        for (let column = 0; column < previewSize; column += 1) {
            const cell = document.createElement('span');
            
            // Calculate position relative to piece
            const pieceRow = row - offsetRow;
            const pieceColumn = column - offsetColumn;
            
            // Check if this cell should show part of the piece
            if (pieceRow >= 0 && pieceRow < pieceHeight && 
                pieceColumn >= 0 && pieceColumn < pieceWidth &&
                piece.shape[pieceRow][pieceColumn]) {
                // Add piece styling
                cell.classList.add(
                    'is-preview-piece',
                    piece.colorClass,
                    getRoboticPartClass(piece.type, piece.shape, pieceRow, pieceColumn)
                );
            }
            
            preview.appendChild(cell);
        }
    }
    
    // Update accessibility label
    preview.setAttribute('aria-label', `${label} piece: ${piece.type}`);
}
