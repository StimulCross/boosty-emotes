import type { FavoriteEmote } from '@shared/models/favorite-emote.ts'

export interface FavoriteEmotesService {
	get total(): number

	init: () => Promise<void>
	destroy: () => void
	isFavorite: (emote: FavoriteEmote) => boolean
	add: (emote: FavoriteEmote) => Promise<void>
	remove: (emote: FavoriteEmote) => Promise<void>

	emotes: () => IterableIterator<FavoriteEmote>
}
