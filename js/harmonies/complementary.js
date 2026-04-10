// Complementary harmony: base + 180°. Два симметричных варианта для 3-stop.

import { applyRotationalHarmony } from './_rotational.js';

const VARIANTS_3 = [
    [  0, 180,   0],
    [180,   0, 180],
];
const OFFSETS_2 = [0, 180];

export function applyComplementary(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: VARIANTS_3,
        offsets2: OFFSETS_2,
        lDeltas3: [0, -5, 0],
        lDeltas2: [0, 0],
        baseMap: options.baseMap,
    });
}
