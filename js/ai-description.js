import { AI_CONFIG, PRESETS, STORAGE_KEYS } from './config.js';
import { readLS, writeLS } from './storage.js';
import { SYSTEM_PROMPT, USER_TEXT } from './ai-prompt.js';

let h1El = null;
let subtitleEl = null;
let ORIGINAL_H1 = '';
let ORIGINAL_SUBTITLE = '';
let isFirstLoad = true;
let currentAbort = null;
let requestId = 0;

// ---------- public ----------

export function initAiDescription() {
    if (!AI_CONFIG.apiKey) {
        console.info('[ai-description] No API key — AI generation disabled. Pass ?key=sk-or-v1-... in URL.');
        return;
    }
    h1El = document.querySelector('.banner__h1');
    subtitleEl = document.querySelector('.banner__subtitle');
    if (!h1El || !subtitleEl) return;
    ORIGINAL_H1 = h1El.textContent;
    ORIGINAL_SUBTITLE = subtitleEl.innerHTML;
    document.addEventListener('banner:image-changed', onImageChanged);
}

// ---------- event handler ----------

async function onImageChanged(ev) {
    const src = ev?.detail?.src;
    if (!src) return;

    // Первая загрузка — оставляем оригинальный текст
    if (isFirstLoad) {
        isFirstLoad = false;
        return;
    }

    const myReq = ++requestId;

    // Отменяем предыдущий запрос
    abortPrevious();

    // Проверяем кеш (только для пресетов)
    const cacheKey = getCacheKey(src);
    if (cacheKey) {
        const raw = readLS(cacheKey);
        if (raw) {
            try {
                const cached = JSON.parse(raw);
                if (cached.genre && cached.title && cached.description) {
                    showCached(cached);
                    return;
                }
            } catch { /* невалидный кеш — идём дальше */ }
        }
    }

    // Показываем скелетон
    showSkeleton();

    try {
        const parsed = await requestAiDescription(src, myReq);
        // Если за время запроса пришла новая картинка — не обновляем UI
        if (myReq !== requestId) return;

        if (parsed && parsed.title) {
            finalize(parsed);
            // Кешируем для пресетов
            if (cacheKey) {
                writeLS(cacheKey, JSON.stringify(parsed));
            }
        } else {
            restoreOriginal();
        }
    } catch (err) {
        if (err.name === 'AbortError') return; // тихий выход
        console.warn('[ai-description]', err);
        if (myReq === requestId) restoreOriginal();
    }
}

// ---------- API ----------

async function requestAiDescription(src, myReq) {
    const controller = new AbortController();
    currentAbort = controller;

    // Timeout через setTimeout (без AbortSignal.any — Safari < 17.4)
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

    try {
        const base64 = await compressForAi(src, AI_CONFIG.maxImageSide);

        const body = {
            model: AI_CONFIG.model,
            stream: true,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: base64 } },
                        { type: 'text', text: USER_TEXT },
                    ],
                },
            ],
        };

        const response = await fetch(AI_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            console.warn('[ai-description] API error:', response.status);
            return null;
        }

        const fullText = await streamReader(response, controller.signal);

        // Анимированный посимвольный вывод на нашей стороне
        if (myReq === requestId) {
            await typewriterReveal(fullText, myReq);
        }

        return parseAiResponse(fullText);
    } finally {
        clearTimeout(timeoutId);
        if (currentAbort === controller) currentAbort = null;
    }
}

// ---------- SSE streaming ----------

async function streamReader(response, signal) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
        while (true) {
            if (signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const parsed = parseSSELine(line);
                if (!parsed) continue;
                if (parsed.done) return fullText;
                if (parsed.content) {
                    fullText += parsed.content;
                }
            }
        }
    } finally {
        try { reader.cancel(); } catch { /* ignore */ }
    }

    return fullText;
}

// Вывод случайными порциями — имитация реального streaming
async function typewriterReveal(fullText, myReq) {
    const TICK = 55;      // мс между порциями
    const MAX_CHARS = 8;  // макс символов за тик (0–8)
    let pos = 0;

    while (pos < fullText.length) {
        if (myReq !== requestId) return;
        const chunk = Math.floor(Math.random() * (MAX_CHARS + 1)); // 0–8
        pos = Math.min(pos + Math.max(chunk, 1), fullText.length); // минимум 1, чтобы не зависнуть
        updateFromStream(fullText.slice(0, pos));
        await new Promise(r => setTimeout(r, TICK));
    }
}

