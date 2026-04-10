// Tetradic: 4 вершины квадрата (0/90/180/270). Берём 3 подряд для 3-stop,
// смежные вершины (четверть) для 2-stop.

import { applyRotationalHarmony } from './_rotational.js';

const VARIANTS_3 = [
    [  0,  90, 180],
    [ 90, 180, 270],
    [180, 270,   0],
    [270,   0,  90],
];
const VARIANTS_2 = [
    [  0,  90],
    [ 90, 180],
    [180, 270],
    [270,   0],
];

export function applyTetradic(palette, stripeMap, rng, options = {}) {
    applyRotationalHarmony(palette, stripeMap, rng, {
        offsets3Variants: VARIANTS_3,
        offsets2Variants: VARIANTS_2,
        lDeltas3: [0, -5, 0],
        lDeltas2: [0, 0],
        baseMap: options.baseMap,
    });
}
