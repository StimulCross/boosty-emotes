import type { Emote, EmoteAutocompletionMatchType } from '@shared/models'

export interface EmoteMatch {
	emote: Emote
	matchType: EmoteAutocompletionMatchType
	isFavorite?: boolean
}
