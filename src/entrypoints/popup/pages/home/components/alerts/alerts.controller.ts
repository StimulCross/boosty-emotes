import type { Alert, AlertKind } from '@shared/models'
import type { Controller } from '@shared/ui'
import type { AlertViewModel } from './alerts.template.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { AlertsView } from './alerts.view.ts'

const DAY = 1000 * 60 * 60 * 24

export interface AlertsControllerOptions {
	onEmpty: () => void
}

export class AlertsController implements Controller {
	private readonly _logger = createAppLogger('AlertsController')
	private readonly _view: AlertsView
	private _isMounted = false
	private _activeAlertsCount = 0

	constructor(private readonly _options: AlertsControllerOptions) {
		this._view = new AlertsView({
			onCloseAlert: async (kind: AlertKind) => await this._handleCloseAlert(kind),
		})
	}

	public async init(): Promise<void> {
		await this.refresh()
	}

	public mount(container: HTMLElement): void {
		if (!this._isMounted) {
			this._view.mount(container)
			this._isMounted = true
		}
	}

	public unmount(): void {
		if (this._isMounted) {
			this._view.unmount()
			this._isMounted = false
		}
	}

	public async refresh(): Promise<void> {
		const alerts = await storage.alerts.getAll()
		const activeAlerts = this._filterActiveAlerts(alerts)

		this._activeAlertsCount = activeAlerts.length

		if (this._activeAlertsCount === 0) {
			this._view.render({ alerts: [] })
			this._options.onEmpty()

			return
		}

		const viewModels: AlertViewModel[] = activeAlerts.map(alert => ({
			type: alert.type,
			kind: alert.kind,
			isCloseable: alert.isCloseable,
			message: this._getAlertMessage(alert.kind),
		}))

		this._view.render({ alerts: viewModels })
	}

	private async _handleCloseAlert(kind: AlertKind): Promise<void> {
		this._view.removeAlertNode(kind)
		this._activeAlertsCount -= 1

		if (this._activeAlertsCount <= 0)
			this._options.onEmpty()

		try {
			const alerts = await storage.alerts.getAll()

			const newAlerts = alerts.map(alert =>
				// eslint-disable-next-line ts/no-unnecessary-condition
				alert.kind === kind ? { ...alert, isClosed: true, closedAt: Date.now() } : alert)

			await storage.alerts.setAll(newAlerts)
		}
		catch (err) {
			this._logger.error('Failed to close alert in store', err)
			await this.refresh()
		}
	}

	private _filterActiveAlerts(alerts: Alert[]): Alert[] {
		const now = Date.now()

		return alerts.filter(alert => {
			if (!alert.isCloseable || !alert.closedAt)
				return true

			return now - alert.closedAt > DAY
		})
	}

	private _getAlertMessage(kind: AlertKind): string {
		switch (kind) {
			// eslint-disable-next-line ts/no-unnecessary-condition
			case 'twitchTokenExpired':
				return browser.i18n.getMessage('alerts_twitch_token_expired')

			default:
				throw new Error(`Unknown alert kind: ${String(kind)}`)
		}
	}
}
