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
		return `https://static-cdn.jtvnw.net/emoticons/v2/${this._data.id}/default/light/${size === 4 ? 3 : size}.0`;
	}
}
