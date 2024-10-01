import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { handleSendMessageError } from '@/background/utils';
import { defaultGlobalEmotesState } from '@shared/constants';
import { type User } from '@shared/models';
import { type GlobalEmotesState } from '@shared/models/global-emotes-state';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import { type Message, type MessageChannelEmotesUpdate, type MessageGlobalEmotesUpdate } from '@shared/types';
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

	constructor() {
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

					case 'login': {
						await this.start();
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

	public async init(): Promise<void> {
		this._logger.debug('Initializing...');

		const globalEmotesState = await Store.getGlobalEmotesState();

		if (!globalEmotesState) {
			await Store.updateTwitchGlobalEmotesState({
				twitchGlobalEmotesUpdatedAt: 0,
				sevenTvGlobalEmotesUpdatedAt: 0,
				ffzGlobalEmotesUpdatedAt: 0,
				bttvGlobalEmotesUpdatedAt: 0
			});
		}

		this._twitchGlobalEmotesSet = new Set((await Store.getTwitchGlobalEmotes()).map(emote => emote.id));
		this._sevenTvGlobalEmotesSet = new Set((await Store.getSevenTvGlobalEmotes()).map(emote => emote.id));
		this._ffzGlobalEmotesSet = new Set((await Store.getFfzGlobalEmotes()).map(emote => emote.id));
		this._bttvGlobalEmotesSet = new Set((await Store.getBttvGlobalEmotes()).map(emote => emote.id));

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

	private _initTimers(): void {
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
		const globalEmotesState = await this._getGlobalEmotesState();
		let areGlobalEmotesChanged = false;

		try {
			if (
				this._shouldUpdateGlobalEmotes(globalEmotesState.twitchGlobalEmotesUpdatedAt) &&
				(await Store.getTwitchAccessToken())
			) {
				this._logger.debug('Updating Twitch global emotes...');

				const twitchGlobalEmotes = await TwitchApi.getGlobalEmotes();
				let isChanged = false;

				if (twitchGlobalEmotes.length !== this._twitchGlobalEmotesSet.size) {
					isChanged = true;
				} else {
					for (const emote of twitchGlobalEmotes) {
						if (!this._twitchGlobalEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('Twitch global emotes have been updated');

					areGlobalEmotesChanged ||= true;
					await Store.setTwitchGlobalEmotes(twitchGlobalEmotes);
					this._twitchGlobalEmotesSet = new Set(twitchGlobalEmotes.map(emote => emote.id));
				}

				await Store.updateTwitchGlobalEmotesState({ twitchGlobalEmotesUpdatedAt: Date.now() });
			}
		} catch (e) {
			this._logger.warn('Could not update Twitch global emotes', e);
		}

		try {
			if (this._shouldUpdateGlobalEmotes(globalEmotesState.sevenTvGlobalEmotesUpdatedAt)) {
				this._logger.debug('Updating 7TV global emotes...');

				const sevenTvGlobalEmotes = await this._emotesFetcher.stv.getGlobalEmotes();
				let isChanged = false;

				if (sevenTvGlobalEmotes.length !== this._sevenTvGlobalEmotesSet.size) {
					isChanged = true;
				} else {
					for (const emote of sevenTvGlobalEmotes) {
						if (!this._sevenTvGlobalEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('7TV global emotes have been updated');

					areGlobalEmotesChanged ||= true;
					await Store.setSevenTvGlobalEmotes(sevenTvGlobalEmotes);
					this._sevenTvGlobalEmotesSet = new Set(sevenTvGlobalEmotes.map(emote => emote.id));
				}

				await Store.updateTwitchGlobalEmotesState({ sevenTvGlobalEmotesUpdatedAt: Date.now() });
			}
		} catch (e) {
			this._logger.warn('Could not update 7TV global emotes', e);
		}

		try {
			if (this._shouldUpdateGlobalEmotes(globalEmotesState.ffzGlobalEmotesUpdatedAt)) {
				this._logger.debug('Updating FFZ global emotes...');

				const ffzGlobalEmotes = await this._emotesFetcher.ffz.getGlobalEmotes();
				let isChanged = false;

				if (ffzGlobalEmotes.length !== this._ffzGlobalEmotesSet.size) {
					isChanged = true;
				} else {
					for (const emote of ffzGlobalEmotes) {
						if (!this._ffzGlobalEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('FFZ global emotes have been updated');

					areGlobalEmotesChanged ||= true;
					await Store.setFfzGlobalEmotes(ffzGlobalEmotes);
					this._ffzGlobalEmotesSet = new Set(ffzGlobalEmotes.map(emote => emote.id));
				}

				await Store.updateTwitchGlobalEmotesState({ ffzGlobalEmotesUpdatedAt: Date.now() });
			}
		} catch (e) {
			this._logger.warn('Could not update FFZ global emotes', e);
		}

		try {
			if (this._shouldUpdateGlobalEmotes(globalEmotesState.bttvGlobalEmotesUpdatedAt)) {
				this._logger.debug('Updating BTTV global emotes...');

				const bttvGlobalEmotes = await this._emotesFetcher.bttv.getGlobalEmotes();
				let isChanged = false;

				if (bttvGlobalEmotes.length !== this._bttvGlobalEmotesSet.size) {
					isChanged = true;
				} else {
					for (const emote of bttvGlobalEmotes) {
						if (!this._bttvGlobalEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('BTTV global emotes have been updated');

					areGlobalEmotesChanged ||= true;
					await Store.setBttvGlobalEmotes(bttvGlobalEmotes);
					this._bttvGlobalEmotesSet = new Set(bttvGlobalEmotes.map(emote => emote.id));
				}

				await Store.updateTwitchGlobalEmotesState({ bttvGlobalEmotesUpdatedAt: Date.now() });
			}
		} catch (e) {
			this._logger.warn('Could not update BTTV global emotes', e);
		}

		if (areGlobalEmotesChanged) {
			this._sendMessageToContent({ type: 'global_emotes_update' } satisfies MessageGlobalEmotesUpdate).catch(e =>
				handleSendMessageError(e, this._logger)
			);
		}
	}

	private async _updateChannelEmotesForUser(user: User): Promise<void> {
		const userId = user.twitchProfile.id;
		let areChannelEmotesChanged = false;

		if (this._shouldUpdateChannelEmotes(user.state.twitchEmotesUpdatedAt) && (await Store.getTwitchAccessToken())) {
			try {
				this._logger.debug('Updating Twitch channel emotes...', user);

				const twitchChannelEmotes = await TwitchApi.getChannelEmotes(userId);
				const localTwitchChannelEmotes = await Store.getTwitchChannelEmotes(userId);
				let isTwitchChannelEmotesChanged = false;

				if (twitchChannelEmotes.length !== localTwitchChannelEmotes.length) {
					isTwitchChannelEmotesChanged = true;
				} else {
					const localTwitchChannelEmotesSet = new Set(localTwitchChannelEmotes.map(emote => emote.id));

					for (const emote of twitchChannelEmotes) {
						if (!localTwitchChannelEmotesSet.has(emote.id)) {
							isTwitchChannelEmotesChanged = true;
							break;
						}
					}
				}

				if (isTwitchChannelEmotesChanged) {
					this._logger.info('Twitch channel emotes have been updated', user);

					areChannelEmotesChanged ||= true;
					await Store.setTwitchChannelEmotes(userId, twitchChannelEmotes);
				}

				await Store.updateUser(user.twitchProfile, { twitchEmotesUpdatedAt: Date.now() });
			} catch (e) {
				this._logger.warn('Could not update Twitch channel emotes', user, e);
			}
		}

		if (this._shouldUpdateChannelEmotes(user.state.sevenTvEmotesUpdatedAt)) {
			try {
				this._logger.debug('Updating 7TV channel emotes...', user);

				const sevenTvChannelEmotes = await this._emotesFetcher.stv.getChannelEmotes(userId);

				const localSevenTvChannelEmotes = await Store.getSevenTvChannelEmotes(userId);
				let isChanged = false;

				if (sevenTvChannelEmotes.length !== localSevenTvChannelEmotes.length) {
					isChanged = true;
				} else {
					const localSevenTvChannelEmotesSet = new Set(localSevenTvChannelEmotes.map(emote => emote.id));

					if (sevenTvChannelEmotes.length !== localSevenTvChannelEmotesSet.size) {
						isChanged = true;
					} else {
						for (const emote of sevenTvChannelEmotes) {
							if (!localSevenTvChannelEmotesSet.has(emote.id)) {
								areChannelEmotesChanged = true;
								break;
							}
						}
					}
				}

				if (isChanged) {
					this._logger.info('7TV channel emotes have been updated', user);

					areChannelEmotesChanged ||= true;
					await Store.setSevenTvChannelEmotes(userId, sevenTvChannelEmotes);
				}

				await Store.updateUser(user.twitchProfile, { sevenTvEmotesUpdatedAt: Date.now() });
			} catch (e) {
				this._logger.warn('Could not update 7TV channel emotes', user, e);
			}
		}

		if (this._shouldUpdateChannelEmotes(user.state.ffzEmotesUpdatedAt)) {
			try {
				this._logger.debug('Updating FFZ channel emotes...', user);

				const ffzTvChannelEmotes = await this._emotesFetcher.ffz.getChannelEmotes(userId);
				const localFfzChannelEmotes = await Store.getFfzChannelEmotes(userId);
				let isChanged = false;

				if (ffzTvChannelEmotes.length !== localFfzChannelEmotes.length) {
					isChanged = true;
				} else {
					const localFfzChannelEmotesSet = new Set(localFfzChannelEmotes.map(emote => emote.id));

					for (const emote of ffzTvChannelEmotes) {
						if (!localFfzChannelEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('FFZ channel emotes have been updated', user);

					areChannelEmotesChanged ||= true;
					await Store.setFfzChannelEmotes(userId, ffzTvChannelEmotes);
				}

				await Store.updateUser(user.twitchProfile, { ffzEmotesUpdatedAt: Date.now() });
			} catch (e) {
				this._logger.warn('Could not update FFZ channel emotes', user, e);
			}
		}

		if (this._shouldUpdateChannelEmotes(user.state.bttvEmotesUpdatedAt)) {
			try {
				this._logger.debug('Updating BTTV channel emotes...', user);
				const bttvChannelEmotes = await this._emotesFetcher.bttv.getChannelEmotes(userId);
				const localBttvChannelEmotes = await Store.getBttvChannelEmotes(userId);
				let isChanged = false;

				if (bttvChannelEmotes.length !== localBttvChannelEmotes.length) {
					isChanged = true;
				} else {
					const localBttvChannelEmotesSet = new Set(localBttvChannelEmotes.map(emote => emote.id));
					for (const emote of bttvChannelEmotes) {
						if (!localBttvChannelEmotesSet.has(emote.id)) {
							isChanged = true;
							break;
						}
					}
				}

				if (isChanged) {
					this._logger.info('BTTV channel emotes have been updated', user);

					areChannelEmotesChanged ||= true;
					await Store.setBttvChannelEmotes(userId, bttvChannelEmotes);
				}

				await Store.updateUser(user.twitchProfile, { bttvEmotesUpdatedAt: Date.now() });
			} catch (e) {
				this._logger.warn('Could not update BTTV channel emotes', user, e);
			}
		}

		if (areChannelEmotesChanged) {
			this._sendMessageToContent({
				type: 'channel_emotes_update',
				data: { userId }
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
}
