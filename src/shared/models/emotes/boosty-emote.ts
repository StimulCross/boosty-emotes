import { html } from 'code-tag';
import { type CreateEmote, Emote } from './emote';
import { type EmoteProvider, type EmoteSize } from '../../types';

export class BoostyEmote extends Emote {
	constructor(data: CreateEmote) {
		super('boosty', data);
	}

	public get provider(): Extract<EmoteProvider, 'boosty'> {
		return 'boosty';
	}

	public override getSrc(size: EmoteSize = 1): string {
		return `https://images.boosty.to/smile/${this._data.id}/size/${this._mapSize(size)}`;
	}

	public override toHtml(size: EmoteSize = 1, classes: string = 'BE-emote'): string {
		return html`<img
				class="${classes}"
				alt="${this._data.name}"
				src="${this.getSrc(size)}"
				data-type="smile"
				data-provider="${this._data.provider}"
				data-id="${this._data.id}"
				data-tooltip="true"
				loading="lazy"
				decoding="async"
			/>`;
	}

	private _mapSize(size: EmoteSize): string {
		switch (size) {
			case 1:
				return 'small';

			case 2:
				return 'medium';

			case 4:
				return 'large';

			default:
				throw new Error(`Unknown Boosty emote size: ${size}`);
		}
	}
}
