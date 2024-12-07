import { type EmoteAutocompletionMatchType } from '@shared/enums';
import { type Emote } from '@shared/models';

export interface EmoteMatch {
	emote: Emote;
	matchType: EmoteAutocompletionMatchType;
	isFavorite?: boolean;
}
