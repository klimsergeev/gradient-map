// Полноценный toast: создаёт <div class="toast toast--${type}"> в #toast-stack,
// удаляет через 4 с с анимацией fade-out.

const LIFETIME_MS = 4000;
const FADEOUT_MS = 200;

let stackEl = null;

function ensureStack() {
    if (!stackEl) stackEl = document.querySelector('#toast-stack');
    return stackEl;
}

export function toast(message, type = 'error') {
    const stack = ensureStack();
    if (!stack) {
        console.warn('[' + type + '] ' + message);
        return;
    }

    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = message;
    stack.appendChild(el);

    setTimeout(() => {
        el.classList.add('toast--leaving');
        setTimeout(() => el.remove(), FADEOUT_MS);
    }, LIFETIME_MS);
}
