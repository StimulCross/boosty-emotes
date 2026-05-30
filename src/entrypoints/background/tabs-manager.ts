import type { EventMessageTabUrlChange, Message } from '@shared/messaging'
import { BOOSTY_HOST_NAME } from '@shared/constants.ts'
import { createAppLogger } from '@shared/utils'
import { handleSendMessageError } from './utils'

const ANY_BOOSTY_TAB_URL = `*://*.${BOOSTY_HOST_NAME}/*`

export class TabsManager {
	private readonly _logger = createAppLogger('TabsManager')

	public init(): void {
		browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
			if (!changeInfo.url)
				return

			try {
				const url = new URL(changeInfo.url)

				if (url.hostname !== BOOSTY_HOST_NAME)
					return

				browser.tabs
					.sendMessage(tabId, {
						type: 'tab_url_change',
						data: { url: changeInfo.url },
					} satisfies EventMessageTabUrlChange)
					.catch(err => handleSendMessageError(err, this._logger))
			}
			catch (err) {
				this._logger.error('Failed to parse URL', err)
			}
		})
	}

	public async notifyTabs(message: Message, url = ANY_BOOSTY_TAB_URL): Promise<void> {
		try {
			const tabs = await browser.tabs.query({ url })

			for (const tab of tabs) {
				if (tab.id)
					browser.tabs.sendMessage(tab.id, message).catch(err => handleSendMessageError(err, this._logger))
			}
		}
		catch (err) {
			this._logger.error('Failed to query tabs for notification', err)
		}
	}
}
