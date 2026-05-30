import type { EmotesPriority } from '@shared/types/emotes-priority'

export type EmoteAutocompletionMatchType = 'starts-with' | 'contains'

export interface EmoteAutocompletionSettings {
	useTabAutocompletion: boolean
	useColonAutocompletion: boolean
	matchType: EmoteAutocompletionMatchType
	prioritizeFavoriteEmotes: boolean
	prioritizePrefixMatchedEmotes: boolean
	limit: number
	priority: EmotesPriority
	sortByPriority: boolean
}
