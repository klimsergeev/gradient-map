// Общий движок для «поворотных» гармоний (analogous, triadic, и будущих).
// Базовый принцип: на каждую полоску берём base из baseMap, добавляем jitter,
// формируем hueOffsets для стопов, применяем clampSL + L-дельты, ч/б фолбэк,
// прозрачные стопы наследуют hue ближайшего непрозрачного соседа.

import {
    DISTRIBUTIONS,
    hexToHsl,
    hslToHex,
    clampSL,
} from '../color-utils.js';

const DEFAULT_BASE_MAP = DISTRIBUTIONS.mix.map;
const JITTER_DEFAULT = 10;
const JITTER_NEIGHBOR_MIN_HUE = 5;
const JITTER_NEIGHBOR_MIN_LIGHTNESS = 1.5;
const JITTER_MAX_RETRIES = 5;

// Обёртка «плоский массив → массив из одного варианта». Если уже multi-variant
// (массив массивов), возвращаем как есть.
function toVariants(value, fallback) {
    if (value === undefined || value === null) return fallback;
    if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) return value;
    return [value];
}

/**
 * @param {string[]} palette
 * @param {Array<{index:number, stops:SVGStopElement[]}>} stripeMap
 * @param {() => number} rng seeded RNG
 * @param {object} options
 * @param {number[][]} [options.offsets3Variants] — варианты hueOffsets для 3-stop
 * @param {number[]|number[][]} [options.offsets2] — hueOffsets для 2-stop (плоский или варианты)
 * @param {number[][]} [options.offsets2Variants] — явный multi-variant для 2-stop
 * @param {number[]|number[][]} [options.lDeltas3]
 * @param {number[]|number[][]} [options.lDeltas2]
 * @param {number[]|number[][]} [options.sDeltas3]
 * @param {number[]|number[][]} [options.sDeltas2]
 * @param {number[]} [options.baseMap]
 * @param {number} [options.jitter=10]
 * @param {'hue'|'lightness'} [options.jitterMode='hue']
 */
export function applyRotationalHarmony(palette, stripeMap, rng, options) {
    const {
        offsets3Variants,
        offsets2,
        offsets2Variants,
        lDeltas3,
        lDeltas2,
        sDeltas3,
        sDeltas2,
        baseMap = DEFAULT_BASE_MAP,
        jitter: jitterAmp = JITTER_DEFAULT,
        jitterMode = 'hue',
    } = options;

    const offs3V = toVariants(offsets3Variants, [[0, 0, 0]]);
    const offs2V = toVariants(offsets2Variants ?? offsets2, [[0, 0]]);
    const l3V = toVariants(lDeltas3, [[0, -5, 0]]);
    const l2V = toVariants(lDeltas2, [[0, 0]]);
    const s3V = toVariants(sDeltas3, [[0, 0, 0]]);
    const s2V = toVariants(sDeltas2, [[0, 0]]);

    const neighborMin =
        jitterMode === 'lightness'
            ? JITTER_NEIGHBOR_MIN_LIGHTNESS
            : JITTER_NEIGHBOR_MIN_HUE;

    const prevJitterByBase = new Map();

    stripeMap.forEach((entry) => {
        const baseIdx = baseMap[entry.index] ?? 0;
        const baseHex = palette[baseIdx] || palette[0];
        const { h: baseH, s: baseS, l: baseL } = hexToHsl(baseHex);

        // jitter: избегаем близости с соседним той же base (max 5 попыток)
        let jitter = 0;
        for (let attempt = 0; attempt < JITTER_MAX_RETRIES; attempt++) {
            jitter = (rng() * 2 - 1) * jitterAmp;
            const prev = prevJitterByBase.get(baseIdx);
            if (prev === undefined || Math.abs(jitter - prev) >= neighborMin) break;
        }
        prevJitterByBase.set(baseIdx, jitter);

        const stops = entry.stops;
        const count = stops.length;

        // Выбор варианта — один и тот же индекс для hue/L/S, чтобы синхронизировать
        // (важно для mono: тёмные стопы должны быть менее насыщенными).
        let hueOffsets;
        let lDeltas;
        let sDeltas;
        if (count === 3) {
            const variantIdx =
                offs3V.length > 1 ? Math.floor(rng() * offs3V.length) : 0;
            hueOffsets = offs3V[variantIdx];
            lDeltas = l3V[variantIdx % l3V.length];
            sDeltas = s3V[variantIdx % s3V.length];
        } else {
            const variantIdx =
                offs2V.length > 1 ? Math.floor(rng() * offs2V.length) : 0;
            hueOffsets = offs2V[variantIdx];
            lDeltas = l2V[variantIdx % l2V.length];
            sDeltas = s2V[variantIdx % s2V.length];
        }

        // Jitter mode: hue — добавляется к H, lightness — к baseL целиком.
        const hueJitter = jitterMode === 'hue' ? jitter : 0;
        const lJitter = jitterMode === 'lightness' ? jitter : 0;

        const isGray = baseS < 5;
        const targets = hueOffsets.map((off, i) => {
            if (isGray) {
                const l = Math.max(15, Math.min(85, baseL + lDeltas[i] + lJitter));
                return { h: 0, s: 0, l };
            }
            const h = baseH + off + hueJitter;
            const { s, l } = clampSL(baseS + sDeltas[i], baseL + lDeltas[i] + lJitter);
            return { h, s, l };
        });

        // Прозрачные стопы наследуют hue от ближайшего непрозрачного
        const opacities = stops.map((s) => {
            const attr = s.getAttribute('stop-opacity');
            const style = s.style && s.style.stopOpacity;
            const v = attr ?? style;
            return v === null || v === undefined || v === '' ? 1 : parseFloat(v);
        });

        for (let i = 0; i < count; i++) {
            if (opacities[i] !== 0) continue;
            let donor = -1;
            for (let d = 1; d < count; d++) {
                if (i - d >= 0 && opacities[i - d] !== 0) { donor = i - d; break; }
                if (i + d < count && opacities[i + d] !== 0) { donor = i + d; break; }
            }
            if (donor >= 0) targets[i].h = targets[donor].h;
        }

        stops.forEach((stop, i) => {
            const { h, s, l } = targets[i];
            const hex = '#' + hslToHex(h, s, l);
            stop.setAttribute('stop-color', hex);
            if (stop.style && stop.style.stopColor !== undefined && stop.style.stopColor !== '') {
                stop.style.stopColor = hex;
            }
        });
    });
}
