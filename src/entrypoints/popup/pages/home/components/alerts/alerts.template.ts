import type { AlertKind, AlertType } from '@shared/models'
import { html } from 'code-tag'
import styles from './alerts.module.css'

export interface AlertViewModel {
	type: AlertType
	kind: AlertKind
	message: string
	isCloseable: boolean
}

export function renderAlert(alert: AlertViewModel): string {
	let icon: string

	switch (alert.type) {
		case 'danger':
			icon = 'error'

			break

		case 'warning':
			icon = 'warning'

			break

		case 'success':
			icon = 'check_circle'

			break

		default:
			icon = 'info'
	}

	return html`
        <div class="${styles.alert} ${styles[alert.type]}" data-kind="${alert.kind}">
			<div class="${styles.icon}">
				<span class="material-symbols-rounded">${icon}</span>
			</div>
			<div class="${styles.message}">${alert.message}</div>
			${alert.isCloseable
				? html`
                	    <button
							type="button"
							class="${styles.closeButton}"
							data-action="close-alert"
						>
							<span class="material-symbols-rounded">close</span>
						</button>
           		 `
				: ''}
		</div>
    `
}
