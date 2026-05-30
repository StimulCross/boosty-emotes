import type { ChannelEmote, User } from '@shared/models'
import type { EmotesSyncResult } from './emotes-sync-service.ts'
import { storage } from '@shared/storage/storage.ts'
import { TwitchApi } from '@shared/twitch-api'
import { createAppLogger } from '@shared/utils'
import { withTimeout } from '../utils'
import { EmotesSyncService } from './emotes-sync-service.ts'

export class ChannelEmotesSyncService extends EmotesSyncService<ChannelEmote> {
	protected override readonly _logger = createAppLogger('ChannelEmotesSyncService')

	public async updateForUser(user: User): Promise<EmotesSyncResult<ChannelEmote> | null> {
		const hasTwitchToken = Boolean(await storage.auth.getAccessToken())
		const tasks: Array<Promise<EmotesSyncResult<ChannelEmote> | null>> = []

		if (hasTwitchToken && this._shouldUpdate(user.state.twitchEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncTwitch(user), 10_000))

		if (this._shouldUpdate(user.state.sevenTvEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncStv(user), 10_000))

		if (this._shouldUpdate(user.state.ffzEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncFfz(user), 10_000))

		if (this._shouldUpdate(user.state.bttvEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncBttv(user), 10_000))

		return await this._runTasks(tasks)
	}

	private async _syncTwitch(user: User): Promise<EmotesSyncResult<ChannelEmote> | null> {
		const now = Date.now()
		const userId = user.twitchProfile.id

		return await this._syncEmotes({
			providerTitle: `Twitch Channel [${userId} | @${user.twitchProfile.name}]`,
			fetchNewEmotes: async () => await TwitchApi.getChannelEmotes(userId),
			fetchLocalEmotes: async () => await storage.emotes.getChannelEmotes(userId, 'twitch'),
			updateEmotes: async emotes => await storage.emotes.setChannelEmotes(userId, 'twitch', emotes),
			updateState: async () =>
				await storage.users.updateState(user.twitchProfile.id, { twitchEmotesUpdatedAt: now, updatedAt: now }),
		})
	}

	private async _syncStv(user: User): Promise<EmotesSyncResult<ChannelEmote> | null> {
		const now = Date.now()
		const userId = user.twitchProfile.id

		return await this._syncEmotes({
			providerTitle: `7TV Channel [${userId} | @${user.twitchProfile.name}]`,
			fetchNewEmotes: async () => await this._emotesApiClient.stv.getChannelEmotes(userId),
			fetchLocalEmotes: async () => await storage.emotes.getChannelEmotes(userId, 'stv'),
			updateEmotes: async emotes => await storage.emotes.setChannelEmotes(userId, 'stv', emotes),
			updateState: async () =>
				await storage.users.updateState(user.twitchProfile.id, { sevenTvEmotesUpdatedAt: now, updatedAt: now }),
		})
	}

	private async _syncFfz(user: User): Promise<EmotesSyncResult<ChannelEmote> | null> {
		const now = Date.now()
		const userId = user.twitchProfile.id

		return await this._syncEmotes({
			providerTitle: `FFZ Channel [${userId} | @${user.twitchProfile.name}]`,
			fetchNewEmotes: async () => await this._emotesApiClient.ffz.getChannelEmotes(userId),
			fetchLocalEmotes: async () => await storage.emotes.getChannelEmotes(userId, 'ffz'),
			updateEmotes: async emotes => await storage.emotes.setChannelEmotes(userId, 'ffz', emotes),
			updateState: async () =>
				await storage.users.updateState(user.twitchProfile.id, { ffzEmotesUpdatedAt: now, updatedAt: now }),
		})
	}

	private async _syncBttv(user: User): Promise<EmotesSyncResult<ChannelEmote> | null> {
		const now = Date.now()
		const userId = user.twitchProfile.id

		return await this._syncEmotes({
			providerTitle: `BTTV Channel [${userId} | @${user.twitchProfile.name}]`,
			fetchNewEmotes: async () => await this._emotesApiClient.bttv.getChannelEmotes(userId),
			fetchLocalEmotes: async () => await storage.emotes.getChannelEmotes(userId, 'bttv'),
			updateEmotes: async emotes => await storage.emotes.setChannelEmotes(userId, 'bttv', emotes),
			updateState: async () =>
				await storage.users.updateState(user.twitchProfile.id, { bttvEmotesUpdatedAt: now, updatedAt: now }),
		})
	}
}
