import { html } from 'code-tag'
import styles from './select.module.css'

export interface SelectOption<T extends string = string> {
	value: T
	label: string
}

export function renderSelect<T extends string = string>(
	id: string,
	options?: Array<SelectOption<T>>,
	selectedValue?: T,
): string {
	const optionsHtml = options
		? options
				.map(
					opt =>
						`<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.label}</option>`,
				)
				.join('')
		: ''

	return html`
		<select name="${id}" class="${styles.select}">
			${optionsHtml}
		</select>`
}
