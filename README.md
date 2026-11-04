# NEON DROP — The Gravity Challenge

NEON DROP is a browser-based falling-block arcade game served by core PHP. It uses modular vanilla JavaScript for gameplay and CSS for the cyberpunk interface. The project keeps scores and display preferences in the current browser only.

## Features

- 10 × 20 playfield, seven tetrominoes, next-piece preview, keyboard and touch input.
- Portrait arcade menu with multicolor neon lettering, radiant light beams, and outlined tetromino artwork.
- Cryo Glass Robotics Bay theme: dark robotics-lab atmosphere, translucent icy highlights, silver/cyan frames, and a three-column desktop game layout.
- A dedicated Cryo Glass robotics-lab background image frames the real interface without duplicating the concept mockup's HUD.
- The 10 × 20 board keeps its original dimensions and uses a 1:2 grid aspect ratio so the cells render square.
- Ten transparent robotic-part images with pale glass reflections and thin crystal edges; cell art stays inside its existing grid cells, and the Next Piece preview sits with reactor abilities in a side stack.
- Cyan core and coupling pulses while active pieces fall.
- Restrained gameplay feedback: rotation pulse, metallic landing impact, row-clear energy sweep, combo pulse, and level-up flash. Motion follows the visual-effects setting and reduced-motion preference.
- Row clearing, score, level progression, combo count, danger indicator, and local best score.
- Energy Reactor abilities: Energy Blast (60), Slow Motion (40 for five seconds), and Emergency Shift (20).
- Pause/resume, restart, instructions, sound toggle, visual-effects toggle, and three color themes.
- PHP feedback form with server-side validation. Feedback is displayed for the response and is not saved or sent.

## Technology

- HTML5 rendered by PHP 8 or newer.
- CSS3, custom properties, and responsive media queries.
- Vanilla JavaScript ES modules; no build step or JavaScript package manager is needed.
- Browser `localStorage` for best score, sound, theme, and visual-effects preference.
- Optional Google Fonts (Orbitron and Rajdhani). System font fallbacks remain available offline.

## Project structure

```text
index.php                 Entry point; redirects to the interactive game menu
game.php                  Menu, playfield, HUD, instructions, settings, and overlays; preview/reactor controls share the right-side game stack
menu.php                  Backward-compatible redirect to game.php
feedback.php              Validated, non-persistent feedback form
includes/config.php       Site titles, metadata defaults, assets, and response headers
includes/functions.php    HTML escaping, response headers, and shared rendering helpers
includes/header.php       Shared document head and page shell
includes/footer.php       Shared closing shell and footer
css/style.css             Theme, components, board styling, and responsive layouts
js/main.js                JavaScript module entry point
js/constants.js           Board, scoring, timing, and tetromino definitions
js/game-state.js          Shared mutable game state
js/game-control.js        Screen/game lifecycle, pause, restart, and game over
js/board.js               Board creation, drawing, row clearing, and danger calculation
js/pieces.js              Tetromino selection and preview
js/robotic-parts.js       Visual-only component mapping for occupied piece cells
js/movement.js            Movement, collision, rotation, and locking
js/scoring.js             Score, energy, best-score persistence, and HUD values
js/abilities.js           Energy Reactor actions and Slow Motion timer
js/timing.js              Single falling interval management
js/input.js               Keyboard and touch controls
js/ui-handlers.js         Button event wiring
js/audio.js               Optional synthesized sound
js/preferences.js         Validated local theme and effects preferences
script.js                 Older standalone implementation, currently not loaded
assets/images/cryo-glass-laboratory-background.png  Dedicated full-page robotics-lab backdrop
assets/images/cryo-glass-robotics-bay.png  Approved gameplay concept preview
assets/images/robotic-parts/  Ten generated transparent PNG components, 256 × 256
assets/icons/              Icon asset folder
assets/audio/              Audio asset folder
```

## Requirements and startup

Install PHP 8 or newer and run the built-in server from this folder:

```powershell
php -S localhost:8000
```

Open [http://localhost:8000](http://localhost:8000). The root entry redirects to the in-game main menu. Stop the server with `Ctrl+C`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move left/right | Left/Right arrows | Left/Right buttons |
| Rotate | Up arrow | Rotate button |
| Soft drop | Down arrow | Down button |
| Hard drop | Space | Hard Drop button |
| Pause/resume | P or Escape | Pause button |

## Energy Reactor

- **Energy Blast:** costs 60 energy and removes the bottom occupied row, moving the rest down. An empty bottom row does not spend energy. It gives no regular clear points or energy.
- **Slow Motion:** costs 40 energy and halves falling speed for five seconds. Its countdown pauses while the game is paused.
- **Emergency Shift:** costs 20 energy and moves the current block one extra cell left or right if that position is valid.
- Normal row clears add 15 energy per row, up to 100.

## Browser storage and dependencies

The game uses `neonDropBestScore` for best score, `neonDropSoundEnabled` for sound, `neonDropEffectsEnabled` for optional interface motion, and `neonDropTheme` for theme selection. Values are validated or defaulted; blocked storage does not stop the game. No player account, server score, database, or feedback persistence is used.

The Google Fonts request requires internet access. The game does not depend on it and uses system fallbacks when offline. There are no other external libraries.

## Robotic part rendering

Each filled tetromino cell keeps the same board coordinate and piece color class. `js/robotic-parts.js` assigns one PNG to the cell as a CSS class, and CSS renders it as a centered background. Transparent pixels reveal the existing piece color beneath them. The same mapping appears in the 4 × 4 next-piece preview. Images are visual only; they do not affect movement, rotation, collision, or scoring.

## Testing

See [TESTING.md](TESTING.md) for verification statuses and the manual checklist. Core JavaScript syntax and PHP routes can be checked locally; gameplay still needs interactive browser checks for each mechanic.

## Known limitations

- Best score is local to one browser profile/device and can be cleared with browser storage.
- Feedback is validated and displayed only; it is not retained or transmitted.
- Sound is synthesized through Web Audio and may be unavailable in browsers without Web Audio support.
- Only the ten core robotic-part images are included; optional special components from the art brief were not generated.
- GitHub Pages does not execute PHP. Use a PHP-compatible host to run the complete PHP version online.

## GitHub publication

Commit the PHP, CSS, JavaScript, documentation, and placeholder asset folders. Do not publish private information in feedback examples or local browser data. For a live version, use PHP-compatible hosting; GitHub Pages can host a separate static adaptation, but it cannot run this project's PHP entry points or feedback handler.
