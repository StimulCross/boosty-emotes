import { searchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import styles from './emotes.module.css'

export function renderEmotes(): string {
	return html`
		<div class="${styles.search}">
			<div class="${styles.searchIcon}">${searchIconSvg}</div>
			<input type="text" class="${styles.searchInput}" placeholder="${browser.i18n.getMessage('search_placeholder')}" />
		</div>
		<ul class="${styles.tabs}"></ul>
		<div class="${styles.body}"></div>
	`
}
