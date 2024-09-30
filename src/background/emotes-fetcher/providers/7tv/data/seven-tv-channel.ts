import { type SevenTvEmoteSet } from './seven-tv-emote-set';

export interface SevenTvChannel {
	id: string;
	platform: 'TWITCH';
	username: string;
	display_name: string;
	linked_at: number;
	emote_capacity: number;
	emote_set_id: number | null;
	emote_set: SevenTvEmoteSet;
	user: object;
}