function parseSSELine(line) {
    if (!line.startsWith('data: ')) return null;
    const payload = line.slice(6).trim();
    if (payload === '[DONE]') return { done: true };
    try {
        const obj = JSON.parse(payload);
        return { content: obj.choices?.[0]?.delta?.content ?? '' };
    } catch {
        return null;
    }
}

// ---------- parsing ----------

function parseAiResponse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let genre = '', title = '', descParts = [];
    let inDescription = false;

    for (const line of lines) {
        if (line.startsWith('ЖАНР:')) { genre = line.slice(5).trim(); inDescription = false; }
        else if (line.startsWith('НАЗВАНИЕ:')) { title = line.slice(9).trim(); inDescription = false; }
        else if (line.startsWith('ОПИСАНИЕ:')) { descParts = [line.slice(9).trim()]; inDescription = true; }
        else if (inDescription) { descParts.push(line); }
    }

    const description = descParts.join(' ');
    if (!title && !description) return null;
    return { genre, title, description };
}

// ---------- image compression ----------

async function compressForAi(src, maxSide = 512) {
    const img = await loadImg(src);
    const scale = Math.min(maxSide / img.naturalWidth, maxSide / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/webp', 0.8);
}

function loadImg(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const t = setTimeout(() => reject(new Error('image load timeout')), 5000);
        img.addEventListener('load', () => { clearTimeout(t); resolve(img); }, { once: true });
        img.addEventListener('error', () => { clearTimeout(t); reject(new Error('image load error')); }, { once: true });
        img.src = src;
        if (img.complete && img.naturalWidth > 0) {
            clearTimeout(t);
            resolve(img);
        }
    });
}

// ---------- UI ----------

function showSkeleton() {
    // Оставляем предыдущий текст видимым, просто пульсируем
    h1El.classList.add('banner__h1--skeleton');
    subtitleEl.classList.add('banner__subtitle--skeleton');
}

function updateFromStream(fullText) {
    const lines = fullText.split('\n');
    let genre = '', title = '', descParts = [];
    let inDescription = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('ЖАНР:')) { genre = trimmed.slice(5).trim(); inDescription = false; }
        else if (trimmed.startsWith('НАЗВАНИЕ:')) { title = trimmed.slice(9).trim(); inDescription = false; }
        else if (trimmed.startsWith('ОПИСАНИЕ:')) { descParts = [trimmed.slice(9).trim()]; inDescription = true; }
        else if (inDescription && trimmed) { descParts.push(trimmed); }
    }

    const description = descParts.join(' ');

    if (genre || title) {
        h1El.classList.remove('banner__h1--skeleton');
        const parts = [];
        if (genre) parts.push(genre);
        if (title) parts.push(`\u00AB${title}\u00BB`);
        h1El.textContent = parts.join(' ');
    }

    if (description) {
        subtitleEl.classList.remove('banner__subtitle--skeleton');
        subtitleEl.textContent = description;
    }
}

function finalize(parsed) {
    h1El.classList.remove('banner__h1--skeleton');
    subtitleEl.classList.remove('banner__subtitle--skeleton');
    h1El.textContent = `${parsed.genre} \u00AB${parsed.title}\u00BB`;
    subtitleEl.textContent = parsed.description;
}

function showCached(cached) {
    h1El.classList.remove('banner__h1--skeleton');
    subtitleEl.classList.remove('banner__subtitle--skeleton');
    h1El.textContent = `${cached.genre} \u00AB${cached.title}\u00BB`;
    subtitleEl.textContent = cached.description;
}

function restoreOriginal() {
    h1El.classList.remove('banner__h1--skeleton');
    subtitleEl.classList.remove('banner__subtitle--skeleton');
    h1El.textContent = ORIGINAL_H1;
    subtitleEl.innerHTML = ORIGINAL_SUBTITLE;
}

// ---------- helpers ----------

function abortPrevious() {
    if (currentAbort) {
        currentAbort.abort();
        currentAbort = null;
    }
}

function getCacheKey(src) {
    const preset = PRESETS.find((p) => src.endsWith(p.original));
    return preset ? STORAGE_KEYS.aiPresetPrefix + preset.id : null;
}
