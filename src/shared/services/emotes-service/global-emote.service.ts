import type { EmoteSet } from '@shared/emote-context'
import type { EventMessageGlobalEmotesUpdate, MessageReceiver } from '@shared/messaging'
import type { GlobalThirdPartyEmote } from '@shared/models'
import type { EmoteProvider, ThirdPartyEmoteProvider } from '@shared/types'
import type { EmoteService } from './emote-service.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'

export class GlobalEmoteService implements EmoteService<GlobalThirdPartyEmote> {
	private readonly _logger = createAppLogger('GlobalEmoteService')
	private _emoteSets = new Map<EmoteProvider, EmoteSet<GlobalThirdPartyEmote>>()
	private readonly _subscribers = new Set<() => void>()

	constructor(private readonly _messageReceiver: MessageReceiver) {}

	public get emoteSets(): Map<EmoteProvider, EmoteSet<GlobalThirdPartyEmote>> {
		return this._emoteSets
	}

	public getEmoteSet(provider: EmoteProvider): EmoteSet<GlobalThirdPartyEmote> | null {
		return this._emoteSets.get(provider) ?? null
	}

	public async init(): Promise<void> {
		this._emoteSets = await storage.emotes.getGlobalEmoteSets()
		this._messageReceiver.registerEvent('global_emotes_update', this._handleGlobalEmotesUpdate)
	}

	public destroy(): void {
		this._messageReceiver.unregisterEvent('global_emotes_update', this._handleGlobalEmotesUpdate)
	}

	public subscribe(cb: () => void) {
		this._subscribers.add(cb)

		return () => this._subscribers.delete(cb)
	}

	private readonly _handleGlobalEmotesUpdate = async (message: EventMessageGlobalEmotesUpdate): Promise<void> => {
		try {
			if (message.data.added.length === 0 && message.data.removed.length === 0)
				return

			const { added, removed } = message.data

			const changedProviders = new Set<ThirdPartyEmoteProvider>([
				...added.map(emote => emote.provider),
				...removed.map(emote => emote.provider),
			])

			if (changedProviders.size === 0)
				return

			const updatedSets = await storage.emotes.getGlobalEmoteSets([...changedProviders])

			if (updatedSets.size === 0)
				return

			for (const [provider, set] of updatedSets)
				this._emoteSets.set(provider, set)

			for (const cb of this._subscribers)
				cb()
		}
		catch (err) {
			this._logger.error('Failed to update global emotes', err)
		}
	}
}
