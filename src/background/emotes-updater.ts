import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { BACKGROUND_EVENTS } from '@/background/constants';
import { handleSendMessageError, withTimeout } from '@/background/utils';
import { defaultGlobalEmotesState } from '@shared/constants';
import { type EventEmitter } from '@shared/event-emitter';
import { type User } from '@shared/models';
import { type GlobalEmotesState } from '@shared/models/global-emotes-state';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import {
	type Message,
	type MessageChannelEmotesUpdate,
	type MessageGlobalEmotesUpdate,
	type ThirdPartyEmoteProvider
} from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmotesFetcher } from './emotes-fetcher';

export class EmotesUpdater {
	private readonly _logger = createLogger(createLoggerOptions(EmotesUpdater.name));
	private _usersTimer: ReturnType<typeof setTimeout> | null = null;
	private _globalEmotesTimer: ReturnType<typeof setTimeout> | null = null;
	private _channelEmotesTimer: ReturnType<typeof setTimeout> | null = null;

	// 1 minute will be added for each interval in timer
	private readonly _usersUpdateInterval = 1000 * 60 * 4; // 4 min
	private readonly _globalEmotesUpdateInterval = 1000 * 60 * 10; // 10 min

	private _twitchGlobalEmotesSet: Set<string> = new Set();
	private _sevenTvGlobalEmotesSet: Set<string> = new Set();
	private _ffzGlobalEmotesSet: Set<string> = new Set();
	private _bttvGlobalEmotesSet: Set<string> = new Set();

	private readonly _emotesFetcher = new EmotesFetcher();

	constructor(private readonly _emitter: EventEmitter) {
		this._initListeners();
	}

	public async init(): Promise<void> {
		this._logger.debug('Initializing...');

		await this._initGlobalEmotesState();
		await this._initGlobalEmotes();

		this._logger.debug('Initialized');
	}

	public async start(): Promise<void> {
		const identity = await Store.getIdentity();

		if (identity) {
			this._initTimers();
			await this._updateGlobalEmotes();
			await this._updateUsers();

			this._logger.success('Started');
		} else {
			this._logger.warn('No user identity found. Log in to use the extension.');
		}
	}

	public stop(): void {
		this._clearTimers();
		this._logger.success('Stopped');
	}

	private _initListeners(): void {
		this._emitter.on(BACKGROUND_EVENTS.LOGIN, async () => {
			try {
				await this.init();
				await this.start();
			} catch (e) {
				this._logger.error(e);
			}
		});

		browser.runtime.onMessage.addListener(async (message: Message) => {
			try {
				switch (message.type) {
					case 'add_user': {
						try {
							const user = await Store.getUser(message.data.userId);

							if (!user) {
								this._logger.warn(`User ${message.data.userId} not found.`);
								return;
							}

							await this._updateChannelEmotesForUser(user);
						} catch (e) {
							this._logger.error(e);
						}

						break;
					}

					case 'logout': {
						this.stop();
						break;
					}

					default:
						break;
				}
			} catch (e) {
				this._logger.error(e);
			}
		});
	}

	private async _initGlobalEmotesState(): Promise<void> {
		const globalEmotesState = await Store.getGlobalEmotesState();

		if (!globalEmotesState) {
			await Store.updateTwitchGlobalEmotesState(defaultGlobalEmotesState);
		}
	}

	private async _initGlobalEmotes(): Promise<void> {
		this._twitchGlobalEmotesSet = new Set((await Store.getTwitchGlobalEmotes()).map(emote => emote.id));
		this._sevenTvGlobalEmotesSet = new Set((await Store.getSevenTvGlobalEmotes()).map(emote => emote.id));
		this._ffzGlobalEmotesSet = new Set((await Store.getFfzGlobalEmotes()).map(emote => emote.id));
		this._bttvGlobalEmotesSet = new Set((await Store.getBttvGlobalEmotes()).map(emote => emote.id));
	}

