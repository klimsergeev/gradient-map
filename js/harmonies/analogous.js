// Analogous harmony: base ±25° (3-stop) / ±15° (2-stop) + jitter ±10° на полоску.

import { applyRotationalHarmony } from './_rotational.js';

const ANGLE_3 = 25;
const ANGLE_2 = 15;

export function applyAnalogous(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: [[-ANGLE_3, 0, +ANGLE_3]],
        offsets2: [-ANGLE_2, +ANGLE_2],
        lDeltas3: [0, -5, 0],
        lDeltas2: [0, 0],
        baseMap: options.baseMap,
    });
}
