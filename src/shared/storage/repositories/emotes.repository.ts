import type { LocalStorageProvider } from '@shared/storage/providers/local-storage.provider.ts'
import type { ThirdPartyEmoteProvider } from '@shared/types'
import type { ChannelEmote, GlobalThirdPartyEmote } from '../../models'
import { EmoteSet } from '@shared/emote-context'
import { STORAGE_KEYS } from '@shared/storage/constants.ts'
import { THIRD_PARTY_EMOTE_PROVIDERS } from '@shared/types'

const PROVIDER_TO_GLOBAL_KEY_MAP: Record<ThirdPartyEmoteProvider, string> = {
	twitch: STORAGE_KEYS.TWITCH_GLOBAL_EMOTES,
	stv: STORAGE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
	ffz: STORAGE_KEYS.FFZ_GLOBAL_EMOTES,
	bttv: STORAGE_KEYS.BTTV_GLOBAL_EMOTES,
}

const PROVIDER_TO_CHANNEL_KEY_MAP: Record<ThirdPartyEmoteProvider, (userId: string) => string> = {
	twitch: (userId: string): string => `${STORAGE_KEYS.TWITCH_CHANNEL_EMOTES_PREFIX}${userId}`,
	stv: (userId: string): string => `${STORAGE_KEYS.SEVEN_TV_CHANNEL_EMOTES_PREFIX}${userId}`,
	ffz: (userId: string): string => `${STORAGE_KEYS.FFZ_CHANNEL_EMOTES_PREFIX}${userId}`,
	bttv: (userId: string): string => `${STORAGE_KEYS.BTTV_CHANNEL_EMOTES_PREFIX}${userId}`,
}

export class EmotesRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getGlobalEmotes(provider: ThirdPartyEmoteProvider): Promise<EmoteSet<GlobalThirdPartyEmote>> {
		const data = await this._storage.get<GlobalThirdPartyEmote[]>(this._mapGlobalEmotesProviderToKey(provider))

		return new EmoteSet(provider, 'global', data ?? [])
	}

	public async getGlobalEmoteSets(
		providers?: ThirdPartyEmoteProvider[],
	): Promise<Map<ThirdPartyEmoteProvider, EmoteSet<GlobalThirdPartyEmote>>> {
		const data = await this._storage.getMany<GlobalThirdPartyEmote[]>(
			providers && providers.length > 0
				? providers.map(provider => PROVIDER_TO_GLOBAL_KEY_MAP[provider])
				: [
						STORAGE_KEYS.TWITCH_GLOBAL_EMOTES,
						STORAGE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
						STORAGE_KEYS.FFZ_GLOBAL_EMOTES,
						STORAGE_KEYS.BTTV_GLOBAL_EMOTES,
					],
		)

		return new Map<ThirdPartyEmoteProvider, EmoteSet<GlobalThirdPartyEmote>>(
			THIRD_PARTY_EMOTE_PROVIDERS.map(provider => [
				provider,
				new EmoteSet(provider, 'global', data[this._mapGlobalEmotesProviderToKey(provider)] ?? []),
			]),
		)
	}

	public async setGlobalEmotes(provider: ThirdPartyEmoteProvider, emotes: GlobalThirdPartyEmote[]): Promise<void> {
		return await this._storage.set(this._mapGlobalEmotesProviderToKey(provider), emotes)
	}

	public async clearGlobalEmotes(provider?: ThirdPartyEmoteProvider): Promise<void> {
		await this._storage.remove(
			provider
				? this._mapGlobalEmotesProviderToKey(provider)
				: [
						STORAGE_KEYS.TWITCH_GLOBAL_EMOTES,
						STORAGE_KEYS.SEVEN_TV_GLOBAL_EMOTES,
						STORAGE_KEYS.FFZ_GLOBAL_EMOTES,
						STORAGE_KEYS.BTTV_GLOBAL_EMOTES,
					],
		)
	}

	public async getChannelEmotes(userId: string, provider: ThirdPartyEmoteProvider): Promise<EmoteSet<ChannelEmote>> {
		const data = await this._storage.get<ChannelEmote[]>(this._mapChannelEmotesProviderToKey(provider, userId))

		return new EmoteSet(provider, 'channel', data ?? [])
	}

	public async getChannelEmoteSets(
		userId: string,
		providers?: ThirdPartyEmoteProvider[],
	): Promise<Map<ThirdPartyEmoteProvider, EmoteSet<ChannelEmote>>> {
		const keys: Record<ThirdPartyEmoteProvider, string> = {
			twitch: PROVIDER_TO_CHANNEL_KEY_MAP.twitch(userId),
			stv: PROVIDER_TO_CHANNEL_KEY_MAP.stv(userId),
			ffz: PROVIDER_TO_CHANNEL_KEY_MAP.ffz(userId),
			bttv: PROVIDER_TO_CHANNEL_KEY_MAP.bttv(userId),
		}

		const data = await this._storage.getMany<ChannelEmote[]>(
			providers && providers.length > 0 ? providers.map(provider => keys[provider]) : Object.values(keys),
		)

		return new Map<ThirdPartyEmoteProvider, EmoteSet<ChannelEmote>>(
			THIRD_PARTY_EMOTE_PROVIDERS.map(provider => [
				provider,
				new EmoteSet(provider, 'channel', data[keys[provider]] ?? []),
			]),
		)
	}

	public async setChannelEmotes(
		userId: string,
		provider: ThirdPartyEmoteProvider,
		emotes: ChannelEmote[],
	): Promise<void> {
		return await this._storage.set(this._mapChannelEmotesProviderToKey(provider, userId), emotes)
	}

	public async clearChannelEmotes(userId: string, provider?: ThirdPartyEmoteProvider): Promise<void> {
		return await this._storage.remove(
			provider
				? this._mapChannelEmotesProviderToKey(provider, userId)
				: [
						this._mapChannelEmotesProviderToKey('twitch', userId),
						this._mapChannelEmotesProviderToKey('stv', userId),
						this._mapChannelEmotesProviderToKey('ffz', userId),
						this._mapChannelEmotesProviderToKey('bttv', userId),
					],
		)
	}

	private _mapGlobalEmotesProviderToKey(provider: ThirdPartyEmoteProvider): string {
		switch (provider) {
			case 'twitch':
				return STORAGE_KEYS.TWITCH_GLOBAL_EMOTES

			case 'stv':
				return STORAGE_KEYS.SEVEN_TV_GLOBAL_EMOTES

			case 'ffz':
				return STORAGE_KEYS.FFZ_GLOBAL_EMOTES

			case 'bttv':
				return STORAGE_KEYS.BTTV_GLOBAL_EMOTES

			default:
				throw new Error(`Invalid provider: ${String(provider)}`)
		}
	}

	private _mapChannelEmotesProviderToKey(provider: ThirdPartyEmoteProvider, userId: string): string {
		let prefix: string

		switch (provider) {
			case 'twitch':
				prefix = STORAGE_KEYS.TWITCH_CHANNEL_EMOTES_PREFIX

				break

			case 'stv':
				prefix = STORAGE_KEYS.SEVEN_TV_CHANNEL_EMOTES_PREFIX

				break

			case 'ffz':
				prefix = STORAGE_KEYS.FFZ_CHANNEL_EMOTES_PREFIX

				break

			case 'bttv':
				prefix = STORAGE_KEYS.BTTV_CHANNEL_EMOTES_PREFIX

				break

			default:
				throw new Error(`Invalid provider: ${String(provider)}`)
		}

		return `${prefix}${userId}`
	}
}