	private _initTimers(): void {
		this._clearTimers();

		this._usersTimer = setInterval(() => {
			this._updateUsers().catch(e => this._logger.warn(e));
		}, this._usersUpdateInterval + 60_000);

		this._globalEmotesTimer = setInterval(() => {
			this._updateGlobalEmotes().catch(e => this._logger.warn(e));
		}, this._globalEmotesUpdateInterval + 60_000);
	}

	private _clearTimers(): void {
		if (this._usersTimer) {
			clearInterval(this._usersTimer);
			this._usersTimer = null;
		}

		if (this._globalEmotesTimer) {
			clearInterval(this._globalEmotesTimer);
			this._globalEmotesTimer = null;
		}

		if (this._channelEmotesTimer) {
			clearInterval(this._channelEmotesTimer);
			this._channelEmotesTimer = null;
		}
	}

	private async _updateUsers(): Promise<void> {
		if (!(await Store.getTwitchAccessToken())) {
			this._logger.warn('No access token found. Skipping the users update.');
			return;
		}

		const users = await Store.getUsers();

		for (const user of users) {
			try {
				if (this._shouldUpdateUser(user.state.updatedAt)) {
					this._logger.debug('Update user', user);
					const twitchUser = await TwitchApi.getUserById(user.twitchProfile.id);

					if (!twitchUser) {
						this._logger.warn(
							`Twitch user @${user.twitchProfile.displayName} (boosty: @${user.boostyUsername}) not found`
						);
						await Store.updateUser(user.twitchProfile, { active: false, updatedAt: Date.now() });
						return;
					}

					await Store.updateUser(twitchUser, { active: true, updatedAt: Date.now() });
				}

				await this._updateChannelEmotesForUser(user);
			} catch (e) {
				this._logger.warn(
					`Failed to update user @${user.boostyUsername} (twitch: @${user.twitchProfile.displayName})`,
					e
				);
			}
		}
	}

	private async _updateGlobalEmotes(): Promise<void> {
		const updaters: Array<[ThirdPartyEmoteProvider, Promise<boolean>]> = [
			['twitch', withTimeout(this._updateTwitchGlobalEmotes())],
			['7tv', withTimeout(this._updateSevenTvGlobalEmotes())],
			['ffz', withTimeout(this._updateFfzGlobalEmotes())],
			['bttv', withTimeout(this._updateBttvGlobalEmotes())]
		];

		const result = await Promise.allSettled(updaters.map(async ([, promise]) => await promise));

		let areEmotesChanged = false;

		for (let i = 0; i < result.length; i++) {
			const res = result[i];

			if (res.status === 'fulfilled') {
				areEmotesChanged = true;
			} else {
				const provider = updaters[i][0];
				this._logger.warn(`Could not update "${provider}" global emotes`, res.reason);
			}
		}

		if (areEmotesChanged) {
			this._sendMessageToContent({ type: 'global_emotes_update' } satisfies MessageGlobalEmotesUpdate).catch(e =>
				handleSendMessageError(e, this._logger)
			);
		}
	}

	private async _updateChannelEmotesForUser(user: User): Promise<void> {
		const updaters: Array<[ThirdPartyEmoteProvider, Promise<boolean>]> = [
			['twitch', withTimeout(this._updateTwitchChannelEmotes(user))],
			['7tv', withTimeout(this._updateSevenTvChannelEmotes(user))],
			['ffz', withTimeout(this._updateFfzChannelEmotes(user))],
			['bttv', withTimeout(this._updateBttvChannelEmotes(user))]
		];

		const result = await Promise.allSettled(updaters.map(async ([, promise]) => await promise));

		let areEmotesChanged = false;

		for (let i = 0; i < result.length; i++) {
			const res = result[i];

			if (res.status === 'fulfilled') {
				areEmotesChanged = true;
			} else {
				const provider = updaters[i][0];
				this._logger.warn(`Could not update "${provider}" channel emotes`, res.reason);
			}
		}

		if (areEmotesChanged) {
			this._sendMessageToContent({
				type: 'channel_emotes_update',
				data: { userId: user.twitchProfile.id }
			} satisfies MessageChannelEmotesUpdate).catch(e => handleSendMessageError(e, this._logger));
		}
	}

