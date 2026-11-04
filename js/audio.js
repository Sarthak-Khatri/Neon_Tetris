/** Shared Web Audio manager for procedural music and short arcade effects. */
'use strict';

import { SOUND_STORAGE_KEY } from './constants.js';
import { soundToggle } from './dom-elements.js';
import * as state from './game-state.js';

const KEYS = {
    master: 'neonDropMasterVolume',
    music: 'neonDropMusicVolume',
    sfx: 'neonDropSfxVolume',
    musicEnabled: 'neonDropMusicEnabled',
    muted: 'neonDropMuted'
};

const DEFAULTS = { master: .72, music: .32, sfx: .58, musicEnabled: true, muted: false, reactorSound: true };
const MOODS = {
    menu: { tempo: 2100, chords: [[110, 164.81, 220], [98, 146.83, 196], [130.81, 196, 261.63]], pulse: 0 },
    gameplay: { tempo: 740, chords: [[130.81, 196, 261.63], [146.83, 220, 293.66], [110, 164.81, 220], [123.47, 185, 246.94]], pulse: 1 },
    warning: { tempo: 620, chords: [[123.47, 185, 246.94], [130.81, 196, 261.63], [110, 164.81, 220]], pulse: 1 },
    danger: { tempo: 470, chords: [[65.41, 98, 155.56], [73.42, 110, 174.61], [61.74, 92.5, 146.83]], pulse: 2 },
    gameover: { tempo: 1500, chords: [[55, 82.41, 110]], pulse: 0 }
};

const SOUNDS = {
    'ui-hover': { from: 920, to: 1180, duration: .032, gain: .024, wave: 'sine', cooldown: .1 },
    'ui-click': { from: 640, to: 390, duration: .075, gain: .065, wave: 'triangle', cooldown: .045 },
    toggle: { from: 440, to: 690, duration: .105, gain: .06, wave: 'sine' },
    transition: { from: 260, to: 720, duration: .28, gain: .07, wave: 'sine' },
    move: { from: 250, to: 210, duration: .05, gain: .035, wave: 'sine', cooldown: .045 },
    rotate: { from: 330, to: 520, duration: .11, gain: .065, wave: 'triangle' },
    'soft-drop': { from: 320, to: 180, duration: .065, gain: .035, wave: 'sine', cooldown: .07 },
    drop: { from: 210, to: 72, duration: .2, gain: .13, wave: 'triangle' },
    'piece-lock': { from: 180, to: 120, duration: .11, gain: .075, wave: 'triangle', cooldown: .06 },
    clear: { from: 480, to: 970, duration: .3, gain: .1, wave: 'sine' },
    combo: { from: 560, to: 1020, duration: .34, gain: .09, wave: 'triangle' },
    ability: { from: 280, to: 740, duration: .24, gain: .1, wave: 'sawtooth' },
    'reactor-ready': { from: 520, to: 1040, duration: .42, gain: .09, wave: 'sine', cooldown: 1 },
    level: { from: 390, to: 1180, duration: .48, gain: .1, wave: 'triangle' },
    'danger-alert': { from: 150, to: 110, duration: .34, gain: .08, wave: 'triangle', cooldown: 8 },
    pause: { from: 430, to: 210, duration: .19, gain: .075, wave: 'triangle' },
    resume: { from: 250, to: 620, duration: .21, gain: .075, wave: 'sine' },
    gameover: { from: 260, to: 55, duration: .85, gain: .12, wave: 'triangle' },
    achievement: { from: 660, to: 1320, duration: .55, gain: .09, wave: 'sine' }
};

const lastSoundAt = new Map();
const activeVoices = new Set();
let settings = { ...DEFAULTS };
let masterBus = null;
let sfxBus = null;
let musicBus = null;
let musicLayers = [];
let activeLayer = -1;
let currentMood = 'menu';
let moodStep = 0;
let musicTimer = 0;
let managerReady = false;
let lastDangerSoundAt = -Infinity;

