import type { EmoteTab } from './constants.ts'
import { html } from 'code-tag'
import { PROVIDER_TO_ICON_MAP, PROVIDER_TO_NAME_MAP, PROVIDER_TO_TAB_CLASS_MAP } from './constants.ts'
import styles from './emotes.module.css'

export function renderEmoteTabs(tab: EmoteTab, isActive: boolean, isVisible = true): string {
	return html`
		<li
			class="${styles.tab} ${PROVIDER_TO_TAB_CLASS_MAP[tab]} ${isActive ? styles.tabActive : ''} ${isVisible
				? ''
				: styles.tabHidden}"
			data-tab="${tab}"
		>
			<div class="${styles.tabIcon}">${PROVIDER_TO_ICON_MAP[tab]}</div>
			<div class="${styles.tabName}">${PROVIDER_TO_NAME_MAP[tab]}</div>
		</li>
	`
}