	private _shouldUpdateGlobalEmotes(lastUpdate: number): boolean {
		return Date.now() - lastUpdate >= this._globalEmotesUpdateInterval;
	}

	private _shouldUpdateUser(lastUpdate: number): boolean {
		return Date.now() - lastUpdate >= this._usersUpdateInterval;
	}

	private _shouldUpdateChannelEmotes(lastUpdate: number): boolean {
		return Date.now() - lastUpdate >= this._usersUpdateInterval;
	}

	private async _getGlobalEmotesState(): Promise<GlobalEmotesState> {
		return (await Store.getGlobalEmotesState()) ?? defaultGlobalEmotesState;
	}

	private async _sendMessageToContent(message: Message): Promise<void> {
		const tabs = await browser.tabs.query({ url: 'https://*.boosty.to/*' });

		for (const tab of tabs) {
			if (tab.id) {
				await browser.tabs.sendMessage(tab.id, message);
			}
		}
	}

	private async _updateTwitchGlobalEmotes(): Promise<boolean> {
		const globalEmotesState = await this._getGlobalEmotesState();

		if (
			!this._shouldUpdateGlobalEmotes(globalEmotesState.twitchGlobalEmotesUpdatedAt) ||
			!(await Store.getTwitchAccessToken())
		) {
			return false;
		}

		let isChanged = false;

		try {
			this._logger.debug('Updating Twitch global emotes...');

			const twitchGlobalEmotes = await TwitchApi.getGlobalEmotes();

			isChanged =
				twitchGlobalEmotes.length !== this._twitchGlobalEmotesSet.size ||
				twitchGlobalEmotes.some(emote => !this._twitchGlobalEmotesSet.has(emote.id));

			if (isChanged) {
				this._logger.info('Twitch global emotes have been updated');
				await Store.setTwitchGlobalEmotes(twitchGlobalEmotes);
				this._twitchGlobalEmotesSet = new Set(twitchGlobalEmotes.map(emote => emote.id));
			}

			await Store.updateTwitchGlobalEmotesState({ twitchGlobalEmotesUpdatedAt: Date.now() });
		} catch (e) {
			this._logger.warn('Could not update Twitch global emotes', e);
		}

		return isChanged;
	}

	private async _updateSevenTvGlobalEmotes(): Promise<boolean> {
		const globalEmotesState = await this._getGlobalEmotesState();

		if (!this._shouldUpdateGlobalEmotes(globalEmotesState.sevenTvGlobalEmotesUpdatedAt)) {
			return false;
		}

		let isChanged = false;

		try {
			this._logger.debug('Updating 7TV global emotes...');

			const sevenTvGlobalEmotes = await this._emotesFetcher.stv.getGlobalEmotes();

			isChanged =
				sevenTvGlobalEmotes.length !== this._sevenTvGlobalEmotesSet.size ||
				sevenTvGlobalEmotes.some(emote => !this._sevenTvGlobalEmotesSet.has(emote.id));

			if (isChanged) {
				this._logger.info('7TV global emotes have been updated');

				await Store.setSevenTvGlobalEmotes(sevenTvGlobalEmotes);
				this._sevenTvGlobalEmotesSet = new Set(sevenTvGlobalEmotes.map(emote => emote.id));
			}

			await Store.updateTwitchGlobalEmotesState({ sevenTvGlobalEmotesUpdatedAt: Date.now() });
		} catch (e) {
			this._logger.warn('Could not update 7TV global emotes', e);
		}

		return isChanged;
	}

