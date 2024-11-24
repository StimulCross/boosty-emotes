import { type EmoteProvider, type EmoteScope } from '@shared/types';

export interface FavoriteEmote {
	provider: EmoteProvider;
	scope: EmoteScope;
	id: string;
}
