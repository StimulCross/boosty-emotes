import type {
	EventMessageChannelFavoriteEmotesUpdate,
	MessageDispatcher,
	MessageReceiver,
} from '@shared/messaging'
import type { ChannelFavoriteEmote, FavoriteEmote } from '@shared/models/favorite-emote.ts'
import type { EmoteProvider } from '@shared/types'
import type { FavoriteEmotesService } from './favorite-emotes-service.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class ChannelFavoriteEmotesService implements FavoriteEmotesService {
	private readonly _logger = createAppLogger('ChannelFavoriteEmotesService')
	private readonly _emotes: Map<EmoteProvider, Map<string, ChannelFavoriteEmote>> = new Map()
	private _isInitialized = false

	constructor(
		private readonly _userId: string,
		private readonly _messageReceiver: MessageReceiver,
		private readonly _messageDispatcher: MessageDispatcher,
		emotes?: Iterable<ChannelFavoriteEmote>,
	) {
		if (emotes) {
			for (const emote of emotes) {
				let map = this._emotes.get(emote.provider)

				if (!map) {
					map = new Map()
					this._emotes.set(emote.provider, map)
				}

				map.set(emote.id, emote)
			}
		}
	}

	public get total(): number {
		return this._emotes.values().reduce((acc, cur) => acc + cur.size, 0)
	}

	public get userId(): string {
		return this._userId
	}

	public async init(): Promise<void> {
		if (this._isInitialized)
			return

		this._messageReceiver.registerEvent('channel_favorite_emotes_update', this._handleChannelFavoriteEmotesUpdate)

		const emotes = await storage.favoriteEmotes.getChannelFavorites(this._userId)

		for (const emote of emotes) {
			let map = this._emotes.get(emote.provider)

			if (!map) {
				map = new Map()
				this._emotes.set(emote.provider, map)
			}

			map.set(emote.id, emote)
		}

		this._isInitialized = true
	}

	public destroy(): void {
		this._messageReceiver.unregisterEvent('channel_favorite_emotes_update', this._handleChannelFavoriteEmotesUpdate)
	}

	public isFavorite({ provider, id }: FavoriteEmote): boolean {
		return this._emotes.get(provider)?.has(id) ?? false
	}

	public async add(emote: FavoriteEmote): Promise<void> {
		if (this.isFavorite(emote) || emote.scope !== 'channel')
			return

		const favEmote: FavoriteEmote = { provider: emote.provider, id: emote.id, scope: emote.scope }

		try {
			await this._messageDispatcher.sendCommand({
				type: 'add_channel_favorite_emote',
				data: {
					userId: this._userId,
					emote: favEmote,
				},
			})

			let map = this._emotes.get(emote.provider)

			if (!map) {
				map = new Map()
				this._emotes.set(emote.provider, map)
			}

			map.set(emote.id, favEmote)
		}
		catch (err) {
			this._logger.error('Failed to add channel favorite emote', err)
		}
	}

	public async remove(emote: FavoriteEmote): Promise<void> {
		if (!this.isFavorite(emote) || emote.scope !== 'channel')
			return

		const favEmote: FavoriteEmote = { provider: emote.provider, id: emote.id, scope: emote.scope }

		try {
			await this._messageDispatcher.sendCommand({
				type: 'remove_channel_favorite_emote',
				data: {
					userId: this._userId,
					emote: favEmote,
				},
			})

			let map = this._emotes.get(emote.provider)

			if (!map) {
				map = new Map()
				this._emotes.set(emote.provider, map)
			}

			map.delete(emote.id)
		}
		catch (err) {
			this._logger.error('Failed to remove channel favorite emote', err)
		}
	}

	public* emotes(): IterableIterator<ChannelFavoriteEmote> {
		for (const map of this._emotes.values())
			yield* map.values()
	}

	private readonly _handleChannelFavoriteEmotesUpdate = async (
		message: EventMessageChannelFavoriteEmotesUpdate,
	): Promise<void> => {
		const { userId, added, removed } = message.data

		try {
			if (this._userId !== userId || (added.length === 0 && removed.length === 0))
				return

			for (const emote of added) {
				const map = this._emotes.get(emote.provider)
				map?.set(emote.id, emote)
			}

			for (const emote of removed) {
				const map = this._emotes.get(emote.provider)
				map?.delete(emote.id)
			}
		}
		catch (err) {
			this._logger.error(`Failed to handle channel emotes update for user "${userId}"`, err)
		}
	}
}