function readStored(key, fallback) {
    try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function saveStored(key, value) {
    try {
        window.localStorage.setItem(key, String(value));
    } catch (error) {
        // Audio preferences remain usable for this page if storage is unavailable.
    }
}

function readVolume(key, fallback) {
    const parsed = Number(readStored(key, String(fallback)));
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}

function setGain(gain, value, duration = .12) {
    if (!gain || !state.audioContext) return;
    const now = state.audioContext.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(Math.max(.0001, value), now + duration);
}

function syncVolumes() {
    setGain(masterBus, settings.muted ? 0 : settings.master, .09);
    setGain(sfxBus, state.soundEnabled ? settings.sfx : 0, .09);
    setGain(musicBus, settings.musicEnabled ? settings.music : 0, .2);
}

function createMusicLayer(context) {
    const bus = context.createGain();
    bus.gain.value = 0;
    bus.connect(musicBus);
    const pads = [0, 1, 2].map((index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 1 ? 'triangle' : 'sine';
        oscillator.frequency.value = 110 + index * 55;
        gain.gain.value = index === 0 ? .48 : .2;
        oscillator.connect(gain);
        gain.connect(bus);
        oscillator.start();
        return oscillator;
    });
    const pulse = context.createOscillator();
    const pulseGain = context.createGain();
    pulse.type = 'sine';
    pulse.frequency.value = 55;
    pulseGain.gain.value = .0001;
    pulse.connect(pulseGain);
    pulseGain.connect(bus);
    pulse.start();
    return { bus, pads, pulse, pulseGain };
}

function createAudioGraph() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    let context = null;
    try {
        context = new AudioContextClass();
        state.setAudioContext(context);
        masterBus = context.createGain();
        sfxBus = context.createGain();
        musicBus = context.createGain();
        sfxBus.connect(masterBus);
        musicBus.connect(masterBus);
        masterBus.connect(context.destination);
        musicLayers = [createMusicLayer(context), createMusicLayer(context)];
        syncVolumes();
        return context;
    } catch (error) {
        if (context && context.state !== 'closed') context.close().catch(() => {});
        state.setAudioContext(null);
        masterBus = null;
        sfxBus = null;
        musicBus = null;
        musicLayers = [];
        return null;
    }
}

function ensureContext() {
    const context = state.audioContext || createAudioGraph();
    if (!context) return null;
    if (context.state === 'suspended') context.resume().catch(() => {});
    if (!managerReady) {
        managerReady = true;
        if (settings.musicEnabled && !settings.muted) activateMusicLayer(currentMood);
    }
    return context;
}

function updateLayerNotes(layer, mood, step) {
    const profile = MOODS[mood] || MOODS.gameplay;
    const chord = profile.chords[step % profile.chords.length];
    const context = state.audioContext;
    if (!context) return;
    chord.forEach((frequency, index) => {
        layer.pads[index].frequency.setTargetAtTime(frequency, context.currentTime, .36);
    });
    layer.pulse.frequency.setTargetAtTime(Math.max(38, chord[0] / 2), context.currentTime, .2);
}

function pulseMusic(layer, mood) {
    const level = MOODS[mood]?.pulse || 0;
    if (!level || !state.audioContext) return;
    const gain = layer.pulseGain.gain;
    const now = state.audioContext.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(.0001, now);
    gain.linearRampToValueAtTime(level === 2 ? .11 : .055, now + .035);
    gain.exponentialRampToValueAtTime(.0001, now + (level === 2 ? .19 : .14));
}

function startMusicClock() {
    window.clearInterval(musicTimer);
    if (!settings.musicEnabled || settings.muted || !managerReady) return;
    const profile = MOODS[currentMood] || MOODS.gameplay;
    musicTimer = window.setInterval(() => {
        if (!state.audioContext || state.audioContext.state !== 'running' || activeLayer < 0) return;
        moodStep += 1;
        const layer = musicLayers[activeLayer];
        updateLayerNotes(layer, currentMood, moodStep);
        pulseMusic(layer, currentMood);
    }, profile.tempo);
}

function activateMusicLayer(mood) {
    if (!managerReady || !settings.musicEnabled || settings.muted || !state.audioContext) return;
    const nextIndex = activeLayer === 0 ? 1 : 0;
    const next = musicLayers[nextIndex];
    const previous = activeLayer >= 0 ? musicLayers[activeLayer] : null;
    moodStep = 0;
    updateLayerNotes(next, mood, moodStep);
    const now = state.audioContext.currentTime;
    next.bus.gain.cancelScheduledValues(now);
    next.bus.gain.setValueAtTime(0, now);
    next.bus.gain.linearRampToValueAtTime(.78, now + .95);
    if (previous) {
        previous.bus.gain.cancelScheduledValues(now);
        previous.bus.gain.setValueAtTime(previous.bus.gain.value, now);
        previous.bus.gain.linearRampToValueAtTime(0, now + .95);
    }
    activeLayer = nextIndex;
    startMusicClock();
}

function loadAudioSettings() {
    settings = {
        master: readVolume(KEYS.master, DEFAULTS.master),
        music: readVolume(KEYS.music, DEFAULTS.music),
        sfx: readVolume(KEYS.sfx, DEFAULTS.sfx),
        musicEnabled: readStored(KEYS.musicEnabled, String(DEFAULTS.musicEnabled)) !== 'false',
        muted: readStored(KEYS.muted, String(DEFAULTS.muted)) === 'true',
        reactorSound: readStored('neonDropReactorSoundsEnabled', 'true') !== 'false'
    };
}

