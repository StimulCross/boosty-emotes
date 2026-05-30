import type {
	CommandMessageAddChannelFavoriteEmote,
	CommandMessageAddGlobalFavoriteEmote,
	CommandMessageRemoveChannelFavoriteEmote,
	CommandMessageRemoveGlobalFavoriteEmote,
	MessageDispatcher,
	MessageReceiver,
} from '@shared/messaging'
import type { GlobalFavoriteEmote } from '@shared/models/favorite-emote.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class FavoriteEmotes {
	private readonly _logger = createAppLogger('FavoriteEmotes')

	constructor(
		private readonly _messageReceiver: MessageReceiver,
		private readonly _messageDispatcher: MessageDispatcher,
	) {
	}

	public init(): void {
		this._messageReceiver.registerCommand('add_global_favorite_emote', this._handleAddGlobalFavoriteEmote)
		this._messageReceiver.registerCommand('remove_global_favorite_emote', this._handleRemoveGlobalFavoriteEmote)
		this._messageReceiver.registerCommand('add_channel_favorite_emote', this._handleAddChannelFavoriteEmote)
		this._messageReceiver.registerCommand('remove_channel_favorite_emote', this._handleRemoveChannelFavoriteEmote)
	}

	public destroy(): void {
		this._messageReceiver.unregisterCommand('add_global_favorite_emote')
		this._messageReceiver.unregisterCommand('remove_global_favorite_emote')
		this._messageReceiver.unregisterCommand('add_channel_favorite_emote')
		this._messageReceiver.unregisterCommand('remove_channel_favorite_emote')
	}

	private readonly _handleAddGlobalFavoriteEmote = async (
		evt: CommandMessageAddGlobalFavoriteEmote,
	): Promise<void> => {
		const { emote } = evt.data

		this._logger.success(evt)

		try {
			const favEmote: GlobalFavoriteEmote = { provider: emote.provider, id: emote.id, scope: emote.scope }

			await storage.favoriteEmotes.addGlobalFavorite(favEmote)

			this._messageDispatcher.broadcastEvent({
				type: 'global_favorite_emotes_update',
				data: {
					added: [favEmote],
					removed: [],
				},
			})
		}
		catch (err) {
			this._logger.error(
				`Failed to add global favorite emote (provider: ${emote.provider}; id: ${emote.id}; ${emote.scope})`,
				err,
			)
		}
	}

	private readonly _handleRemoveGlobalFavoriteEmote = async (
		evt: CommandMessageRemoveGlobalFavoriteEmote,
	): Promise<void> => {
		const { emote } = evt.data

		try {
			await storage.favoriteEmotes.removeGlobalFavorite(emote)

			this._messageDispatcher.broadcastEvent({
				type: 'global_favorite_emotes_update',
				data: {
					added: [],
					removed: [emote],
				},
			})
		}
		catch (err) {
			this._logger.error(
				`Failed to remove global favorite emote (provider: ${emote.provider}; id: ${emote.id}; ${emote.scope})`,
				err,
			)
		}
	}

	private readonly _handleAddChannelFavoriteEmote = async (
		evt: CommandMessageAddChannelFavoriteEmote,
	): Promise<void> => {
		const { emote, userId } = evt.data

		try {
			await storage.favoriteEmotes.addChannelFavorite(userId, emote)

			this._messageDispatcher.broadcastEvent({
				type: 'channel_favorite_emotes_update',
				data: {
					userId,
					added: [emote],
					removed: [],
				},
			})
		}
		catch (err) {
			this._logger.error(
				`Failed to add channel favorite emote (provider: ${emote.provider}; id: ${emote.id}; ${emote.scope}) for user "${userId}"`,
				err,
			)
		}
	}

	private readonly _handleRemoveChannelFavoriteEmote = async (
		evt: CommandMessageRemoveChannelFavoriteEmote,
	): Promise<void> => {
		const { emote, userId } = evt.data

		try {
			await storage.favoriteEmotes.removeChannelFavorite(userId, emote)

			this._messageDispatcher.broadcastEvent({
				type: 'channel_favorite_emotes_update',
				data: {
					userId,
					added: [],
					removed: [emote],
				},
			})
		}
		catch (err) {
			this._logger.error(
				`Failed to remove channel favorite emote (provider: ${emote.provider}; id: ${emote.id}; ${emote.scope}) for user "${userId}"`,
				err,
			)
		}
	}
}
