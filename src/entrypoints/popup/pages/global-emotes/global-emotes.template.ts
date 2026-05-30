import { html } from 'code-tag'
import styles from './global-emotes.module.css'

export function renderGlobalEmotes(): string {
	return html`
		<div class="${styles.emotes}" data-slot="emotes"></div>
	`
}
