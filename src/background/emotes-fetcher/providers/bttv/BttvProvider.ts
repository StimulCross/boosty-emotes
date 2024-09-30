import { BttvEmote } from '@shared/models';
import type { BttvChannelEmotesData } from './data/BttvChannelEmotes';
import type { BttvGlobalEmoteData } from './data/emote/BttvGlobalEmote';

export class BttvProvider {
	public async getGlobalEmotes(): Promise<BttvEmote[]> {
		const response = await fetch('https://api.betterttv.net/3/cached/emotes/global');
		const data = (await response.json()) as BttvGlobalEmoteData[];
		return data.map(emote => new BttvEmote({ scope: 'global', id: emote.id, name: emote.code }));
	}

	public async getChannelEmotes(userId: string): Promise<BttvEmote[]> {
		const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId}`);
		const data = (await response.json()) as BttvChannelEmotesData;

		const result: BttvEmote[] = [];

		for (const emote of data.channelEmotes) {
			result.push(new BttvEmote({ scope: 'channel', id: emote.id, name: emote.code }));
		}

		for (const emote of data.sharedEmotes) {
			result.push(new BttvEmote({ scope: 'channel', id: emote.id, name: emote.code }));
		}

		return result;
	}
}
