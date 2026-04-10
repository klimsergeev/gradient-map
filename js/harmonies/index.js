import { applyBrand } from './brand.js';
import { applyAnalogous } from './analogous.js';
import { applyComplementary } from './complementary.js';
import { applyMonochromatic } from './monochromatic.js';
import { applyTriadic } from './triadic.js';
import { applyTetradic } from './tetradic.js';
import { applySplitComplementary } from './splitComplementary.js';

export const HARMONIES = {
    brand:              { label: 'Brand',          apply: applyBrand,              enabled: true },
    analogous:          { label: 'Analogous',      apply: applyAnalogous,          enabled: true },
    complementary:      { label: 'Complementary',  apply: applyComplementary,      enabled: true },
    monochromatic:      { label: 'Monochromatic',  apply: applyMonochromatic,      enabled: true },
    triadic:            { label: 'Triadic',        apply: applyTriadic,            enabled: true },
    tetradic:           { label: 'Tetradic',       apply: applyTetradic,           enabled: true },
    splitComplementary: { label: 'Split comp.',    apply: applySplitComplementary, enabled: true },
};
