import { createLogger } from '@stimulcross/logger';
import browser, { type Tabs } from 'webextension-polyfill';
import { BOOSTY_HOST_NAME } from '@shared/constants';
import type { MessageTabUrlChange } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { handleSendMessageError } from './utils';

export class TabsObserver {
	private readonly _logger = createLogger(createLoggerOptions(TabsObserver.name));

	public initListeners(): void {
		browser.tabs.onUpdated.addListener((tabId, changeInfo: Tabs.OnUpdatedChangeInfoType) => {
			if (!changeInfo.url) {
				return;
			}

			const url = new URL(changeInfo.url);

			if (url.hostname !== BOOSTY_HOST_NAME) {
				return;
			}

			browser.tabs
				.sendMessage(tabId, {
					type: 'tab_url_change',
					data: { url: changeInfo.url }
				} satisfies MessageTabUrlChange)
				.catch(e => handleSendMessageError(e, this._logger));
		});
	}
}
