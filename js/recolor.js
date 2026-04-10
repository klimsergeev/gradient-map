// Управление перекраской градиентов баннера по выбранной гармонии.

import { HARMONIES } from './harmonies/index.js';
import { getStripeMap } from './stripes.js';
import { getCurrentPalette } from './palette.js';
import { hashPalette, mulberry32, DISTRIBUTIONS } from './color-utils.js';

const LS_KEY = 'gradient-map:harmony-mode';
const LS_KEY_DIST = 'gradient-map:distribution';
const DEFAULT_MODE = 'brand';
const DEFAULT_DIST = 'mix';

let currentMode = DEFAULT_MODE;
let currentDistribution = DEFAULT_DIST;
let buttons = [];
let distButtons = [];
let distList = null;

export function initRecolor() {
    const root = document.querySelector('.harmony-switch');
    if (!root) {
        console.warn('[recolor] .harmony-switch not found');
        return;
    }
    buttons = [...root.querySelectorAll('[data-mode]')];
    distButtons = [...root.querySelectorAll('[data-distribution]')];
    distList = root.querySelector('.harmony-switch__list--distribution');

    // Восстанавливаем режим из LS
    const saved = readLS(LS_KEY);
    currentMode = saved && HARMONIES[saved]?.enabled ? saved : DEFAULT_MODE;
    setActiveButton(currentMode);

    // Восстанавливаем distribution из LS
    const savedDist = readLS(LS_KEY_DIST);
    currentDistribution = savedDist && DISTRIBUTIONS[savedDist] ? savedDist : DEFAULT_DIST;
    setActiveDistributionButton(currentDistribution);

    // Начальное скрытие distribution-листа в Brand
    if (distList) {
        distList.classList.toggle('harmony-switch__list--hidden', currentMode === 'brand');
    }

    // Делегирование кликов на inner
    const inner = root.querySelector('.harmony-switch__inner') || root;
    inner.addEventListener('click', (e) => {
        const modeBtn = e.target.closest('[data-mode]');
        if (modeBtn) {
            handleModeClick(modeBtn.dataset.mode);
            return;
        }
        const distBtn = e.target.closest('[data-distribution]');
        if (distBtn) {
            handleDistributionClick(distBtn.dataset.distribution);
        }
    });

    // Событие палитры
    document.addEventListener('palette:ready', (ev) => {
        const hex5 = ev?.detail?.hex5;
        if (!hex5) return;
        if (currentMode === 'brand') return;
        applyHarmony(currentMode, hex5);
    });

    // Если палитра уже готова (гонка при init) — применим
    const palette = getCurrentPalette();
    if (palette && currentMode !== 'brand') {
        applyHarmony(currentMode, palette);
    }
}

function handleModeClick(mode) {
    if (!mode || !HARMONIES[mode] || !HARMONIES[mode].enabled) return;
    currentMode = mode;
    writeLS(LS_KEY, mode);
    setActiveButton(mode);
    if (distList) {
        distList.classList.toggle('harmony-switch__list--hidden', mode === 'brand');
    }
    const palette = getCurrentPalette();
    if (mode === 'brand') {
        applyHarmony('brand', null);
        return;
    }
    if (!palette) return;
    applyHarmony(mode, palette);
}

function handleDistributionClick(dist) {
    if (!DISTRIBUTIONS[dist]) return;
    currentDistribution = dist;
    writeLS(LS_KEY_DIST, dist);
    setActiveDistributionButton(dist);
    if (currentMode === 'brand') return;
    const palette = getCurrentPalette();
    if (palette) applyHarmony(currentMode, palette);
}

function applyHarmony(mode, palette) {
    const stripeMap = getStripeMap();
    if (!stripeMap || stripeMap.length !== 11) {
        console.warn('[recolor] stripeMap incomplete:', stripeMap?.length);
        return;
    }
    const harmony = HARMONIES[mode];
    if (!harmony || !harmony.apply) return;
    const rng = palette ? mulberry32(hashPalette(palette)) : () => 0.5;
    const baseMap = DISTRIBUTIONS[currentDistribution].map;
    harmony.apply(palette, stripeMap, rng, { baseMap });
}

function setActiveButton(mode) {
    buttons.forEach((btn) => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('harmony-switch__item--active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function setActiveDistributionButton(dist) {
    distButtons.forEach((btn) => {
        const isActive = btn.dataset.distribution === dist;
        btn.classList.toggle('harmony-switch__item--active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function readLS(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function writeLS(key, value) {
    try { localStorage.setItem(key, value); } catch {}
}
