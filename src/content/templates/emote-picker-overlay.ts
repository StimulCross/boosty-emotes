export function createEmotePickerOverlay(zIndex?: string): HTMLDivElement {
	const el = document.createElement('div');
	el.classList.add('BE-emote-picker__overlay');

	if (zIndex) {
		el.style.zIndex = zIndex;
	}

	return el;
}
