import { html } from 'code-tag'
import styles from './number-input.module.css'

export function renderNumberInput(id: string, min?: number, max?: number, defaultValue?: number): string {
	const minAttr = min === undefined ? '' : `min="${min}"`
	const maxAttr = max === undefined ? '' : `max="${max}"`

	return html`
		<input
			type="number"
			name="${id}"
			${defaultValue ? `value=${String(defaultValue)}` : ''}
			${minAttr}
			${maxAttr}
			class="${styles.input}"
		/>`
}
