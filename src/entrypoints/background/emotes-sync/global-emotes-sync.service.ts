import type { GlobalThirdPartyEmote } from '@shared/models'
import type { EmotesSyncResult } from './emotes-sync-service.ts'
import { storage } from '@shared/storage/storage.ts'
import { TwitchApi } from '@shared/twitch-api'
import { createAppLogger } from '@shared/utils'
import { withTimeout } from '../utils'
import { EmotesSyncService } from './emotes-sync-service.ts'

export class GlobalEmotesSyncService extends EmotesSyncService<GlobalThirdPartyEmote> {
	protected override readonly _logger = createAppLogger('GlobalEmotesSyncService')

	public async updateAll(): Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null> {
		const state = await storage.state.getGlobalEmotesState()
		const hasTwitchToken = Boolean(await storage.auth.getAccessToken())
		const tasks: Array<Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null>> = []

		if (hasTwitchToken && this._shouldUpdate(state.twitchGlobalEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncTwitch(), 10_000))

		if (this._shouldUpdate(state.sevenTvGlobalEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncStv(), 10_000))

		if (this._shouldUpdate(state.ffzGlobalEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncFfz(), 10_000))

		if (this._shouldUpdate(state.bttvGlobalEmotesUpdatedAt))
			tasks.push(withTimeout(this._syncBttv(), 10_000))

		return await this._runTasks(tasks)
	}

	private async _syncTwitch(): Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null> {
		return await this._syncEmotes({
			providerTitle: 'Twitch Global',
			fetchNewEmotes: async () => await TwitchApi.getGlobalEmotes(),
			fetchLocalEmotes: async () => await storage.emotes.getGlobalEmotes('twitch'),
			updateEmotes: async emotes => await storage.emotes.setGlobalEmotes('twitch', emotes),
			updateState: async () => await storage.state.updateGlobalEmotesState({ twitchGlobalEmotesUpdatedAt: Date.now() }),
		})
	}

	private async _syncStv(): Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null> {
		return await this._syncEmotes({
			providerTitle: '7TV Global',
			fetchNewEmotes: async () => await this._emotesApiClient.stv.getGlobalEmotes(),
			fetchLocalEmotes: async () => await storage.emotes.getGlobalEmotes('stv'),
			updateEmotes: async emotes => await storage.emotes.setGlobalEmotes('stv', emotes),
			updateState: async () => await storage.state.updateGlobalEmotesState({ sevenTvGlobalEmotesUpdatedAt: Date.now() }),
		})
	}

	private async _syncFfz(): Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null> {
		return await this._syncEmotes({
			providerTitle: 'FFZ Global',
			fetchNewEmotes: async () => await this._emotesApiClient.ffz.getGlobalEmotes(),
			fetchLocalEmotes: async () => await storage.emotes.getGlobalEmotes('ffz'),
			updateEmotes: async emotes => await storage.emotes.setGlobalEmotes('ffz', emotes),
			updateState: async () => await storage.state.updateGlobalEmotesState({ ffzGlobalEmotesUpdatedAt: Date.now() }),
		})
	}

	private async _syncBttv(): Promise<EmotesSyncResult<GlobalThirdPartyEmote> | null> {
		return await this._syncEmotes({
			providerTitle: 'BTTV Global',
			fetchNewEmotes: async () => await this._emotesApiClient.bttv.getGlobalEmotes(),
			fetchLocalEmotes: async () => await storage.emotes.getGlobalEmotes('bttv'),
			updateEmotes: async emotes => await storage.emotes.setGlobalEmotes('bttv', emotes),
			updateState: async () => await storage.state.updateGlobalEmotesState({ bttvGlobalEmotesUpdatedAt: Date.now() }),
		})
	}
}
