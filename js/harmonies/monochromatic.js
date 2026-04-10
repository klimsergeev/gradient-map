// Monochromatic: hue фиксирован, варьируются L (±20/±15) и синхронно S (±10/±5).
// Тёмные стопы менее насыщенные (естественная тень). Jitter ±3% по L на полоску.

import { applyRotationalHarmony } from './_rotational.js';

const L_VARIANTS_3 = [
    [-20,   0,  20],
    [ 20,   0, -20],
];
const S_VARIANTS_3 = [
    [-10,   0,  10],
    [ 10,   0, -10],
];
const L_VARIANTS_2 = [
    [-15,  15],
    [ 15, -15],
];
const S_VARIANTS_2 = [
    [-5,  5],
    [ 5, -5],
];

export function applyMonochromatic(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: [[0, 0, 0]],
        offsets2: [0, 0],
        lDeltas3: L_VARIANTS_3,
        lDeltas2: L_VARIANTS_2,
        sDeltas3: S_VARIANTS_3,
        sDeltas2: S_VARIANTS_2,
        baseMap: options.baseMap,
        jitter: 3,
        jitterMode: 'lightness',
    });
}
