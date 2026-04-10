// Список полосок В ПОРЯДКЕ ОТРИСОВКИ: первый — самый нижний,
// последний — самый верхний. Имена кодируют z-index (z1..z11),
// массив отсортирован по z по возрастанию.
export const STRIPES = [
    '279_scale_z1.svg',
    '279_scale_z2.svg',
    '756_scale_z3.svg',
    '136_left_z4.svg',
    '208_scale_z5.svg',
    '366_scale_z6.svg',
    '650_scale_z7.svg',
    '724_scale_z8.svg',
    '536_scale_z9.svg',
    '0_scale_z10.svg',
    '0_lr_z11.svg',
];

export const STRIPES_BASE = 'assets/svg/';

export const PRESETS = [
    { id: '1-aronova', preview: 'assets/images/previews/1-aronova.jpg', original: 'assets/images/originals/1-aronova.jpg', label: 'Спектакль «Актриса»' },
    { id: '2-bw',      preview: 'assets/images/previews/2-bw.jpg',      original: 'assets/images/originals/2-bw.jpg',      label: 'Чёрно-белое' },
    { id: '3-sobaka',  preview: 'assets/images/previews/3-sobaka.jpg',  original: 'assets/images/originals/3-sobaka.jpg',  label: 'Собака' },
    { id: '4-hudson',  preview: 'assets/images/previews/4-hudson.jpg',  original: 'assets/images/originals/4-hudson.jpg',  label: 'Хадсон' },
    { id: '5-collage', preview: 'assets/images/previews/5-collage.jpg', original: 'assets/images/originals/5-collage.jpg', label: 'Коллаж' },
    { id: '6-berezka', preview: 'assets/images/previews/6-berezka.jpg', original: 'assets/images/originals/6-berezka.jpg', label: 'Берёзка' },
];

export const DEFAULT_PRESET_ID = '1-aronova';

export const STORAGE_KEYS = {
    selectedPreset:      'gradient-map:selected-preset',
    lastUpload:          'gradient-map:last-upload',
    palettePresetPrefix: 'gradient-map:palette:preset:',
    paletteUpload:       'gradient-map:palette:upload',
    aiPresetPrefix:      'gradient-map:ai:preset:',
    aiUpload:            'gradient-map:ai:upload',
};

export const AI_CONFIG = {
    apiKey: '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',
    model: 'google/gemini-2.5-flash-lite',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    timeout: 30000,
    maxImageSide: 512,
};

export const LIMITS = {
    maxBytes: 5 * 1024 * 1024,
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
};
