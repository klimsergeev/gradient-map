import { LIMITS, STORAGE_KEYS } from './config.js';
import { compressImage } from './utils.js';
import { setImage } from './banner.js';
import { clearSelection } from './presets.js';
import { suppressHoverUntilLeave } from './dropzone.js';
import { writeLS } from './storage.js';
import { toast } from './errors.js';

export async function handleFile(file) {
    if (!file) return;

    if (!LIMITS.mimes.includes(file.type)) {
        toast('Только JPEG, PNG или WebP');
        return;
    }
    if (file.size > LIMITS.maxBytes) {
        toast('Максимум 5 МБ');
        return;
    }

    try {
        const dataUrl = await compressImage(file);
        setImage(dataUrl);
        clearSelection();
        suppressHoverUntilLeave();
        const ok = writeLS(STORAGE_KEYS.lastUpload, dataUrl);
        if (!ok) {
            toast('Не удалось сохранить — после перезагрузки пропадёт');
        }
    } catch (err) {
        console.error('[upload] failed:', err);
        toast('Не удалось загрузить изображение');
    }
}
