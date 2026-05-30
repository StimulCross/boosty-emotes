import styles from './emote-picker-overlay.module.css'

export function createEmotePickerOverlay(zIndex?: string): HTMLDivElement {
	const el = document.createElement('div')

	el.dataset.type = 'emote-picker-overlay'
	el.classList.add(styles.root)

	if (zIndex)
		el.style.zIndex = zIndex

	return el
}
