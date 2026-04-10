import { injectStripes } from './stripes.js';
import { initBanner } from './banner.js';
import { initPresets, selectPreset } from './presets.js';
import { initDropzone } from './dropzone.js';
import { clearAll } from './storage.js';
import { DEFAULT_PRESET_ID } from './config.js';
import { initScale } from './scale.js';
import { initPalette } from './palette.js';
import { initRecolor } from './recolor.js';

function restoreState() {
    selectPreset(DEFAULT_PRESET_ID);
}

async function init() {
    initScale();
    clearAll();
    const stripesContainer = document.getElementById('banner-stripes');
    if (stripesContainer) {
        try {
            await injectStripes(stripesContainer);
        } catch (err) {
            console.error('[banner] stripes inject failed:', err);
        }
    }

    initBanner();
    initPalette();
    initRecolor();
    initPresets();
    initDropzone();
    restoreState();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
