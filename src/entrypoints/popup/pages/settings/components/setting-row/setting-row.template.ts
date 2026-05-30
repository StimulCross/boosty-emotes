import type { SettingsState } from '../../settings.view.ts'
import { html } from 'code-tag'
import styles from './setting-row.module.css'

export function renderSettingRow(
	id: keyof SettingsState,
	label: string,
	controlHtml: string,
	description?: string,
	layout?: 'row' | 'column',
): string {
	return html`
		<div class="${styles.row} ${layout === 'column' ? styles.rowColumn : ''}">
			<div class="${styles.textInfo}">
				<label for="${id}" class="${styles.label}">${label}</label>
				${description ? html`<span class="${styles.description}">${description}</span>` : ''}
			</div>
			<div class="${styles.control}">${controlHtml}</div>
		</div>
	`
}
