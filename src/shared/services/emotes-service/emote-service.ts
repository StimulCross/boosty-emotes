import type { EmoteSet } from '@shared/emote-context'
import type { Emote } from '@shared/models'
import type { EmoteProvider } from '@shared/types'

export interface EmoteService<TEmote extends Emote = Emote> {
	get emoteSets(): Map<EmoteProvider, EmoteSet<TEmote>>
	getEmoteSet: (provider: EmoteProvider) => EmoteSet<TEmote> | null
	init: () => Promise<void>
	destroy: () => void
	subscribe: (cb: () => void) => () => void
}
