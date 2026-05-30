import { html } from 'code-tag'
import styles from './toggle.module.css'

export function renderToggle(id: string, isChecked?: boolean): string {
	return html`
		<label class="${styles.toggle}">
			<input type="checkbox" name="${id}" ${isChecked !== undefined && isChecked ? 'checked' : ''} />
			<span class="${styles.slider}"></span>
		</label>
	
	`
}
