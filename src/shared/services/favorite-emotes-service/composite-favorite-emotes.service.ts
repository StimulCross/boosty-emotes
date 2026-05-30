import type { FavoriteEmote } from '@shared/models/favorite-emote.ts'
import type { ChannelFavoriteEmotesService, FavoriteEmotesService, GlobalFavoriteEmotesService } from '@shared/services'

export class CompositeFavoriteEmotesService implements FavoriteEmotesService {
	constructor(
		private readonly _global: GlobalFavoriteEmotesService,
		private readonly _channel?: ChannelFavoriteEmotesService,
	) {}

	public get total(): number {
		return this._global.total + (this._channel?.total ?? 0)
	}

	public async init(): Promise<void> {
		await Promise.all([this._global.init(), this._channel?.init()])
	}

	public destroy(): void {
		this._global.destroy()
		this._channel?.destroy()
	}

	public isFavorite(emote: FavoriteEmote): boolean {
		return (emote.scope === 'global' ? this._global.isFavorite(emote) : this._channel?.isFavorite(emote)) ?? false
	}

	public async add(emote: FavoriteEmote): Promise<void> {
		return emote.scope === 'global' ? await this._global.add(emote) : await this._channel?.add(emote)
	}

	public async remove(emote: FavoriteEmote): Promise<void> {
		return emote.scope === 'global' ? await this._global.remove(emote) : await this._channel?.remove(emote)
	}

	public* emotes(): IterableIterator<FavoriteEmote> {
		yield* this._global.emotes()

		if (this._channel)
			yield* this._channel.emotes()
	}
}
