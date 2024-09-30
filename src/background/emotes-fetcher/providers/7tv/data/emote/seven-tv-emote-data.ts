import { type SevenTvEmoteHost } from './seven-tv-emote-host';
import { type SevenTvEmoteOwner } from './seven-tv-emote-owner';
import { type SevenTvEmoteState } from './seven-tv-emote-state';

export interface SevenTvEmoteDataData {
	id: string;
	name: string;
	flags: number;
	lifecycle: number;
	state: SevenTvEmoteState[];
	listed: boolean;
	animated: boolean;
	owner?: SevenTvEmoteOwner;
	host: SevenTvEmoteHost;
}
