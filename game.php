<?php
require_once __DIR__ . '/includes/functions.php';
sendConfiguredHeaders($siteConfig['responseHeaders']);

// This page only serves the game shell; it does not process form submissions.
$requestMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($requestMethod, ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD', true);
    exit('Method not allowed.');
}

$menuActions = [
    ['id' => 'play-button', 'label' => 'PLAY GAME', 'class' => 'button button-primary', 'arrow' => true],
    ['id' => 'how-button', 'label' => 'HOW TO PLAY', 'description' => 'LEARN THE BASICS', 'icon' => '▤', 'class' => 'button button-secondary'],
    ['id' => 'settings-button', 'label' => 'SETTINGS', 'description' => 'AUDIO, GRAPHICS, CONTROLS', 'icon' => '⚙', 'class' => 'button button-secondary'],
    ['id' => 'high-scores-button', 'label' => 'HIGH SCORES', 'description' => 'YOUR BEST RECORDS', 'icon' => '🏆', 'class' => 'button button-secondary'],
    ['id' => 'feedback-button', 'href' => 'feedback.php', 'label' => 'FEEDBACK', 'description' => 'SEND US YOUR SUGGESTION', 'icon' => '✉', 'class' => 'button button-secondary']
];

$quickControls = [
    ['label' => 'MOVE', 'keys' => ['←', '→']],
    ['label' => 'ROTATE', 'keys' => ['↑']],
    ['label' => 'DROP', 'keys' => ['SPACE']]
];

