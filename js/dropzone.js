import { handleFile } from './upload.js';
import { toast } from './errors.js';

// Состояния оверлея баннера:
//   idle       — оверлей скрыт
//   hover      — мышь над фреймом без drag
//   drag       — файл тащится над страницей
//   drag-hover — файл над самим фреймом
//
// Применяем класс на .banner: .banner--state-{hover|drag|drag-hover}.

const TEXTS = {
    drop: 'Перетащите вашу картинку сюда',
    click: 'Кликните, чтобы загрузить вашу картинку',
};

let pageOverlay = null;
let bannerEl = null;
let frameEl = null;
let fileInput = null;
let titleEl = null;

let dragDepth = 0;

export function initDropzone() {
    pageOverlay = document.querySelector('#page-dropzone');
    bannerEl    = document.querySelector('#banner');
    frameEl     = document.querySelector('.banner__image-frame');
    fileInput   = document.querySelector('#file-input');
    titleEl     = document.querySelector('.banner__overlay-title');

    if (!pageOverlay || !bannerEl || !frameEl || !fileInput || !titleEl) return;

    setTitle(TEXTS.click);

    // Клик по фрейму → file dialog.
    frameEl.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) handleFile(file);
        e.target.value = '';
    });

    // Window-level drag-n-drop.
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    // Drag над самим фреймом → усиленный state.
    frameEl.addEventListener('dragenter', () => {
        setBannerState('drag-hover');
    });
    frameEl.addEventListener('dragleave', () => {
        if (dragDepth > 0) setBannerState('drag');
    });
}

function onDragEnter(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    if (dragDepth === 1) {
        pageOverlay.classList.add('page-dropzone--active');
        document.getElementById('page-scaler')?.classList.add('page-scaler--lifted');
        setBannerState('drag');
        setTitle(TEXTS.drop);
    }
}

function onDragOver(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
}

function onDragLeave(e) {
    if (!hasFiles(e)) return;
    dragDepth--;
    if (dragDepth <= 0) {
        dragDepth = 0;
        resetDragVisuals();
    }
}

function onDrop(e) {
    e.preventDefault();
    dragDepth = 0;
    resetDragVisuals();

    if (!e.dataTransfer) return;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
        toast('Можно только один файл');
        return;
    }
    handleFile(files[0]);
}

export function suppressHoverUntilLeave() {
    if (!bannerEl || !frameEl) return;
    bannerEl.classList.add('banner--suppress-hover');
    const onLeave = () => {
        bannerEl.classList.remove('banner--suppress-hover');
        frameEl.removeEventListener('mouseleave', onLeave);
    };
    frameEl.addEventListener('mouseleave', onLeave);
}

function resetDragVisuals() {
    pageOverlay.classList.remove('page-dropzone--active');
    document.getElementById('page-scaler')?.classList.remove('page-scaler--lifted');
    setBannerState('idle');
    setTitle(TEXTS.click);
}

function setBannerState(state) {
    bannerEl.classList.remove('banner--state-hover', 'banner--state-drag', 'banner--state-drag-hover');
    if (state === 'idle') return;
    bannerEl.classList.add('banner--state-' + state);
}

function setTitle(text) {
    if (titleEl.textContent !== text) titleEl.textContent = text;
}

function hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
}
