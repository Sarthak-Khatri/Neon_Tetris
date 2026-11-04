/** Shared, short-lived Canvas effects. This loop runs only while an effect is visible. */
'use strict';

import { BOARD_COLUMNS } from './constants.js';
import { boardGrid, boardFrame, gameScreen } from './dom-elements.js';

const MAX_PARTICLES = 150;
const MAX_LABELS = 8;
const particles = [];
const labels = [];
const sweeps = [];
let canvas = null;
let context = null;
let width = 0;
let height = 0;
let dpr = 1;
let frameId = 0;
let previousTime = 0;
let shakeTimer = 0;

function visualMotionAllowed() {
    return document.documentElement.dataset.effects !== 'off' &&
        document.documentElement.dataset.animationIntensity !== 'off' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function particlesAllowed() {
    return visualMotionAllowed() && document.documentElement.dataset.particles !== 'off';
}

function ensureFrame() {
    if (!frameId && !document.hidden && context) frameId = window.requestAnimationFrame(drawFrame);
}

function resizeCanvas() {
    if (!canvas || !context) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    ensureFrame();
}

function addBurst(x, y, count = 8, colors = ['#78efff', '#b887ff', '#efffff']) {
    if (!particlesAllowed()) return;
    for (let index = 0; index < count && particles.length < MAX_PARTICLES; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 28 + Math.random() * 70;
        const ttl = .24 + Math.random() * .32;
        particles.push({
            x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: .8 + Math.random() * 2.1, life: ttl, maxLife: ttl,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    ensureFrame();
}

function cellAt(row, column) {
    const cell = boardGrid?.children[row * BOARD_COLUMNS + column];
    if (!cell) return null;
    const rect = cell.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function initializeVisualEffects() {
    if (canvas || !document.body) return;
    canvas = document.createElement('canvas');
    canvas.id = 'neon-game-effects';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        canvas.remove();
        canvas = null;
        return;
    }
    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (frameId) window.cancelAnimationFrame(frameId);
            frameId = 0;
            previousTime = 0;
        } else {
            ensureFrame();
        }
    });
    resizeCanvas();
}

export function emitPieceLanding(piece) {
    if (!piece || !particlesAllowed()) return;
    piece.shape.forEach((row, rowOffset) => row.forEach((filled, columnOffset) => {
        if (!filled) return;
        const point = cellAt(piece.y + rowOffset, piece.x + columnOffset);
        if (point) addBurst(point.x, point.y, 3, ['#9ff8ff', '#54cfff', '#b693ff']);
    }));
}

export function emitLineClear(rowIndexes) {
    if (!visualMotionAllowed() || !boardGrid) return;
    const bounds = boardGrid.getBoundingClientRect();
    rowIndexes.forEach((row) => {
        const point = cellAt(row, Math.floor(BOARD_COLUMNS / 2));
        if (!point) return;
        const cell = boardGrid.children[row * BOARD_COLUMNS];
        const rect = cell?.getBoundingClientRect();
        sweeps.push({ x: bounds.left, y: rect ? rect.top : point.y - 5, width: bounds.width, height: rect?.height || 10, age: 0, duration: .43 });
        for (let column = 0; column < BOARD_COLUMNS; column += 1) {
            const cellPoint = cellAt(row, column);
            if (cellPoint) addBurst(cellPoint.x, cellPoint.y, 2, ['#bcfaff', '#61dcff', '#a48dff']);
        }
    });
    ensureFrame();
}

export function emitReactorBurst() {
    if (document.documentElement.dataset.reactor === 'off') return;
    const core = document.querySelector('#reactor-visual .reactor-core');
    if (!core || !particlesAllowed()) return;
    const rect = core.getBoundingClientRect();
    addBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, ['#a4faff', '#65e4ff', '#a987ff']);
}

