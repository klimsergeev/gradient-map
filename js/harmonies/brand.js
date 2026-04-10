// Brand mode: восстанавливаем исходные цвета из data-original-color.

export function applyBrand(_palette, stripeMap) {
    stripeMap.forEach((entry) => {
        entry.stops.forEach((stop) => {
            const original = stop.getAttribute('data-original-color');
            if (original) {
                stop.setAttribute('stop-color', original);
                // Часть SVG имеют inline style с stop-color — перезатираем
                if (stop.style && stop.style.stopColor !== undefined) {
                    stop.style.stopColor = original;
                }
            }
        });
    });
}
