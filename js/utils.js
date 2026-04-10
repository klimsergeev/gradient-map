// Утилиты работы с изображениями.
// compressImage: даунскейлит картинку и итеративно подбирает quality,
// пока dataUrl не станет <= targetBytes. Учитывает EXIF-ориентацию и
// Safari fallback (если webp не поддерживается canvas'ом, отдаёт jpeg).

const MAX_WIDTH = 1280;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45];

export async function compressImage(file, targetBytes = 400_000) {
    const bitmap = await decodeImage(file);
    const srcW = bitmap.width;
    const srcH = bitmap.height;

    const ratio = Math.min(1, MAX_WIDTH / srcW);
    const w = Math.max(1, Math.round(srcW * ratio));
    const h = Math.max(1, Math.round(srcH * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);

    // Освобождаем ресурсы bitmap'а, если это ImageBitmap.
    if (bitmap.close) bitmap.close();

    // Проверяем webp-поддержку: если Safari вернёт png — fallback на jpeg.
    const probe = canvas.toDataURL('image/webp', 0.8);
    const webpSupported = probe.startsWith('data:image/webp');
    const mime = webpSupported ? 'image/webp' : 'image/jpeg';

    let last = null;
    for (const q of QUALITY_STEPS) {
        const url = canvas.toDataURL(mime, q);
        last = url;
        // Приблизительный размер в байтах: base64 → length * 0.75.
        const bytes = Math.round(url.length * 0.75);
        if (bytes <= targetBytes) return url;
    }
    return last;
}

async function decodeImage(file) {
    // createImageBitmap с imageOrientation: 'from-image' учитывает EXIF.
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(file, { imageOrientation: 'from-image' });
        } catch (e) {
            // падаем в фолбэк
        }
    }
    // Фолбэк через HTMLImageElement + decode().
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        if (img.decode) {
            await img.decode();
        } else {
            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
            });
        }
        // Эмулируем интерфейс { width, height } для drawImage.
        return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } finally {
        // Отзовём URL чуть позже, чтобы drawImage успел отработать.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}