	private async _updateFfzGlobalEmotes(): Promise<boolean> {
		const globalEmotesState = await this._getGlobalEmotesState();

		if (!this._shouldUpdateGlobalEmotes(globalEmotesState.ffzGlobalEmotesUpdatedAt)) {
			return false;
		}

		let isChanged = false;

		try {
			this._logger.debug('Updating FFZ global emotes...');

			const ffzGlobalEmotes = await this._emotesFetcher.ffz.getGlobalEmotes();

			isChanged =
				ffzGlobalEmotes.length !== this._ffzGlobalEmotesSet.size ||
				ffzGlobalEmotes.some(emote => !this._ffzGlobalEmotesSet.has(emote.id));

			if (isChanged) {
				this._logger.info('FFZ global emotes have been updated');

				await Store.setFfzGlobalEmotes(ffzGlobalEmotes);
				this._ffzGlobalEmotesSet = new Set(ffzGlobalEmotes.map(emote => emote.id));
			}

			await Store.updateTwitchGlobalEmotesState({ ffzGlobalEmotesUpdatedAt: Date.now() });
		} catch (e) {
			this._logger.warn('Could not update FFZ global emotes', e);
		}

		return isChanged;
	}

	private async _updateBttvGlobalEmotes(): Promise<boolean> {
		const globalEmotesState = await this._getGlobalEmotesState();

		if (!this._shouldUpdateGlobalEmotes(globalEmotesState.bttvGlobalEmotesUpdatedAt)) {
			return false;
		}

		let isChanged = false;

		try {
			this._logger.debug('Updating BTTV global emotes...');

			const bttvGlobalEmotes = await this._emotesFetcher.bttv.getGlobalEmotes();

			isChanged =
				bttvGlobalEmotes.length !== this._bttvGlobalEmotesSet.size ||
				bttvGlobalEmotes.some(emote => !this._bttvGlobalEmotesSet.has(emote.id));

			if (isChanged) {
				this._logger.info('BTTV global emotes have been updated');

				await Store.setBttvGlobalEmotes(bttvGlobalEmotes);
				this._bttvGlobalEmotesSet = new Set(bttvGlobalEmotes.map(emote => emote.id));
			}

			await Store.updateTwitchGlobalEmotesState({ bttvGlobalEmotesUpdatedAt: Date.now() });
		} catch (e) {
			this._logger.warn('Could not update BTTV global emotes', e);
		}

		return isChanged;
	}

	private async _updateTwitchChannelEmotes(user: User): Promise<boolean> {
		if (
			!this._shouldUpdateChannelEmotes(user.state.twitchEmotesUpdatedAt) ||
			!(await Store.getTwitchAccessToken())
		) {
			return false;
		}

		const userId = user.twitchProfile.id;
		let isChanged = false;

		try {
			this._logger.debug('Updating Twitch channel emotes...', user);

			const twitchChannelEmotes = await TwitchApi.getChannelEmotes(userId);
			const localTwitchChannelEmotes = await Store.getTwitchChannelEmotes(userId);

			if (twitchChannelEmotes.length !== localTwitchChannelEmotes.length) {
				isChanged = true;
			} else {
				const localEmoteIds = new Set(localTwitchChannelEmotes.map(emote => emote.id));
				isChanged = twitchChannelEmotes.some(emote => !localEmoteIds.has(emote.id));
			}

			await Store.updateUser(user.twitchProfile, { twitchEmotesUpdatedAt: Date.now() });

			if (isChanged) {
				this._logger.info('Twitch channel emotes have been updated', user);
				await Store.setTwitchChannelEmotes(userId, twitchChannelEmotes);
			}
		} catch (e) {
			this._logger.warn('Could not update Twitch channel emotes', user, e);
		}

		return isChanged;
	}

