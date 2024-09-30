import { type SevenTvEmoteDataData } from './seven-tv-emote-data';

export interface SevenTvEmoteData {
	id: string;
	name: string;
	flags: number;
	timestamp: number;
	actor_id: string;
	data: SevenTvEmoteDataData;
}
