import type { Emote } from '@shared/models'
import type { EmoteMap } from '@shared/types'

export class EmoteSet<out TEmote extends Emote = Emote> {
	private readonly _emotes = new Map<string, TEmote>()

	constructor(
		private readonly _provider: TEmote['provider'],
		private readonly _scope: TEmote['scope'],
		emotes: Iterable<TEmote>,
	) {
		for (const emote of emotes)
			this._emotes.set(emote.id, emote)
	}

	public get provider(): TEmote['provider'] {
		return this._provider
	}

	public get scope(): TEmote['scope'] {
		return this._scope
	}

	public get emotes(): EmoteMap<TEmote> {
		return this._emotes
	}

	public [Symbol.iterator](): IterableIterator<TEmote> {
		return this._emotes.values()
	}
}
