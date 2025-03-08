import { createLogger } from '@stimulcross/logger';
import semver from 'semver';
import browser from 'webextension-polyfill';
import { defaultEmoteAutocompletionSettings } from '@shared/constants';
import { Store } from '@shared/store';
import { createLoggerOptions } from '@shared/utils/create-logger-options';

export class ExtensionUpdateHandler {
	private readonly _logger = createLogger(createLoggerOptions(ExtensionUpdateHandler.name));

	public init(): void {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		browser.runtime.onInstalled.addListener(async details => {
			try {
				if (details.reason === 'update') {
					const previousVersion = details.previousVersion!;

					if (semver.lt(previousVersion, '0.1.0')) {
						await this._handleFavoriteEmotesUpdate();
						this._logger.success('Applied 0.1.0 updates');
					}

					if (semver.lt(previousVersion, '0.2.0')) {
						await this._handleEmoteAutocompletionUpdate();
						this._logger.success('Applied 0.2.0 updates');
					}

					if (semver.lt(previousVersion, '0.2.2')) {
						await this._handleChannelEmotesUpdateFix();
						this._logger.success('Applied 0.2.2 updates');
					}
				}
			} catch (e) {
				this._logger.error('Could not apply updates', e);
				throw e;
			}
		});
	}

	private async _handleFavoriteEmotesUpdate(): Promise<void> {
		const emotePickerState = await Store.getEmotePickerState();

		if (Object.prototype.hasOwnProperty.call(emotePickerState.sets, 'favorite')) {
			return;
		}

		emotePickerState.sets.favorite = { collapsed: { global: false, channel: false } };
		await Store.setEmotePickerState(emotePickerState);
	}

	private async _handleEmoteAutocompletionUpdate(): Promise<void> {
		await Store.updateEmoteAutocompletionSettings(defaultEmoteAutocompletionSettings);
	}

	private async _handleChannelEmotesUpdateFix(): Promise<void> {
		const users = await Store.getUsers();

		for (const user of users) {
			user.state.twitchEmotesUpdatedAt = 0;
			user.state.sevenTvEmotesUpdatedAt = 0;
			user.state.ffzEmotesUpdatedAt = 0;
			user.state.bttvEmotesUpdatedAt = 0;
			user.state.updatedAt = 0;

			await Store.setTwitchChannelEmotes(user.twitchProfile.id, []);
			await Store.setSevenTvChannelEmotes(user.twitchProfile.id, []);
			await Store.setFfzChannelEmotes(user.twitchProfile.id, []);
			await Store.setBttvChannelEmotes(user.twitchProfile.id, []);

			await Store.updateUser(user.twitchProfile, user.state);
		}
	}
}
