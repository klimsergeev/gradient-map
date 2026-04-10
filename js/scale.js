// Масштабирование .page-scaler под ширину viewport.
// Внутренняя система координат фиксированно 1920px.

const PAGE_WIDTH = 1920;

let scaler = null;
let rafId = 0;

function compute() {
    rafId = 0;
    if (!scaler) return;

    const vw = document.documentElement.clientWidth;
    const scale = Math.min(1, vw / PAGE_WIDTH);

    document.documentElement.style.setProperty('--page-scale', String(scale));

    const logicalHeight = scaler.offsetHeight;
    document.body.style.height = `${Math.ceil(logicalHeight * scale)}px`;
}

function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(compute);
}

export function initScale() {
    scaler = document.getElementById('page-scaler');
    if (!scaler) return;

    compute();

    window.addEventListener('resize', schedule, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(schedule);
        ro.observe(scaler);
    }

    window.addEventListener('load', compute, { once: true });
}
