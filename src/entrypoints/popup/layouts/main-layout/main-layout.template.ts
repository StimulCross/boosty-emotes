import { html } from 'code-tag'
import styles from './main-layout.module.css'

export function renderMainLayout(): string {
	return html`
		<header data-slot="header"></header>
		<main class="${styles.content}" data-slot="content"></main>
		<footer data-slot="footer"></footer>
	`
}
