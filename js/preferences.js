/** Local visual preferences for the game interface. */
'use strict';

const EFFECTS_KEY = 'neonDropEffectsEnabled';
const CURSOR_TRAIL_KEY = 'neonDropCursorTrailEnabled';
const ANIMATION_KEY = 'neonDropAnimationIntensity';
const VISUAL_KEYS = {
    particles: 'neonDropParticlesEnabled',
    shake: 'neonDropScreenShakeEnabled',
    background: 'neonDropBackgroundEffectsEnabled',
    ghost: 'neonDropGhostEnabled',
    reactor: 'neonDropReactorEffectsEnabled',
    reactorSound: 'neonDropReactorSoundsEnabled'
};
const THEME_KEY = 'neonDropTheme';
const THEMES = new Set(['cyber', 'violet', 'toxic']);

function readPreference(key, fallback) {
    try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function savePreference(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        // Keep the selected preference active for this page session.
    }
}

export function initializePreferences() {
    const effectsToggle = document.querySelector('#effects-toggle');
    const cursorTrailToggle = document.querySelector('#cursor-trail-toggle');
    const animationSelect = document.querySelector('#animation-intensity-select');
    const themeSelect = document.querySelector('#theme-select');
    const effectsEnabled = readPreference(EFFECTS_KEY, 'true') !== 'false';
    const cursorTrailEnabled = readPreference(CURSOR_TRAIL_KEY, 'true') !== 'false';
    const animationValue = readPreference(ANIMATION_KEY, 'cinematic');
    const animationIntensity = ['off', 'reduced', 'cinematic'].includes(animationValue) ? animationValue : 'cinematic';
    const savedTheme = readPreference(THEME_KEY, 'cyber');
    const theme = THEMES.has(savedTheme) ? savedTheme : 'cyber';

    document.documentElement.dataset.effects = effectsEnabled ? 'on' : 'off';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.cursorTrail = cursorTrailEnabled ? 'on' : 'off';
    document.documentElement.dataset.animationIntensity = animationIntensity;

    Object.entries(VISUAL_KEYS).forEach(([name, key]) => {
        const enabled = readPreference(key, 'true') !== 'false';
        document.documentElement.dataset[name === 'reactorSound' ? 'reactorSound' : name] = enabled ? 'on' : 'off';
        const toggle = document.querySelector(`#${name === 'reactorSound' ? 'reactor-sound-toggle' : name === 'background' ? 'background-effects-toggle' : name === 'reactor' ? 'reactor-effects-toggle' : `${name}-toggle`}`);
        if (!toggle) return;
        toggle.checked = enabled;
        toggle.addEventListener('change', () => {
            const dataName = name === 'reactorSound' ? 'reactorSound' : name;
            document.documentElement.dataset[dataName] = toggle.checked ? 'on' : 'off';
            toggle.setAttribute('aria-label', `${toggle.closest('.setting-row')?.querySelector('strong')?.textContent || name} ${toggle.checked ? 'on' : 'off'}`);
            savePreference(key, String(toggle.checked));
        });
    });

    if (animationSelect) {
        animationSelect.value = animationIntensity;
        animationSelect.addEventListener('change', () => {
            const nextIntensity = ['off', 'reduced', 'cinematic'].includes(animationSelect.value) ? animationSelect.value : 'cinematic';
            document.documentElement.dataset.animationIntensity = nextIntensity;
            animationSelect.value = nextIntensity;
            savePreference(ANIMATION_KEY, nextIntensity);
        });
    }

    if (cursorTrailToggle) {
        cursorTrailToggle.checked = cursorTrailEnabled;
        cursorTrailToggle.setAttribute('aria-label', `Cursor energy trail ${cursorTrailEnabled ? 'on' : 'off'}`);
        cursorTrailToggle.addEventListener('change', () => {
            document.documentElement.dataset.cursorTrail = cursorTrailToggle.checked ? 'on' : 'off';
            cursorTrailToggle.setAttribute('aria-label', `Cursor energy trail ${cursorTrailToggle.checked ? 'on' : 'off'}`);
            savePreference(CURSOR_TRAIL_KEY, String(cursorTrailToggle.checked));
        });
    }

    if (effectsToggle) {
        effectsToggle.checked = effectsEnabled;
        effectsToggle.setAttribute('aria-label', `Visual effects ${effectsEnabled ? 'on' : 'off'}`);
        effectsToggle.addEventListener('change', () => {
            document.documentElement.dataset.effects = effectsToggle.checked ? 'on' : 'off';
            effectsToggle.setAttribute('aria-label', `Visual effects ${effectsToggle.checked ? 'on' : 'off'}`);
            savePreference(EFFECTS_KEY, String(effectsToggle.checked));
        });
    }

    if (themeSelect) {
        themeSelect.value = theme;
        themeSelect.addEventListener('change', () => {
            const nextTheme = THEMES.has(themeSelect.value) ? themeSelect.value : 'cyber';
            document.documentElement.dataset.theme = nextTheme;
            themeSelect.value = nextTheme;
            savePreference(THEME_KEY, nextTheme);
        });
    }
}
