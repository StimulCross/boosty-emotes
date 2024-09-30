import { type CreateEmote, Emote } from './emote';
import { type EmoteProvider, type EmoteSize } from '../../types';

export class StvEmote extends Emote {
	constructor(data: CreateEmote) {
		super('7tv', data);
	}

	public get provider(): Extract<EmoteProvider, '7tv'> {
		return '7tv';
	}

	public override getSrc(size: EmoteSize = 1): string {
		return `https://cdn.7tv.app/emote/${this._data.id}/${size}x.webp`;
	}
}
