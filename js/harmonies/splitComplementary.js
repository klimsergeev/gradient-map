// Split Complementary: база + два цвета вокруг комплемента (+150°, +210°).

import { applyRotationalHarmony } from './_rotational.js';

const VARIANTS_3 = [
    [  0, 150, 210],
    [150,   0, 210],
    [210, 150,   0],
];
// 2-stop без базы — визуально отличает от Complementary.
const OFFSETS_2 = [150, 210];

export function applySplitComplementary(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: VARIANTS_3,
        offsets2: OFFSETS_2,
        lDeltas3: [0, -5, 0],
        lDeltas2: [0, 0],
        baseMap: options.baseMap,
    });
}
