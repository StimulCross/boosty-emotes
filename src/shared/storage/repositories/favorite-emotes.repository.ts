import type { LocalStorageProvider } from '@shared/storage/providers/local-storage.provider.ts'
import type { ChannelFavoriteEmote, GlobalFavoriteEmote } from '../../models/favorite-emote'
import { STORAGE_KEYS } from '@shared/storage/constants.ts'
import { Mutex } from '@shared/utils'

const mutex = new Mutex()

export class FavoriteEmotesRepository {
	constructor(private readonly _storage: LocalStorageProvider) {}

	public async getGlobalFavorites(): Promise<GlobalFavoriteEmote[]> {
		const data = await this._storage.get<GlobalFavoriteEmote[]>(STORAGE_KEYS.GLOBAL_FAVORITE_EMOTES)

		return data ?? []
	}

	public async addGlobalFavorite(emote: GlobalFavoriteEmote): Promise<void> {
		await mutex.run(async () => {
			const emotes = await this.getGlobalFavorites()

			await this.setGlobalFavorites(
				[
					...emotes.filter(e => !(e.provider === emote.provider && e.id === emote.id)),
					emote,
				],
			)
		})
	}

	public async removeGlobalFavorite(emote: GlobalFavoriteEmote): Promise<void> {
		await mutex.run(async () => {
			const emotes = await this.getGlobalFavorites()
			await this.setGlobalFavorites(emotes.filter(e => !(e.provider === emote.provider && e.id === emote.id)))
		})
	}

	public async setGlobalFavorites(emotes: GlobalFavoriteEmote[]): Promise<void> {
		await this._storage.set(STORAGE_KEYS.GLOBAL_FAVORITE_EMOTES, emotes)
	}

	public async getChannelFavorites(userId: string): Promise<ChannelFavoriteEmote[]> {
		const data = await this._storage.get<ChannelFavoriteEmote[]>(
			`${STORAGE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`,
		)

		return data ?? []
	}

	public async addChannelFavorite(userId: string, emote: ChannelFavoriteEmote): Promise<void> {
		await mutex.run(async () => {
			const emotes = await this.getChannelFavorites(userId)

			await this.setChannelFavorites(userId, [
				...emotes.filter(e => !(e.provider === emote.provider && e.id === emote.id)),
				emote,
			])
		})
	}

	public async removeChannelFavorite(userId: string, { id, provider }: ChannelFavoriteEmote): Promise<void> {
		await mutex.run(async () => {
			const emotes = await this.getChannelFavorites(userId)

			await this.setChannelFavorites(
				userId,
				emotes.filter(e => !(e.provider === provider && e.id === id)),
			)
		})
	}

	public async setChannelFavorites(userId: string, emotes: ChannelFavoriteEmote[]): Promise<void> {
		await this._storage.set(`${STORAGE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`, emotes)
	}

	public async clearChannelFavorites(userId: string): Promise<void> {
		await this._storage.remove(`${STORAGE_KEYS.CHANNEL_FAVORITE_EMOTES_PREFIX}${userId}`)
	}
}
