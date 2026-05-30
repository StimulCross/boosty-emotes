import type { AlertKind } from '@shared/models/alert.ts'
import type { AlertViewModel } from './alerts.template.ts'
import { View } from '@shared/ui/view.ts'
import styles from './alerts.module.css'
import { renderAlert } from './alerts.template.ts'

export interface AlertsViewProps {
	onCloseAlert: (kind: AlertKind) => Promise<void>
}

export interface AlertsViewState {
	alerts: AlertViewModel[]
}

export class AlertsView extends View<AlertsViewProps> {
	constructor(props: AlertsViewProps) {
		super('div', props, styles.root)
	}

	public render(state: AlertsViewState): void {
		this.$root.innerHTML = state.alerts.map(renderAlert).join('')
	}

	public removeAlertNode(kind: AlertKind): void {
		const alertNode = this.$root.querySelector(`[data-kind="${kind}"]`)

		if (alertNode)
			alertNode.remove()
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._onClick)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._onClick)
	}

	private readonly _onClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const removeButton = evt.target.closest<HTMLButtonElement>(`.${styles.closeButton}`)

		if (removeButton) {
			removeButton.disabled = true

			const alert = removeButton.closest<HTMLDivElement>(`.${styles.alert}`)
			const kind = alert?.dataset.kind as AlertKind | undefined

			if (kind)
				void this._props.onCloseAlert(kind)
		}
	}
}
