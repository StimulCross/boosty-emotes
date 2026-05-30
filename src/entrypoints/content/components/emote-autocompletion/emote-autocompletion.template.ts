import { html } from 'code-tag'
import styles from './emote-autocompletion.module.css'

export function renderEmoteAutocompletion(): string {
	return html`
		<ul class="${styles.matches}"></ul>
	`
}
