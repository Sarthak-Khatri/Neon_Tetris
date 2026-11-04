/** Lightweight desktop cursor trail and interaction effects. */
'use strict';

const CURSOR_TRAIL_KEY = 'neonDropCursorTrailEnabled';
const MAX_TRAIL_POINTS = 28;
const MAX_PARTICLES = 96;
const MAX_PULSES = 4;

function readTrailPreference() {
    try {
        return window.localStorage.getItem(CURSOR_TRAIL_KEY) !== 'false';
    } catch (error) {
        return true;
    }
}

export function initializeCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (document.querySelector('#neon-cursor-trail')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'neon-cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
        canvas.remove();
        return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const points = [];
    const particles = [];
    const pulses = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointer = null;
    let frameId = 0;
    let lastFrame = 0;
    let loadingStarted = performance.now();
    let clickResetTimer = 0;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        requestDraw();
    }

    function isLoading() {
        return document.documentElement.dataset.cursorLoading === 'true';
    }

    function isTrailEnabled() {
        return document.documentElement.dataset.cursorTrail !== 'off' &&
            document.documentElement.dataset.animationIntensity !== 'off' && readTrailPreference();
    }

    function requestDraw() {
        if (frameId || document.hidden) return;
        frameId = window.requestAnimationFrame(drawFrame);
    }

    function addTrailParticles(x, y, distance) {
        if (!isTrailEnabled() || reducedMotion.matches) return;
        const count = Math.min(5, Math.floor(distance / 10));
        for (let index = 0; index < count && particles.length < MAX_PARTICLES; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 24;
            particles.push({
                x: x + (Math.random() - .5) * 5,
                y: y + (Math.random() - .5) * 5,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: .7 + Math.random() * 1.7,
                life: .25 + Math.random() * .18,
                maxLife: .43,
                color: Math.random() > .78 ? '#cf8bff' : '#64edff'
            });
        }
    }

    function onPointerMove(event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        const x = event.clientX;
        const y = event.clientY;
        if (pointer) {
            const distance = Math.hypot(x - pointer.x, y - pointer.y);
            if (distance > 1 && isTrailEnabled() && !reducedMotion.matches) {
                const steps = Math.min(4, Math.ceil(distance / 12));
                for (let index = 1; index <= steps; index += 1) {
                    const ratio = index / steps;
                    points.push({ x: pointer.x + (x - pointer.x) * ratio, y: pointer.y + (y - pointer.y) * ratio, life: .25, maxLife: .25 });
                }
                while (points.length > MAX_TRAIL_POINTS) points.shift();
                addTrailParticles(x, y, distance);
            }
        }
        pointer = { x, y };
        requestDraw();
    }

    function onPointerDown(event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        pointer = { x: event.clientX, y: event.clientY };
        document.documentElement.dataset.cursorClick = 'true';
        window.clearTimeout(clickResetTimer);
        clickResetTimer = window.setTimeout(() => delete document.documentElement.dataset.cursorClick, 110);

        if (!reducedMotion.matches) {
            pulses.push({ x: pointer.x, y: pointer.y, age: 0, duration: .42 });
            while (pulses.length > MAX_PULSES) pulses.shift();
            for (let index = 0; index < 9 && particles.length < MAX_PARTICLES; index += 1) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 22 + Math.random() * 58;
                particles.push({
                    x: pointer.x,
                    y: pointer.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: .9 + Math.random() * 2,
                    life: .28 + Math.random() * .2,
                    maxLife: .48,
                    color: Math.random() > .52 ? '#d681ff' : '#8bfaff'
                });
            }
        }
        requestDraw();
    }

    function drawFrame(timestamp) {
        frameId = 0;
        const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, .04);
        lastFrame = timestamp;
        context.clearRect(0, 0, width, height);

        if (document.documentElement.dataset.cursorTrail === 'off') {
            points.length = 0;
            particles.length = 0;
        }

        if (isTrailEnabled() && points.length > 1) {
            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1];
                const point = points[index];
                const alpha = Math.min(point.life / point.maxLife, previous.life / previous.maxLife) * .32;
                context.beginPath();
                context.moveTo(previous.x, previous.y);
                context.lineTo(point.x, point.y);
                context.strokeStyle = `rgba(89, 224, 255, ${alpha})`;
                context.lineWidth = 2.4 * alpha + .4;
                context.lineCap = 'round';
                context.shadowBlur = 8 * alpha;
                context.shadowColor = '#43ddff';
                context.stroke();
            }
        }

        context.shadowBlur = 0;
        for (let index = points.length - 1; index >= 0; index -= 1) {
            points[index].life -= delta;
            if (points[index].life <= 0) points.splice(index, 1);
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
            particle.vx *= .975;
            particle.vy *= .975;
            const alpha = particle.life / particle.maxLife;
            context.globalAlpha = alpha * .72;
            context.fillStyle = particle.color;
            context.shadowColor = particle.color;
            context.shadowBlur = 7 * alpha;
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            context.fill();
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;

        for (let index = pulses.length - 1; index >= 0; index -= 1) {
            const pulse = pulses[index];
            pulse.age += delta;
            const progress = pulse.age / pulse.duration;
            if (progress >= 1) {
                pulses.splice(index, 1);
                continue;
            }
            const radius = 4 + 42 * progress;
            context.globalAlpha = (1 - progress) * .7;
            context.strokeStyle = progress < .55 ? '#6af4ff' : '#c987ff';
            context.lineWidth = 2 * (1 - progress) + .5;
            context.shadowColor = context.strokeStyle;
            context.shadowBlur = 10 * (1 - progress);
            context.beginPath();
            context.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
            context.stroke();
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;

        if (isLoading() && pointer && !reducedMotion.matches) {
            const rotation = (timestamp - loadingStarted) / 680;
            for (let index = 0; index < 8; index += 1) {
                const angle = rotation + index * Math.PI / 4;
                context.beginPath();
                context.arc(pointer.x, pointer.y, 18, angle, angle + .24);
                context.strokeStyle = index % 2 ? 'rgba(187, 117, 255, .82)' : 'rgba(102, 240, 255, .95)';
                context.lineWidth = 2.2;
                context.lineCap = 'round';
                context.shadowColor = context.strokeStyle;
                context.shadowBlur = 7;
                context.stroke();
            }
            context.shadowBlur = 0;
        }

        const hasMotion = points.length || particles.length || pulses.length || (isLoading() && pointer && !reducedMotion.matches);
        if (hasMotion && !document.hidden) requestDraw();
        else lastFrame = 0;
    }

    function onLoadingStart() {
        loadingStarted = performance.now();
        document.documentElement.dataset.cursorLoading = 'true';
        requestDraw();
    }

    function onLoadingEnd() {
        delete document.documentElement.dataset.cursorLoading;
        requestDraw();
    }

    function onVisibilityChange() {
        if (document.hidden) {
            if (frameId) window.cancelAnimationFrame(frameId);
            frameId = 0;
            lastFrame = 0;
        } else {
            requestDraw();
        }
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('neon:loading-start', onLoadingStart);
    window.addEventListener('neon:loading-end', onLoadingEnd);
    document.addEventListener('submit', (event) => {
        if (event.target instanceof HTMLFormElement && event.target.checkValidity()) onLoadingStart();
    });
    document.addEventListener('visibilitychange', onVisibilityChange);
    resizeCanvas();

    if (isLoading()) requestDraw();
}

// The feedback page loads this module directly; the game entry point may also call it.
initializeCustomCursor();