export function emitReactorCharge(amount) {
    if (document.documentElement.dataset.reactor === 'off') return;
    const core = document.querySelector('#reactor-visual .reactor-core');
    if (!core || !particlesAllowed()) return;
    const rect = core.getBoundingClientRect();
    const count = Math.min(10, Math.max(2, Math.ceil(amount / 10)));
    addBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, count, ['#8cf5ff', '#5dbfea', '#9e8aff']);
}

export function showFloatingText(message, target, color = '#aaf7ff') {
    if (!visualMotionAllowed() || !target) return;
    const rect = target.getBoundingClientRect();
    labels.push({ text: String(message), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color, age: 0, duration: .85 });
    while (labels.length > MAX_LABELS) labels.shift();
    ensureFrame();
}

export function triggerScreenShake(strength = 1) {
    if (!visualMotionAllowed() || document.documentElement.dataset.shake === 'off' || !gameScreen) return;
    gameScreen.classList.remove('is-shaking');
    gameScreen.classList.toggle('is-shake-heavy', strength >= .7);
    void gameScreen.offsetWidth;
    gameScreen.classList.add('is-shaking');
    window.clearTimeout(shakeTimer);
    shakeTimer = window.setTimeout(() => {
        gameScreen.classList.remove('is-shaking');
        gameScreen.classList.remove('is-shake-heavy');
    }, 360);
}

export function triggerDropStreak() {
    if (!visualMotionAllowed() || !boardFrame) return;
    boardFrame.classList.remove('is-hard-dropping');
    void boardFrame.offsetWidth;
    boardFrame.classList.add('is-hard-dropping');
    window.setTimeout(() => boardFrame.classList.remove('is-hard-dropping'), 260);
}

function drawFrame(timestamp) {
    frameId = 0;
    const delta = Math.min((timestamp - (previousTime || timestamp)) / 1000, .04);
    previousTime = timestamp;
    context.clearRect(0, 0, width, height);

    if (!particlesAllowed()) particles.length = 0;
    for (let index = sweeps.length - 1; index >= 0; index -= 1) {
        const sweep = sweeps[index];
        sweep.age += delta;
        const progress = sweep.age / sweep.duration;
        if (progress >= 1) {
            sweeps.splice(index, 1);
            continue;
        }
        const alpha = Math.sin(progress * Math.PI) * .42;
        const beamWidth = Math.max(20, sweep.width * .28);
        const beamX = sweep.x - beamWidth + (sweep.width + beamWidth * 2) * progress;
        const gradient = context.createLinearGradient(beamX, 0, beamX + beamWidth, 0);
        gradient.addColorStop(0, 'rgba(88, 225, 255, 0)');
        gradient.addColorStop(.5, `rgba(135, 237, 255, ${alpha})`);
        gradient.addColorStop(1, 'rgba(173, 113, 255, 0)');
        context.fillStyle = gradient;
        context.fillRect(beamX, sweep.y, beamWidth, sweep.height);
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= delta;
        if (particle.life <= 0) {
            particles.splice(index, 1);
            continue;
        }
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vx *= .96;
        particle.vy = particle.vy * .96 + 13 * delta;
        const alpha = particle.life / particle.maxLife;
        context.globalAlpha = alpha * .82;
        context.fillStyle = particle.color;
        context.shadowColor = particle.color;
        context.shadowBlur = 7 * alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        context.fill();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;

    for (let index = labels.length - 1; index >= 0; index -= 1) {
        const label = labels[index];
        label.age += delta;
        const progress = label.age / label.duration;
        if (progress >= 1) {
            labels.splice(index, 1);
            continue;
        }
        context.globalAlpha = Math.min(1, (1 - progress) * 1.5);
        context.fillStyle = label.color;
        context.shadowColor = label.color;
        context.shadowBlur = 14 * (1 - progress);
        context.textAlign = 'center';
        context.font = '700 14px Orbitron, sans-serif';
        context.fillText(label.text, label.x, label.y - progress * 36);
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;

    if ((particles.length || labels.length || sweeps.length) && !document.hidden) ensureFrame();
    else previousTime = 0;
}
