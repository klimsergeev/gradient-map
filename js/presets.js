import { PRESETS, STORAGE_KEYS } from './config.js';
import { setImage } from './banner.js';
import { writeLS } from './storage.js';
import { toast } from './errors.js';

let galleryEl = null;

export function initPresets() {
    galleryEl = document.querySelector('.presets__gallery');
    if (!galleryEl) return;

    galleryEl.addEventListener('click', (e) => {
        const li = e.target.closest('.preset');
        if (!li || !galleryEl.contains(li)) return;
        const id = li.dataset.id;
        if (!id) return;
        selectPreset(id);
    });
}

export function selectPreset(id) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) {
        toast('Пресет не найден: ' + id);
        return;
    }

    if (galleryEl) {
        const items = galleryEl.querySelectorAll('.preset');
        items.forEach((el) => {
            const isTarget = el.dataset.id === id;
            el.classList.toggle('is-selected', isTarget);
            el.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
        });
    }

    setImage(preset.original);
    writeLS(STORAGE_KEYS.selectedPreset, id);
}

export function clearSelection() {
    if (!galleryEl) return;
    galleryEl.querySelectorAll('.preset').forEach((el) => {
        el.classList.remove('is-selected');
        el.setAttribute('aria-pressed', 'false');
    });
}
