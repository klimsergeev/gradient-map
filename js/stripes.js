import { STRIPES, STRIPES_BASE } from './config.js';

const ID_ATTRS = ['fill', 'stroke', 'filter', 'mask', 'clip-path'];

// stripeMap собирается после инжекта
let stripeMap = [];

export function getStripeMap() {
    return stripeMap;
}


// Префиксует все id внутри SVG и переписывает все url(#...) ссылки,
// чтобы 11 файлов не конфликтовали по одинаковым id градиентов.
function prefixIds(svgEl, prefix) {
    const idMap = new Map();

    svgEl.querySelectorAll('[id]').forEach((el) => {
        const oldId = el.id;
        const newId = `${prefix}-${oldId}`;
        idMap.set(oldId, newId);
        el.id = newId;
    });

    if (idMap.size === 0) return;

    const urlRe = /url\(#([^)]+)\)/g;
    const rewrite = (val) =>
        val.replace(urlRe, (_, id) =>
            idMap.has(id) ? `url(#${idMap.get(id)})` : `url(#${id})`
        );

    svgEl.querySelectorAll('*').forEach((el) => {
        for (const attr of ID_ATTRS) {
            const v = el.getAttribute(attr);
            if (v && v.includes('url(#')) {
                el.setAttribute(attr, rewrite(v));
            }
        }
        const style = el.getAttribute('style');
        if (style && style.includes('url(#')) {
            el.setAttribute('style', rewrite(style));
        }
        const href = el.getAttribute('href') || el.getAttribute('xlink:href');
        if (href && href.startsWith('#')) {
            const id = href.slice(1);
            if (idMap.has(id)) {
                if (el.hasAttribute('href')) el.setAttribute('href', `#${idMap.get(id)}`);
                if (el.hasAttribute('xlink:href')) el.setAttribute('xlink:href', `#${idMap.get(id)}`);
            }
        }
    });
}

async function loadStripe(file, index) {
    const res = await fetch(`${STRIPES_BASE}${file}`);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
    const text = await res.text();

    const wrap = document.createElement('div');
    wrap.innerHTML = text.trim();
    const svg = wrap.querySelector('svg');
    if (!svg) throw new Error(`No <svg> in ${file}`);

    const width = parseInt(svg.getAttribute('width'), 10);
    const left = parseInt(file.split('_')[0], 10);

    prefixIds(svg, `s${index}`);

    const node = document.createElement('div');
    node.className = 'stripe';
    node.dataset.name = file.replace('.svg', '');
    node.style.left = `${left}px`;
    node.style.width = `${width}px`;
    node.appendChild(svg);

    return node;
}

function readStopColor(stopEl) {
    const attr = stopEl.getAttribute('stop-color');
    if (attr) return attr;
    const inline = stopEl.style && stopEl.style.stopColor;
    if (inline) return inline;
    // Попробуем достать из атрибута style напрямую
    const styleAttr = stopEl.getAttribute('style');
    if (styleAttr) {
        const m = styleAttr.match(/stop-color\s*:\s*([^;]+)/);
        if (m) return m[1].trim();
    }
    return null;
}

function buildStripeEntry(svgRoot, index) {
    const gradient = svgRoot.querySelector('linearGradient');
    if (!gradient) return null;
    const stops = [...gradient.querySelectorAll('stop')].sort((a, b) => {
        const oa = parseFloat(a.getAttribute('offset') || '0');
        const ob = parseFloat(b.getAttribute('offset') || '0');
        return oa - ob;
    });
    // Записываем исходный цвет как data-атрибут
    stops.forEach((stop) => {
        const orig = readStopColor(stop);
        if (orig) stop.setAttribute('data-original-color', orig);
    });
    return {
        index,
        svgRoot,
        gradient,
        stops,
        stopCount: stops.length,
    };
}

export async function injectStripes(container) {
    const nodes = await Promise.all(STRIPES.map((f, i) => loadStripe(f, i)));
    const frag = document.createDocumentFragment();
    nodes.forEach((n) => frag.appendChild(n));
    container.appendChild(frag);

    // Сбор stripeMap после инжекта
    stripeMap = nodes
        .map((node, i) => {
            const svg = node.querySelector('svg');
            return svg ? buildStripeEntry(svg, i) : null;
        })
        .filter(Boolean);

    return nodes;
}
