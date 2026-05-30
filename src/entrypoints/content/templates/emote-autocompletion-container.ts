import styles from './emote-autocompletion-container.module.css'

export function createEmoteAutocompletionContainer(): HTMLDivElement {
	const el = document.createElement('div')
	el.classList.add(styles.root)

	return el
}
