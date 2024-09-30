import { StvEmote } from '@shared/models';
import { type EmoteScope } from '@shared/types';
import { type SevenTvChannel, type SevenTvEmoteData, type SevenTvEmoteSet } from './data';

export class SevenTvProvider {
	public async getGlobalEmotes(): Promise<StvEmote[]> {
		const response = await fetch('https://7tv.io/v3/emote-sets/global');
		const data = (await response.json()) as SevenTvEmoteSet;
		return data.emotes.map(emote => this._mapEmote(emote, 'global'));
	}

	public async getChannelEmotes(userId: string): Promise<StvEmote[]> {
		const response = await fetch(`https://7tv.io/v3/users/twitch/${userId}`);
		const data = (await response.json()) as SevenTvChannel;
		return data.emote_set.emotes.map(emote => this._mapEmote(emote, 'channel'));
	}

	private _mapEmote(emote: SevenTvEmoteData, category: EmoteScope): StvEmote {
		return new StvEmote({
			scope: category,
			id: emote.data.id,
			name: emote.data.name,
			flags: emote.data.flags,
			hidden: (emote.data.flags || 0 & 256) !== 0,
			ownerId: emote.data.owner?.id,
			owner: emote.data.owner
				? {
						id: emote.data.owner.id,
						name: emote.data.owner.username,
						displayName: emote.data.owner.display_name
					}
				: undefined
		});
	}
}
