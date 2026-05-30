import type { EventMessageGlobalFavoriteEmotesUpdate, MessageDispatcher, MessageReceiver } from '@shared/messaging'
import type { FavoriteEmote, GlobalFavoriteEmote } from '@shared/models/favorite-emote.ts'
import type { EmoteProvider } from '@shared/types'
import type { FavoriteEmotesService } from './favorite-emotes-service.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class GlobalFavoriteEmotesService implements FavoriteEmotesService {
	private readonly _logger = createAppLogger('GlobalFavoriteEmotesService')
	private readonly _emotes: Map<EmoteProvider, Map<string, GlobalFavoriteEmote>> = new Map()
	private _isInitialized = false

	constructor(
		private readonly _messageReceiver: MessageReceiver,
		private readonly _messageDispatcher: MessageDispatcher,
		emotes?: Iterable<GlobalFavoriteEmote>,
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

	public async init(): Promise<void> {
		if (this._isInitialized)
			return

		this._messageReceiver.registerEvent('global_favorite_emotes_update', this._handleGlobalFavoriteEmotesUpdate)

		const emotes = await storage.favoriteEmotes.getGlobalFavorites()

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
		this._messageReceiver.unregisterEvent('global_favorite_emotes_update', this._handleGlobalFavoriteEmotesUpdate)
	}

	public isFavorite({ provider, id }: FavoriteEmote): boolean {
		return this._emotes.get(provider)?.has(id) ?? false
	}

	public async add(emote: FavoriteEmote): Promise<void> {
		if (this.isFavorite(emote) || emote.scope !== 'global')
			return

		const favEmote: FavoriteEmote = { provider: emote.provider, id: emote.id, scope: emote.scope }

		try {
			await this._messageDispatcher.sendCommand({ type: 'add_global_favorite_emote', data: { emote: favEmote } })

			let map = this._emotes.get(emote.provider)

			if (!map) {
				map = new Map()
				this._emotes.set(emote.provider, map)
			}

			map.set(emote.id, emote)
		}
		catch (err) {
			this._logger.error('Failed to add global favorite emote', err)
		}
	}

	public async remove(emote: FavoriteEmote): Promise<void> {
		if (!this.isFavorite(emote) || emote.scope !== 'global')
			return

		const favEmote: FavoriteEmote = { provider: emote.provider, id: emote.id, scope: emote.scope }

		try {
			await this._messageDispatcher.sendCommand({ type: 'remove_global_favorite_emote', data: { emote: favEmote } })

			let map = this._emotes.get(emote.provider)

			if (!map) {
				map = new Map()
				this._emotes.set(emote.provider, map)
			}

			map.delete(emote.id)
		}
		catch (err) {
			this._logger.error('Failed to remove global favorite emote', err)
		}
	}

	public* emotes(): IterableIterator<GlobalFavoriteEmote> {
		for (const map of this._emotes.values())
			yield* map.values()
	}

	private readonly _handleGlobalFavoriteEmotesUpdate = async (
		message: EventMessageGlobalFavoriteEmotesUpdate,
	): Promise<void> => {
		const { added, removed } = message.data

		try {
			if (added.length === 0 && removed.length === 0)
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
			this._logger.error('Failed to handle global emotes update', err)
		}
	}
}
