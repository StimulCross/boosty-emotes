import { type SevenTvEmoteData, type SevenTvEmoteOwner } from './emote';

export interface SevenTvEmoteSet {
	id: string;
	name: string;
	flags: number;
	tags: string[];
	immutable: boolean;
	privileged: boolean;
	emotes: SevenTvEmoteData[];
	emote_count: number;
	capacity: number;
	owner: SevenTvEmoteOwner;
}