require __DIR__ . '/includes/header.php';
?>
        <section class="screen menu-screen is-active" id="menu-screen" aria-labelledby="game-title">
            <div class="menu-utilities" aria-label="Display controls">
                <button class="menu-utility-button" id="fullscreen-button" type="button" aria-label="Enter fullscreen" aria-pressed="false">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M4 4l6 6m10-6-6 6M4 20l6-6m10 6-6-6"/></svg>
                </button>
            </div>
            <svg class="menu-art" viewBox="0 0 600 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <g class="tetra-outline tetra-cyan"><rect x="24" y="20" width="38" height="38"/><rect x="24" y="62" width="38" height="38"/><rect x="24" y="104" width="38" height="38"/><rect x="66" y="104" width="38" height="38"/></g>
                <g class="tetra-outline tetra-cyan"><rect x="205" y="12" width="38" height="38"/><rect x="247" y="12" width="38" height="38"/><rect x="289" y="12" width="38" height="38"/><rect x="331" y="12" width="38" height="38"/></g>
                <g class="tetra-outline tetra-purple"><rect x="478" y="18" width="38" height="38"/><rect x="436" y="60" width="38" height="38"/><rect x="478" y="60" width="38" height="38"/><rect x="520" y="60" width="38" height="38"/></g>
                <g class="tetra-outline tetra-green"><rect x="22" y="242" width="38" height="38"/><rect x="22" y="284" width="38" height="38"/><rect x="64" y="284" width="38" height="38"/><rect x="64" y="326" width="38" height="38"/></g>
                <g class="tetra-outline tetra-yellow"><rect x="514" y="228" width="38" height="38"/><rect x="556" y="228" width="38" height="38"/><rect x="514" y="270" width="38" height="38"/><rect x="556" y="270" width="38" height="38"/></g>
                <g class="tetra-outline tetra-orange"><rect x="466" y="402" width="38" height="38"/><rect x="508" y="402" width="38" height="38"/><rect x="550" y="402" width="38" height="38"/><rect x="550" y="444" width="38" height="38"/></g>
                <g class="tetra-outline tetra-magenta"><rect x="12" y="484" width="38" height="38"/><rect x="54" y="484" width="38" height="38"/><rect x="96" y="484" width="38" height="38"/><rect x="138" y="484" width="38" height="38"/><rect x="96" y="526" width="38" height="38"/></g>
                <g class="tetra-outline tetra-green"><rect x="340" y="584" width="38" height="38"/><rect x="382" y="584" width="38" height="38"/><rect x="298" y="626" width="38" height="38"/><rect x="340" y="626" width="38" height="38"/></g>
                <g class="tetra-outline tetra-yellow"><rect x="42" y="684" width="38" height="38"/><rect x="84" y="684" width="38" height="38"/><rect x="42" y="726" width="38" height="38"/><rect x="84" y="726" width="38" height="38"/></g>
                <g class="tetra-outline tetra-cyan"><rect x="394" y="650" width="38" height="38"/><rect x="394" y="692" width="38" height="38"/><rect x="394" y="734" width="38" height="38"/><rect x="436" y="734" width="38" height="38"/><rect x="478" y="734" width="38" height="38"/></g>
                <g class="tetra-outline tetra-magenta"><rect x="492" y="566" width="38" height="38"/><rect x="534" y="566" width="38" height="38"/><rect x="534" y="608" width="38" height="38"/><rect x="576" y="608" width="20" height="38"/></g>
            </svg>
            <div class="menu-layout">
                <div class="hero-copy">
                    <p class="eyebrow"><span class="pulse-dot"></span> ARCADE SYSTEM // READY</p>
                    <h1 id="game-title">NEON <span>DROP</span></h1>
                    <p class="subtitle">THE GRAVITY CHALLENGE</p>
                    <p class="description">Control gravity. Master the blocks. Beat your best.</p>
                    <nav class="menu-actions" aria-label="Main menu">
                        <button class="button button-primary play-button" id="play-button" type="button">
                            <span class="play-core" aria-hidden="true"><span class="play-triangle"></span></span>
                            <span class="play-label">PLAY<small>START THE GAME</small></span>
                        </button>
                        <?php foreach (array_slice($menuActions, 1) as $action): ?>
                            <?php renderMenuAction($action); ?>
                        <?php endforeach; ?>
                    </nav>
                </div>
            </div>
            <div class="menu-callout menu-callout-left"><span aria-hidden="true">✧</span><p><strong>BUILD COMBOS</strong><br>ACTIVATE THE REACTOR</p></div>
            <div class="menu-callout menu-callout-right"><span aria-hidden="true">⚙</span><p><strong>DROP SMARTER</strong><br>REACH NEW HEIGHTS</p></div>
            <div class="state-overlay menu-score-overlay" id="high-scores-overlay" role="dialog" aria-modal="true" aria-labelledby="high-scores-title" hidden>
                <div class="state-card menu-score-card">
                    <button class="icon-button menu-score-close" id="close-high-scores-button" type="button" aria-label="Close high scores">✕</button>
                    <p class="eyebrow">PILOT RECORDS // LOCAL</p>
                    <h2 id="high-scores-title">HIGH <span>SCORES</span></h2>
                    <p class="record-label">PERSONAL BEST</p>
                    <p class="best-score"><span id="best-score">0</span><small>PTS</small></p>
                    <p class="card-footnote">BEST RUN · THIS DEVICE</p>
                    <button class="button button-primary menu-score-done" id="high-scores-done-button" type="button">BACK TO MENU</button>
                </div>
            </div>
        </section>

        <section class="screen game-screen" id="game-screen" aria-labelledby="game-screen-title" hidden>
            <div class="screen-heading">
                <div><p class="eyebrow">CRYO GLASS // ROBOTICS BAY</p><h2 id="game-screen-title">NEON <span>DROP</span></h2></div>
                <button class="icon-button" id="return-button" type="button" aria-label="Return to main menu">✕</button>
            </div>
            <p class="preview-notice" id="preview-notice" role="status" aria-live="polite">Use the arrow keys to move and rotate. Space hard-drops the piece.</p>
            <div class="state-overlay" id="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" hidden>
                <div class="state-card glass-panel">
                    <p class="eyebrow">SESSION ON HOLD</p>
                    <h2 id="pause-title">GAME <span>PAUSED</span></h2>
                    <p>Your board and progress are saved for this run.</p>
                    <div class="state-actions">
                        <button class="button button-primary" id="resume-button" type="button">RESUME</button>
                        <button class="button button-secondary" id="pause-restart-button" type="button">RESTART RUN</button>
                        <button class="button button-secondary" id="pause-menu-button" type="button">RETURN TO MAIN MENU</button>
                    </div>
                </div>
            </div>
            <div class="state-overlay" id="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title" hidden>
                <div class="state-card glass-panel">
                    <p class="eyebrow">SESSION COMPLETE</p>
                    <h2 id="game-over-title">GAME <span>OVER</span></h2>
                    <p>The next piece could not fit on the board.</p>
                    <p class="new-record-badge" id="new-record-badge" role="status" hidden>✦ NEW HIGH SCORE · RECORD SET ✦</p>
                    <div class="final-scores"><span>FINAL SCORE <strong id="final-score-display">0</strong></span><span>BEST SCORE <strong id="final-best-display">0</strong></span></div>
                    <div class="state-actions">
                        <button class="button button-primary" id="restart-button" type="button">PLAY AGAIN</button>
                        <button class="button button-secondary" id="gameover-menu-button" type="button">RETURN TO MAIN MENU</button>
                    </div>
                </div>
            </div>
            <div class="game-layout">
                <aside class="game-stats glass-panel">
                    <div class="stat-block"><span class="stat-label">SCORE</span><strong id="score-display">000000</strong></div>
                    <div class="stat-block"><span class="stat-label">BEST SCORE</span><strong id="game-best-score">0</strong></div>
                    <div class="stat-block"><span class="stat-label">LEVEL</span><strong id="level-display">01</strong></div>
                    <div class="stat-block"><span class="stat-label">ROWS CLEARED</span><strong id="rows-display">0</strong></div>
                    <div class="stat-block energy-stat"><span class="stat-label">ENERGY REACTOR</span><div class="energy-track" id="energy-track" role="progressbar" aria-label="Energy Reactor" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="energy-fill"></span></div><small id="energy-value">0 / 100</small></div>
                    <div class="stat-block"><span class="stat-label">COMBO</span><strong id="combo-display">0</strong></div>
                    <div class="stat-block"><span class="stat-label">STACK DANGER</span><strong class="danger-indicator is-stable" id="danger-indicator" aria-live="polite">STABLE</strong></div>
                    <button class="button button-secondary pause-button" id="pause-button" type="button" aria-pressed="false">PAUSE</button>
                </aside>
                <div class="board-frame" id="board-frame" tabindex="0" aria-label="10 column by 20 row game board. Use arrow keys to control the active piece.">
                    <div class="board-grid" id="board-grid" aria-hidden="true"></div>
                </div>
                <div class="game-side-stack">
                    <aside class="next-card glass-panel">
                        <div class="piece-preview-pair">
                            <div class="piece-preview-slot"><p class="card-label">NEXT</p><div class="next-preview" id="next-preview" role="img" aria-label="Next piece"></div></div>
                            <div class="piece-preview-slot"><p class="card-label">HOLD</p><div class="next-preview hold-preview" id="hold-preview" role="img" aria-label="Hold slot empty"></div><button class="button button-secondary hold-button" id="hold-button" type="button" data-touch-action="hold" aria-label="Hold piece, C key" disabled>HOLD <kbd>C</kbd></button></div>
                        </div>
                        <p class="placeholder-label">PLAN YOUR NEXT DROP</p>
                    </aside>
                    <section class="ability-panel glass-panel" aria-label="Energy Reactor abilities">
                        <p class="card-label">REACTOR ABILITIES</p>
                        <div class="reactor-visual is-charging" id="reactor-visual" aria-hidden="true" style="--reactor-charge: 0%">
                            <div class="reactor-ring"><div class="reactor-core"><svg viewBox="0 0 24 24"><path d="M13.2 2.5 5.7 13h5l-.4 8.5L18.3 10h-5.1z"/></svg></div></div>
                            <div class="reactor-readout"><strong id="reactor-state">CHARGING</strong><small>15 ENERGY / ROW</small></div>
                        </div>
                        <div class="ability-buttons">
                            <button class="button button-ability" id="energy-blast-button" type="button" aria-label="Energy Blast, costs 60 energy"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M13.2 2.5 5.7 13h5l-.4 8.5L18.3 10h-5.1z"/></svg><span>ENERGY BLAST</span><small>60 ENERGY</small></button>
                            <button class="button button-ability" id="slow-motion-button" type="button" aria-label="Slow Motion, costs 40 energy"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 4c0 4 5 5 5 8s-5 4-5 8m10-16c0 4-5 5-5 8s5 4 5 8"/></svg><span>SLOW MOTION</span><small>40 ENERGY · 5 SECONDS</small></button>
                            <button class="button button-ability" id="shift-left-button" type="button" aria-label="Emergency Shift Left, costs 20 energy"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5H4m0 0 4-4M4 5l4 4m4 6h8m0 0-4-4m4 4-4 4"/></svg><span>SHIFT LEFT</span><small>20 ENERGY</small></button>
                            <button class="button button-ability" id="shift-right-button" type="button" aria-label="Emergency Shift Right, costs 20 energy"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5h8m0 0-4-4m4 4-4 4m4 6H4m0 0 4-4m-4 4 4 4"/></svg><span>SHIFT RIGHT</span><small>20 ENERGY</small></button>
                        </div>
                        <p class="ability-feedback" id="ability-feedback" role="status" aria-live="polite">Clear rows to charge the reactor.</p>
                    </section>
                </div>
            </div>
            <div class="touch-controls" aria-label="Touch game controls">
                <button class="touch-button" type="button" data-touch-action="left" aria-label="Move left">◀<span>LEFT</span></button>
                <button class="touch-button" type="button" data-touch-action="rotate" aria-label="Rotate piece">↻<span>ROTATE</span></button>
                <button class="touch-button" type="button" data-touch-action="soft-drop" aria-label="Soft drop">▼<span>DOWN</span></button>
                <button class="touch-button" type="button" data-touch-action="right" aria-label="Move right">▶<span>RIGHT</span></button>
                <button class="touch-button touch-button-hard" type="button" data-touch-action="hard-drop" aria-label="Hard drop">⬇<span>HARD DROP</span></button>
            </div>
            <div class="game-footer"><span>10 × 20 FIELD // PHASE 07</span><div><button class="text-button" id="restart-now-button" type="button">RESTART RUN</button><button class="text-button" id="menu-button" type="button">← RETURN TO MENU</button></div></div>
        </section>

        <section class="screen info-screen" id="how-screen" aria-labelledby="how-title" hidden>
            <div class="panel-window glass-panel">
                <button class="icon-button panel-close" data-close-panel type="button" aria-label="Close instructions">✕</button>
                <p class="eyebrow">PILOT BRIEFING // 01</p>
                <h2 id="how-title">HOW TO <span>PLAY</span></h2>
                <p class="panel-intro">Use keyboard or touch controls to guide each falling block. On touch screens, tap the on-screen controls; press 1–4 or use the Reactor buttons for power-ups.</p>
                <ul class="instruction-list">
                    <li><span>Move blocks</span><kbd>←</kbd><kbd>→</kbd></li>
                    <li><span>Rotate</span><kbd>↑</kbd></li>
                    <li><span>Soft drop</span><kbd>↓</kbd></li>
                    <li><span>Hard drop</span><kbd>SPACE</kbd></li>
                    <li><span>Hold / swap piece (once per piece)</span><kbd>C</kbd></li>
                    <li><span>Pause</span><kbd>P</kbd><span class="or-label">or</span><kbd>ESC</kbd></li>
                </ul>
                <h3 class="guide-heading">REACTOR POWER-UPS</h3>
                <div class="power-up-guide">
                    <article><span class="guide-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M13.2 2.5 5.7 13h5l-.4 8.5L18.3 10h-5.1z"/></svg></span><div><strong>1 · Energy Blast · 60 energy</strong><p>Clears the bottom row and lifts the stack by one row. Use it to make breathing room.</p></div></article>
                    <article><span class="guide-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 4c0 4 5 5 5 8s-5 4-5 8m10-16c0 4-5 5-5 8s5 4 5 8"/></svg></span><div><strong>2 · Slow Motion · 40 energy</strong><p>Halves the fall speed for five seconds so you can line up a placement.</p></div></article>
                    <article><span class="guide-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5H4m0 0 4-4M4 5l4 4m4 6h8m0 0-4-4m4 4-4 4"/></svg></span><div><strong>3 · Emergency Shift Left · 20 energy</strong><p>Moves the active piece one cell left. A blocked shift costs no energy.</p></div></article>
                    <article><span class="guide-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5h8m0 0-4-4m4 4-4 4m4 6H4m0 0 4-4m-4 4 4 4"/></svg></span><div><strong>4 · Emergency Shift Right · 20 energy</strong><p>Moves the active piece one cell right. A blocked shift costs no energy.</p></div></article>
                </div>
                <p class="panel-note">Charge the Reactor by clearing rows (+15 energy per row, up to 100). Clear rows on consecutive placements to build a combo. Hard drops score 2 points per cell; every 10 cleared rows raises your level. The ghost outline marks where your piece will land. Hold stores one piece and can be used again after the current piece locks.</p>
                <button class="button button-primary panel-done" data-close-panel type="button">GOT IT</button>
            </div>
        </section>

        <section class="screen info-screen" id="settings-screen" aria-labelledby="settings-title" hidden>
            <div class="panel-window glass-panel settings-window">
                <button class="icon-button panel-close" data-close-panel type="button" aria-label="Close settings">✕</button>
                <p class="eyebrow">SYSTEM CONFIGURATION</p>
                <h2 id="settings-title">SETTINGS</h2>
                <div class="setting-row">
                    <div><strong>Sound effects</strong><p>Short synthesized game sounds. Off by default; enable after opening the game.</p></div>
                    <label class="toggle"><input id="sound-toggle" type="checkbox" aria-label="Sound on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Background music</strong><p>Procedural ambient menu, gameplay and reactor-overload music. Starts after your first interaction.</p></div>
                    <label class="toggle"><input id="music-toggle" type="checkbox" aria-label="Background music on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Global mute</strong><p>Mute both music and sound effects.</p></div>
                    <label class="toggle"><input id="master-mute-toggle" type="checkbox" aria-label="Mute all audio"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Reactor sounds</strong><p>Enable special energy charge and activation cues.</p></div>
                    <label class="toggle"><input id="reactor-sound-toggle" type="checkbox" aria-label="Reactor sounds on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row setting-volume"><label for="master-volume"><strong>Master volume</strong><p>Overall output level.</p></label><input id="master-volume" type="range" min="0" max="100" value="72" aria-label="Master volume"><output id="master-volume-value" for="master-volume">72%</output></div>
                <div class="setting-row setting-volume"><label for="music-volume"><strong>Music volume</strong><p>Background soundtrack level.</p></label><input id="music-volume" type="range" min="0" max="100" value="32" aria-label="Music volume"><output id="music-volume-value" for="music-volume">32%</output></div>
                <div class="setting-row setting-volume"><label for="sfx-volume"><strong>Effects volume</strong><p>Interface and gameplay sound effects.</p></label><input id="sfx-volume" type="range" min="0" max="100" value="58" aria-label="Effects volume"><output id="sfx-volume-value" for="sfx-volume">58%</output></div>
                <div class="setting-row">
                    <div><strong>Visual effects</strong><p>Control ambient movement and interface animations.</p></div>
                    <label class="toggle"><input id="effects-toggle" type="checkbox" aria-label="Visual effects on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Animation intensity</strong><p>Choose the visual motion level. System reduced-motion settings take priority.</p></div>
                    <select id="animation-intensity-select" class="theme-select" aria-label="Animation intensity"><option value="off">Off</option><option value="reduced">Reduced</option><option value="cinematic">Cinematic</option></select>
                </div>
                <div class="setting-row">
                    <div><strong>Particle effects</strong><p>Small landing, line-clear and reactor sparks.</p></div>
                    <label class="toggle"><input id="particles-toggle" type="checkbox" aria-label="Particle effects on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Screen shake</strong><p>Brief, restrained movement on major impacts.</p></div>
                    <label class="toggle"><input id="shake-toggle" type="checkbox" aria-label="Screen shake on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Background effects</strong><p>Show ambient light and menu backdrop motion.</p></div>
                    <label class="toggle"><input id="background-effects-toggle" type="checkbox" aria-label="Background effects on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Ghost piece</strong><p>Show the exact landing outline before you drop.</p></div>
                    <label class="toggle"><input id="ghost-toggle" type="checkbox" aria-label="Ghost piece on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Reactor animation</strong><p>Animate the reactor as energy charges and abilities fire.</p></div>
                    <label class="toggle"><input id="reactor-effects-toggle" type="checkbox" aria-label="Reactor effects on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row">
                    <div><strong>Cursor energy trail</strong><p>Show a subtle particle trail while using a mouse or trackpad.</p></div>
                    <label class="toggle"><input id="cursor-trail-toggle" type="checkbox" aria-label="Cursor energy trail on"><span class="toggle-track"></span></label>
                </div>
                <div class="setting-row theme-setting">
                    <div><label for="theme-select"><strong>Arcade theme</strong></label><p>Choose the accent colors used across the game.</p></div>
                    <select id="theme-select" class="theme-select" aria-label="Arcade theme">
                        <option value="cyber">Cyber Cyan</option>
                        <option value="violet">Violet Pulse</option>
                        <option value="toxic">Toxic Green</option>
                    </select>
                </div>
                <div class="setting-row reduced-setting">
                    <div><strong>Reduced motion</strong><p>Use your device’s reduced-motion accessibility setting to limit animation.</p></div>
                    <span class="setting-tag">SYSTEM</span>
                </div>
                <button class="button button-primary panel-done" data-close-panel type="button">DONE</button>
            </div>
        </section>
<?php require __DIR__ . '/includes/footer.php'; ?>