	private async _updateSevenTvChannelEmotes(user: User): Promise<boolean> {
		if (!this._shouldUpdateChannelEmotes(user.state.sevenTvEmotesUpdatedAt)) {
			return false;
		}

		const userId = user.twitchProfile.id;
		let isChanged = false;

		try {
			this._logger.debug('Updating 7TV channel emotes...', user);

			const sevenTvChannelEmotes = await this._emotesFetcher.stv.getChannelEmotes(userId);
			const localSevenTvChannelEmotes = await Store.getSevenTvChannelEmotes(userId);

			if (sevenTvChannelEmotes.length !== localSevenTvChannelEmotes.length) {
				isChanged = true;
			} else {
				const localEmoteIds = new Set(localSevenTvChannelEmotes.map(emote => emote.id));
				isChanged = sevenTvChannelEmotes.some(emote => !localEmoteIds.has(emote.id));

				for (const emote of sevenTvChannelEmotes) {
					if (!localEmoteIds.has(emote.id)) {
						isChanged = true;
						break;
					}
				}
			}

			await Store.updateUser(user.twitchProfile, { sevenTvEmotesUpdatedAt: Date.now() });

			if (isChanged) {
				this._logger.info('7TV channel emotes have been updated', user);
				await Store.setSevenTvChannelEmotes(userId, sevenTvChannelEmotes);
			}
		} catch (e) {
			this._logger.warn('Could not update 7TV channel emotes', user, e);
		}

		return isChanged;
	}

	private async _updateFfzChannelEmotes(user: User): Promise<boolean> {
		if (!this._shouldUpdateChannelEmotes(user.state.ffzEmotesUpdatedAt)) {
			return false;
		}

		const userId = user.twitchProfile.id;
		let isChanged = false;

		try {
			this._logger.debug('Updating FFZ channel emotes...', user);

			const ffzTvChannelEmotes = await this._emotesFetcher.ffz.getChannelEmotes(userId);
			const localFfzChannelEmotes = await Store.getFfzChannelEmotes(userId);

			if (ffzTvChannelEmotes.length !== localFfzChannelEmotes.length) {
				isChanged = true;
			} else {
				const localEmoteIds = new Set(localFfzChannelEmotes.map(emote => emote.id));
				isChanged = ffzTvChannelEmotes.some(emote => !localEmoteIds.has(emote.id));

				for (const emote of ffzTvChannelEmotes) {
					if (!localEmoteIds.has(emote.id)) {
						isChanged = true;
						break;
					}
				}
			}

			await Store.updateUser(user.twitchProfile, { ffzEmotesUpdatedAt: Date.now() });

			if (isChanged) {
				this._logger.info('FFZ channel emotes have been updated', user);
				await Store.setFfzChannelEmotes(userId, ffzTvChannelEmotes);
			}
		} catch (e) {
			this._logger.warn('Could not update FFZ channel emotes', user, e);
		}

		return isChanged;
	}

	private async _updateBttvChannelEmotes(user: User): Promise<boolean> {
		if (!this._shouldUpdateChannelEmotes(user.state.bttvEmotesUpdatedAt)) {
			return false;
		}

		const userId = user.twitchProfile.id;
		let isChanged = false;

		try {
			this._logger.debug('Updating BTTV channel emotes...', user);

			const bttvChannelEmotes = await this._emotesFetcher.bttv.getChannelEmotes(userId);
			const localBttvChannelEmotes = await Store.getBttvChannelEmotes(userId);

			if (bttvChannelEmotes.length !== localBttvChannelEmotes.length) {
				isChanged = true;
			} else {
				const localEmoteIds = new Set(localBttvChannelEmotes.map(emote => emote.id));
				isChanged = bttvChannelEmotes.some(emote => !localEmoteIds.has(emote.id));

				for (const emote of bttvChannelEmotes) {
					if (!localEmoteIds.has(emote.id)) {
						isChanged = true;
						break;
					}
				}
			}

			await Store.updateUser(user.twitchProfile, { bttvEmotesUpdatedAt: Date.now() });

			if (isChanged) {
				this._logger.info('BTTV channel emotes have been updated', user);
				await Store.setBttvChannelEmotes(userId, bttvChannelEmotes);
			}
		} catch (e) {
			this._logger.warn('Could not update BTTV channel emotes', user, e);
		}

		return isChanged;
	}
}
