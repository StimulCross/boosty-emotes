import { createSmileIconSvg } from '../assets/svg'
import styles from './emote-picker-button.module.css'

export function createEmotePickerButton(): HTMLButtonElement {
	const button = document.createElement('button')

	button.type = 'button'
	button.dataset.action = 'toggle-emote-picker'

	button.classList.add(styles.root)
	button.innerHTML = createSmileIconSvg(styles.icon)

	return button
}
