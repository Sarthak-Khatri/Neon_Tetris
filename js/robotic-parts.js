/**
 * Visual-only robotic component assignments for the existing tetromino cells.
 * The shape matrices and all gameplay rules remain in constants.js and pieces.js.
 */
'use strict';

const COMPONENTS_BY_PIECE = {
    // I — robotic power rail
    I: ['power-cell', 'robotic-connector', 'power-cell', 'robotic-connector'],
    // O — twin-core armor
    O: ['robotic-armor-plate', 'energy-core', 'mechanical-joint', 'robotic-armor-plate'],
    // T — command module, with a brighter core at the top center
    T: ['energy-core', 'circuit-module', 'circuit-processor', 'circuit-module'],
    // L — mechanical arm
    L: ['hydraulic-module', 'mechanical-joint', 'robotic-connector', 'reinforced-chassis'],
    // J — reinforced bracket
    J: ['mechanical-joint', 'hydraulic-module', 'reinforced-chassis', 'robotic-armor-plate'],
    // S — flexible circuit assembly
    S: ['circuit-module', 'robotic-connector', 'energy-core', 'circuit-module'],
    // Z — industrial linkage
    Z: ['gear-module', 'mechanical-joint', 'robotic-connector', 'power-cell']
};

/** Return the visual asset class for one occupied local cell, if any. */
export function getRoboticPartClass(type, shape, rowOffset, columnOffset) {
    if (!shape[rowOffset]?.[columnOffset]) return '';

    let filledIndex = 0;
    for (let row = 0; row < shape.length; row += 1) {
        for (let column = 0; column < shape[row].length; column += 1) {
            if (!shape[row][column]) continue;
            if (row === rowOffset && column === columnOffset) {
                const component = COMPONENTS_BY_PIECE[type]?.[filledIndex];
                return component ? `robot-part-${component}` : '';
            }
            filledIndex += 1;
        }
    }

    return '';
}
