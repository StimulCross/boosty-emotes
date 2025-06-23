import { getTwitchEmoteUrl } from '@shared/utils/get-emote-url';
import { type CreateEmote, Emote } from './emote';
import { type EmoteProvider, type EmoteSize } from '../../types';

export class TwitchEmote extends Emote {
	constructor(data: CreateEmote) {
		super('twitch', data);
	}

	public get provider(): Extract<EmoteProvider, 'twitch'> {
		return 'twitch';
	}

	public override getSrc(size: EmoteSize = 1): string {
		return getTwitchEmoteUrl(this._data.id, size === 4 ? 3 : size);
	}
}
