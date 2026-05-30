import styles from './action-buttons.module.css'
import { createEmotePickerButton } from './emote-picker-button.ts'

export function createActionButtons(): HTMLDivElement {
	const el = document.createElement('div')
	el.classList.add(styles.root)
	el.append(createEmotePickerButton())

	return el
}
