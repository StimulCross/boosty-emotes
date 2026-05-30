import { html } from 'code-tag'
import buttonStyles from '../../shared/styles/button.module.css'
import styles from './home.module.css'

export function renderHome(): string {
	return html`
		<div class="${styles.slot}" data-slot="alerts"></div>
		<div class="${styles.slot}" data-slot="user-list"></div>
		<button
			type="button"
			class="${buttonStyles.root} ${buttonStyles.primary} ${buttonStyles.medium} ${styles.fabButton}"
			data-action="add_user"
		>
			+
		</button>
	`
}
