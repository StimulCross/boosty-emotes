import { type CreateEmote, Emote } from './emote';
import { type EmoteProvider, type EmoteSize } from '../../types';

export class FfzEmote extends Emote {
	constructor(data: CreateEmote) {
		super('ffz', data);
	}

	public get provider(): Extract<EmoteProvider, 'ffz'> {
		return 'ffz';
	}

	public override getSrc(size: EmoteSize = 1): string {
		return `https://cdn.frankerfacez.com/emoticon/${this._data.id}/${size}`;
	}
}
