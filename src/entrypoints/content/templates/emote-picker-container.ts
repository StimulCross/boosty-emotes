import styles from './emote-picker-container.module.css'

export function createEmotePickerContainer(): HTMLDivElement {
	const el = document.createElement('div')

	el.classList.add(styles.root)

	return el
}
