import type { CommandMessage, EventMessage } from '@shared/messaging'
import { BOOSTY_MATCH_URL } from '@shared/constants.ts'
import { createAppLogger } from '@shared/utils'

export class MessageDispatcher {
	private readonly _logger = createAppLogger('MessageDispatcher')

	public async sendCommand<T extends CommandMessage, R = unknown>(command: T): Promise<R> {
		this._logger.debug(`Sending command: [${command.type}]`)

		try {
			return await browser.runtime.sendMessage<T, R>(command)
		}
		catch (err) {
			this._logger.error(`Command [${command.type}] failed:`, err)
			throw err
		}
	}

	public broadcastEvent<T extends EventMessage>(event: T): void {
		this._logger.debug(`Broadcasting event: [${event.type}]`, event)

		browser.runtime.sendMessage(event).catch((err: unknown) => {
			if (err instanceof Error && err.message.includes('Receiving end does not exist'))
				return

			this._logger.warn(`Failed to broadcast event [${event.type}]:`, event, err)
		})

		browser.tabs.query({ url: BOOSTY_MATCH_URL })
			.then(tabs => {
				for (const tab of tabs) {
					if (tab.id === undefined)
						continue

					browser.tabs.sendMessage(tab.id, event)
						.catch(err => this._logger.error(`Failed to broadcast event [${event.type}]`, err))
				}
			})
			.catch(err => this._logger.error('Failed to query tabs', err))
	}
}
