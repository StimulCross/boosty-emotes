import type { FfzEmoteData } from '../emote/FfzEmote';

export interface FfzSetData {
	id: number;
	_type: number;
	icon: string | null;
	title: string | null;
	description: string | null;
	css: string | null;
	emoticons: FfzEmoteData[];
}
