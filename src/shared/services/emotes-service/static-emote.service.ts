import type { EmoteSet } from '@shared/emote-context'
import type { Emote } from '@shared/models'
import type { EmoteService } from '@shared/services'
import type { EmoteProvider } from '@shared/types'

export class StaticEmotesService<TEmote extends Emote = Emote> implements EmoteService<TEmote> {
	public emoteSets = new Map<TEmote['provider'], EmoteSet<TEmote>>()

	constructor(emoteSet: EmoteSet<TEmote>) {
		this.emoteSets = new Map([[emoteSet.provider, emoteSet]])
	}

	public getEmoteSet(provider: EmoteProvider): EmoteSet<TEmote> | null {
		return this.emoteSets.get(provider) ?? null
	}

	public async init(): Promise<void> {
		// no-op
	}

	public destroy(): void {
		// no-op
	}

	public subscribe(_cb: () => void): () => void {
		// eslint-disable-next-line unicorn/consistent-function-scoping
		return () => { /* no-op */ }
	}
}
