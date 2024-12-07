import { type EmoteAutocompletionMatchType } from '@shared/enums';
import { type EmotesPriority } from '@shared/types/emotes-priority';

export interface EmoteAutocompletionSettings {
	useTabAutocompletion: boolean;
	useColonAutocompletion: boolean;
	matchType: EmoteAutocompletionMatchType;
	prioritizeFavoriteEmotes: boolean;
	prioritizePrefixMatchedEmotes: boolean;
	limit: number;
	priority: EmotesPriority;
	sortByPriority: boolean;
}
