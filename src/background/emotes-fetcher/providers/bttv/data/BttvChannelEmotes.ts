import type { BttvChannelEmoteData } from './emote/BttvChannelEmote';
import type { BttvSharedEmoteData } from './emote/BttvSharedEmote';

export interface BttvChannelEmotesData {
	id: string;
	bots: string[];
	avatar: string;
	channelEmotes: BttvChannelEmoteData[];
	sharedEmotes: BttvSharedEmoteData[];
}
