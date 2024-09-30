import { type CreateEmote, Emote } from './emote';
import { type EmoteProvider, type EmoteSize } from '../../types';

export class BttvEmote extends Emote {
	constructor(data: CreateEmote) {
		super('bttv', data);
	}

	public get provider(): Extract<EmoteProvider, 'bttv'> {
		return 'bttv';
	}

	public override getSrc(size: EmoteSize = 1): string {
		return `https://cdn.betterttv.net/emote/${this._data.id}/${size === 4 ? 3 : size}x.webp`;
	}
}
