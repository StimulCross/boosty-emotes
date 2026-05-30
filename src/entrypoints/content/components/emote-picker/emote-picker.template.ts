import { searchIconSvg } from '@shared/ui/assets/svg'
import { html } from 'code-tag'
import scrollStyles from '../../styles/scroll-container-y.module.css'
import styles from './emote-picker.module.css'

export function renderEmotePicker(): string {
	return html`
		<div class="${styles.search}">
			<div class="${styles.searchIcon}">${searchIconSvg}</div>
			<input type="text" class="${styles.searchInput}" placeholder="${browser.i18n.getMessage('search_placeholder')}"/>
		</div>
		<ul class="${styles.tabs}" data-slot="tabs"></ul>
		<div class="${styles.body} ${scrollStyles.scrollContainerY}" data-slot="body"></div>
	`
}
