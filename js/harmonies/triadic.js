// Triadic harmony: классика 120°.
// 3-stop: рандомно per-stripe из 3 вариантов порядка стопов (через seeded RNG).
// 2-stop: симметрично [−60°, +60°].
// Jitter ±10°, clampSL, ч/б фолбэк, прозрачные стопы — как в analogous.

import { applyRotationalHarmony } from './_rotational.js';

const VARIANTS_3 = [
    [-120,   0, +120],
    [   0, +120, -120],
    [   0, +120,    0],
];
const OFFSETS_2 = [-60, +60];

export function applyTriadic(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: VARIANTS_3,
        offsets2: OFFSETS_2,
        lDeltas3: [0, -5, 0],
        lDeltas2: [0, 0],
        baseMap: options.baseMap,
    });
}
