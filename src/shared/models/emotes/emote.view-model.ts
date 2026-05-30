import type { Emote } from '@shared/models'
import type { EmoteProvider, EmoteScope, EmoteType } from '@shared/types'
import { getEmoteUrl } from '@shared/utils'

export interface EmoteViewModel {
	type: EmoteType
	provider: EmoteProvider
	id: string
	name: string
	scope: EmoteScope
	url: string
	isFavorite?: boolean
	flags?: number
}

export function emoteToViewModel({ type, provider, id, scope, name, flags }: Emote, isFavorite?: boolean): EmoteViewModel {
	return {
		type,
		id,
		provider,
		scope,
		name,
		url: getEmoteUrl(provider, id),
		flags,
		isFavorite,
	}
}
