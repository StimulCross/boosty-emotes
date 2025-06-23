import { html } from 'code-tag';
import { getBoostyEmoteUrl } from '@shared/utils/get-emote-url';
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
		return getBoostyEmoteUrl(this._data.id, size === 4 ? 3 : size);
	}

	public override toHtml(size: EmoteSize = 1, classes: string = 'BE-emote'): string {
		return html`<img
				translate="no"
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
}