function rangeSetting(id, key, outputId) {
    const input = document.querySelector(`#${id}`);
    const output = document.querySelector(`#${outputId}`);
    if (!input) return;
    const value = settings[key];
    input.value = String(Math.round(value * 100));
    if (output) output.value = `${input.value}%`;
    input.addEventListener('input', () => {
        settings[key] = Math.min(1, Math.max(0, Number(input.value) / 100));
        if (output) output.value = `${input.value}%`;
        saveStored(KEYS[key], settings[key].toFixed(2));
        syncVolumes();
    });
}

function connectUIAudio() {
    const musicToggle = document.querySelector('#music-toggle');
    const muteToggle = document.querySelector('#master-mute-toggle');
    const reactorSoundToggle = document.querySelector('#reactor-sound-toggle');
    if (reactorSoundToggle) {
        reactorSoundToggle.checked = settings.reactorSound;
        reactorSoundToggle.addEventListener('change', () => {
            settings.reactorSound = reactorSoundToggle.checked;
            saveStored('neonDropReactorSoundsEnabled', settings.reactorSound);
        });
    }
    if (musicToggle) {
        musicToggle.checked = settings.musicEnabled;
        musicToggle.addEventListener('change', () => {
            settings.musicEnabled = musicToggle.checked;
            saveStored(KEYS.musicEnabled, settings.musicEnabled);
            syncVolumes();
            if (settings.musicEnabled && !settings.muted) {
                if (managerReady) resumeMusic();
                else ensureContext();
            }
            else window.clearInterval(musicTimer);
        });
    }
    if (muteToggle) {
        muteToggle.checked = settings.muted;
        muteToggle.addEventListener('change', () => {
            settings.muted = muteToggle.checked;
            saveStored(KEYS.muted, settings.muted);
            syncVolumes();
            if (!settings.muted && settings.musicEnabled) {
                if (managerReady) resumeMusic();
                else ensureContext();
            }
            else window.clearInterval(musicTimer);
        });
    }
    rangeSetting('master-volume', 'master', 'master-volume-value');
    rangeSetting('music-volume', 'music', 'music-volume-value');
    rangeSetting('sfx-volume', 'sfx', 'sfx-volume-value');
}

function isControlHoverTarget(target) {
    return target instanceof Element && target.closest('button:not(:disabled), a[href], select, [role="button"]');
}

/** Create or resume the one shared AudioContext only after a user gesture. */
export function unlockAudio() {
    if (settings.muted || (!settings.musicEnabled && !state.soundEnabled)) return;
    const context = ensureContext();
    if (context && context.state === 'running' && settings.musicEnabled && !settings.muted && activeLayer < 0) {
        activateMusicLayer(currentMood);
    }
}

export function playSound(soundName, detail = {}) {
    const config = SOUNDS[soundName];
    if (!config || !state.soundEnabled || settings.muted || settings.sfx <= 0) return;
    if ((soundName === 'ability' || soundName === 'reactor-ready') && !settings.reactorSound) return;
    const context = ensureContext();
    if (!context || !sfxBus || context.state !== 'running') return;
    const now = context.currentTime;
    const prior = lastSoundAt.get(soundName) || -Infinity;
    if (now - prior < (config.cooldown || 0)) return;
    lastSoundAt.set(soundName, now);

    try {
        if (activeVoices.size >= 12) {
            try { activeVoices.values().next().value?.stop(); } catch (error) { /* voice already ended */ }
        }
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const duration = config.duration;
        const intensity = 1 + Math.min(4, Math.max(0, Number(detail.combo) || 0)) * .07;
        const volume = Math.min(config.gain * (detail.rows > 1 ? 1 + detail.rows * .08 : intensity), .18);
        oscillator.type = config.wave;
        oscillator.frequency.setValueAtTime(config.from, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, config.to), now + duration);
        envelope.gain.setValueAtTime(.0001, now);
        envelope.gain.linearRampToValueAtTime(volume, now + Math.min(.018, duration / 4));
        envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
        oscillator.connect(envelope);
        envelope.connect(sfxBus);
        activeVoices.add(oscillator);
        oscillator.onended = () => activeVoices.delete(oscillator);
        oscillator.start(now);
        oscillator.stop(now + duration + .01);
    } catch (error) {
        // Audio is decorative; Web Audio errors must never affect game logic.
    }
}

export function setMusicMood(mood) {
    if (!MOODS[mood] || currentMood === mood) return;
    currentMood = mood;
    if (managerReady && settings.musicEnabled && !settings.muted) activateMusicLayer(mood);
}

export function playMusic(mood) {
    setMusicMood(mood);
    if (settings.musicEnabled && !settings.muted && managerReady) activateMusicLayer(mood);
}

