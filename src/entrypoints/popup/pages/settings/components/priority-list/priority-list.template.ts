import { html } from 'code-tag'
import { arrowDownSvg } from './assets/arrow-down-svg.ts'
import { arrowUpSvg } from './assets/arrow-up-svg.ts'
import { dragIconSvg } from './assets/drag-icon-svg.ts'
import styles from './priority-list.module.css'

export function renderPriorityList(id: string, providers: string[]): string {
	const itemsHtml = providers
		.map((provider, index) => {
			const isFirst = index === 0
			const isLast = index === providers.length - 1

			return html`
				<li
					class="${styles.item}"
					data-provider="${provider}"
					data-index="${String(index)}"
					draggable="true"
				>
					<div class="${styles.itemLeft}">
						<span class="${styles.dragHandle}" aria-hidden="true">${dragIconSvg}</span>
						<span class="${styles.itemName}">${provider}</span>
					</div>
					<div class="${styles.controls}">
						<button
							type="button"
							class="${styles.controlButton}"
							data-index="${String(index)}"
							data-action="move-up"
							${isFirst ? 'disabled' : ''}
							aria-label="Move Up"
						>
							${arrowUpSvg}
						</button>
						<button
							type="button"
							class="${styles.controlButton}"
							data-index="${String(index)}"
							data-action="move-down"
							${isLast ? 'disabled' : ''}
							aria-label="Move Down"
						>
							${arrowDownSvg}
						</button>
					</div>
				</li>
		`
		})
		.join('')

	return html`<ul id="${id}" class="${styles.list}">
			${itemsHtml}
		</ul>`
}
