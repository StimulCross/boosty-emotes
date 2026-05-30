import { html } from 'code-tag'
import styles from './add-user.module.css'

export function renderAddUser(): string {
	return html`
		<div class="${styles.form}" data-slot="form"></div>
	`
}