export function setDangerMusic(dangerState, previousState) {
    const mood = dangerState === 'critical' ? 'danger' : dangerState === 'warning' ? 'warning' : 'gameplay';
    setMusicMood(mood);
    if (dangerState !== 'stable' && dangerState !== previousState) {
        const now = performance.now();
        if (now - lastDangerSoundAt > 8000) {
            lastDangerSoundAt = now;
            playSound('danger-alert');
        }
    }
}

export function stopMusic() {
    window.clearInterval(musicTimer);
    musicTimer = 0;
    if (musicLayers.length && state.audioContext) {
        musicLayers.forEach((layer) => setGain(layer.bus, 0, .4));
    }
    activeLayer = -1;
}

export function pauseMusic() {
    window.clearInterval(musicTimer);
    musicTimer = 0;
    if (musicLayers.length && state.audioContext) musicLayers.forEach((layer) => setGain(layer.bus, 0, .3));
}

export function resumeMusic() {
    if (settings.musicEnabled && !settings.muted) {
        ensureContext();
        activateMusicLayer(currentMood);
    }
}

export function setMasterVolume(value) {
    settings.master = Math.min(1, Math.max(0, Number(value)));
    saveStored(KEYS.master, settings.master.toFixed(2));
    syncVolumes();
}

export function setMusicVolume(value) {
    settings.music = Math.min(1, Math.max(0, Number(value)));
    saveStored(KEYS.music, settings.music.toFixed(2));
    syncVolumes();
}

export function setSfxVolume(value) {
    settings.sfx = Math.min(1, Math.max(0, Number(value)));
    saveStored(KEYS.sfx, settings.sfx.toFixed(2));
    syncVolumes();
}

export function setMusicEnabled(enabled) {
    settings.musicEnabled = Boolean(enabled);
    saveStored(KEYS.musicEnabled, settings.musicEnabled);
    syncVolumes();
    if (settings.musicEnabled && !settings.muted) {
        if (managerReady) resumeMusic();
        else unlockAudio();
    }
    else window.clearInterval(musicTimer);
}

export function setMuted(muted) {
    settings.muted = Boolean(muted);
    saveStored(KEYS.muted, settings.muted);
    syncVolumes();
    if (!settings.muted && settings.musicEnabled) {
        if (managerReady) resumeMusic();
        else unlockAudio();
    }
    else window.clearInterval(musicTimer);
}

export function mute() {
    setMuted(true);
}

export function unmute() {
    setMuted(false);
}

export function loadSoundSetting() {
    return readStored(SOUND_STORAGE_KEY, 'false') === 'true';
}

export function saveSoundSetting(enabled) {
    saveStored(SOUND_STORAGE_KEY, Boolean(enabled));
}

export function initializeSoundToggle() {
    loadAudioSettings();
    if (soundToggle) {
        const enabled = loadSoundSetting();
        state.setSoundEnabled(enabled);
        soundToggle.checked = enabled;
        soundToggle.setAttribute('aria-label', enabled ? 'Sound effects on' : 'Sound effects off');
        soundToggle.addEventListener('change', () => {
            state.setSoundEnabled(soundToggle.checked);
            soundToggle.setAttribute('aria-label', soundToggle.checked ? 'Sound effects on' : 'Sound effects off');
            saveSoundSetting(soundToggle.checked);
            if (soundToggle.checked) playSound('toggle');
        });
    }

    connectUIAudio();
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('pointerover', (event) => {
        const target = isControlHoverTarget(event.target);
        if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return;
        playSound('ui-hover');
    }, { passive: true });
    document.addEventListener('pointerdown', (event) => {
        const target = isControlHoverTarget(event.target);
        if (!target || target.closest('.touch-button, .ability-buttons, #pause-button, #resume-button, #hold-button')) return;
        playSound('ui-click');
    }, { passive: true });
    document.addEventListener('click', (event) => {
        if (event.detail !== 0) return;
        const target = isControlHoverTarget(event.target);
        if (!target || target.closest('.touch-button, .ability-buttons, #pause-button, #resume-button, #hold-button')) return;
        playSound('ui-click');
    });
    document.addEventListener('change', (event) => {
        if ((event.target instanceof HTMLInputElement && event.target.type === 'checkbox') || event.target instanceof HTMLSelectElement) {
            if (event.target.id !== 'sound-toggle') playSound('toggle');
        }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.clearInterval(musicTimer);
            musicTimer = 0;
            if (musicLayers.length && state.audioContext) musicLayers.forEach((layer) => setGain(layer.bus, 0, .18));
            return;
        }
        if (managerReady && settings.musicEnabled && !settings.muted) activateMusicLayer(currentMood);
    });
    window.addEventListener('pagehide', () => {
        window.clearInterval(musicTimer);
        if (state.audioContext && state.audioContext.state !== 'closed') state.audioContext.close().catch(() => {});
    }, { once: true });
}
