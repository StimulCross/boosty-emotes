import type { EmoteSet } from '@shared/emote-context'
import type { EventMessageChannelEmotesUpdate, MessageReceiver } from '@shared/messaging'
import type { ChannelEmote } from '@shared/models'
import type { EmoteProvider, ThirdPartyEmoteProvider } from '@shared/types'
import type { EmoteService } from './emote-service.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class ChannelEmoteService implements EmoteService<ChannelEmote> {
	private readonly _logger = createAppLogger('ChannelEmoteService')
	private _emoteSets = new Map<EmoteProvider, EmoteSet<ChannelEmote>>()
	private readonly _subscribers = new Set<() => void>()

	constructor(
		private readonly _userId: string,
		private readonly _messageReceiver: MessageReceiver,
	) {}

	public get emoteSets(): Map<EmoteProvider, EmoteSet<ChannelEmote>> {
		return this._emoteSets
	}

	public getEmoteSet(provider: EmoteProvider): EmoteSet<ChannelEmote> | null {
		return this._emoteSets.get(provider) ?? null
	}

	public async init(): Promise<void> {
		this._emoteSets = await storage.emotes.getChannelEmoteSets(this._userId)
		this._messageReceiver.registerEvent('channel_emotes_update', this._handleChannelEmotesUpdate)
	}

	public destroy(): void {
		this._messageReceiver.unregisterEvent('channel_emotes_update', this._handleChannelEmotesUpdate)
	}

	public subscribe(cb: () => void) {
		this._subscribers.add(cb)

		return () => this._subscribers.delete(cb)
	}

	private readonly _handleChannelEmotesUpdate = async (message: EventMessageChannelEmotesUpdate): Promise<void> => {
		try {
			if (
				message.data.userId !== this._userId
				|| (message.data.added.length === 0 && message.data.removed.length === 0)
			) {
				return
			}

			const { added, removed } = message.data

			const changedProviders = new Set<ThirdPartyEmoteProvider>([
				...added.map(emote => emote.provider),
				...removed.map(emote => emote.provider),
			])

			if (changedProviders.size === 0)
				return

			const updatedSets = await storage.emotes.getChannelEmoteSets(this._userId, [...changedProviders])

			if (updatedSets.size === 0)
				return

			for (const [provider, set] of updatedSets)
				this._emoteSets.set(provider, set)

			for (const cb of this._subscribers)
				cb()
		}
		catch (err) {
			this._logger.error(`Failed to update channel emotes of user ${this._userId}`, err)
		}
	}
}
