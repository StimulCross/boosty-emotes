import { createAppLogger } from '@shared/utils'

export type AlarmHandler = (alarm: Browser.alarms.Alarm) => Promise<void> | void

export class AlarmsManager {
	private readonly _logger = createAppLogger('AlarmsManager')
	private readonly _handlers = new Map<string, AlarmHandler>()

	public init(): void {
		browser.alarms.onAlarm.addListener(alarm => {
			const handler = this._handlers.get(alarm.name)

			if (handler) {
				this._logger.debug(`Triggered alarm: ${alarm.name}`)

				Promise.resolve(handler(alarm)).catch(err => {
					this._logger.error(`Error handling alarm ${alarm.name}:`, err)
				})
			}
			else {
				this._logger.warn(`No handler registered for alarm: ${alarm.name}`)
			}
		})
	}

	public async registerAlarm(name: string, periodInMinutes: number, handler: AlarmHandler): Promise<void> {
		try {
			this._handlers.set(name, handler)

			const existingAlarm = await browser.alarms.get(name)

			if (existingAlarm)
				return

			await browser.alarms.create(name, { periodInMinutes })

			this._logger.debug(`Created alarm: ${name} (every ${periodInMinutes} min)`)
		}
		catch (err) {
			this._logger.error('Failed to register alarm', err)
		}
	}

	public async clearAlarm(name: string): Promise<boolean> {
		this._handlers.delete(name)

		return await browser.alarms.clear(name)
	}
}
