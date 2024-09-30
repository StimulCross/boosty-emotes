import { type EmoteScope } from '@/shared/types';
import { FfzEmote } from '@shared/models';
import type { FfzEmoteData } from './data/emote/FfzEmote';
import type { FfzGlobalEmotesData } from './data/FfzGlobalEmotes';
import type { FfzRoomWithSetsData } from './data/FfzRoomWithSets';

export class FfzProvider {
	public async getGlobalEmotes(): Promise<FfzEmote[]> {
		const response = await fetch('https://api.frankerfacez.com/v1/set/global');
		const data = (await response.json()) as FfzGlobalEmotesData;

		const result: FfzEmoteData[] = [];

		for (const [, set] of Object.entries(data.sets)) {
			result.push(...set.emoticons);
		}

		return result.map(emote => this._mapEmote(emote, 'global'));
	}

	public async getChannelEmotes(userId: string): Promise<FfzEmote[]> {
		const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${userId}`);
		const data = (await response.json()) as FfzRoomWithSetsData;

		const result: FfzEmoteData[] = [];

		for (const [, set] of Object.entries(data.sets)) {
			result.push(...set.emoticons);
		}

		return result.map(emote => this._mapEmote(emote, 'channel'));
	}

	private _mapEmote(emote: FfzEmoteData, category: EmoteScope): FfzEmote {
		return new FfzEmote({
			scope: category,
			id: String(emote.id),
			name: emote.name,
			flags: emote.modifier_flags,
			hidden: emote.hidden,
			ownerId: String(emote.owner?._id),
			owner: emote.owner
				? { id: String(emote.owner._id), name: emote.owner.name, displayName: emote.owner.display_name }
				: undefined
		});
	}
}
