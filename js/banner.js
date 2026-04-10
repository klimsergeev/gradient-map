let imageEl = null;

export function initBanner() {
    imageEl = document.querySelector('.banner__image');
}

export function setImage(src) {
    if (!imageEl) return;
    imageEl.src = src;
    document.dispatchEvent(new CustomEvent('banner:image-changed', { detail: { src } }));
}
