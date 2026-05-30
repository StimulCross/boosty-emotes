import { html } from 'code-tag'
import styles from './user-profile.module.css'

export function renderUserProfile(): string {
	return html`
		<div class="${styles.header}" data-slot="profile-header"></div>
		<div class="${styles.emotes}" data-slot="emotes"></div>
	`
}
