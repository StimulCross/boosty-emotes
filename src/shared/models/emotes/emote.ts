import { html } from 'code-tag';
import { type EmoteScope, type EmoteProvider, type EmoteSize } from '../../types';

export interface EmoteOwner {
	id: string;
	name: string;
	displayName: string;
}

export interface EmoteDataBase {
	provider: EmoteProvider;
	scope: EmoteScope;
	id: string;
	name: string;
	ownerId?: string;
	owner?: EmoteOwner;
	setId?: string;
	flags?: number;
	hidden?: boolean;
}

export type CreateEmote = Omit<EmoteDataBase, 'provider'>;

export interface TwitchEmoteData extends EmoteDataBase {
	provider: Extract<EmoteProvider, 'twitch'>;
	ownerId: string;
	setId: string;
}

export interface SevenTvEmoteData extends EmoteDataBase {
	provider: Extract<EmoteProvider, '7tv'>;
}

export interface FfzEmoteData extends EmoteDataBase {
	provider: Extract<EmoteProvider, 'ffz'>;
}

export interface BttvEmoteData extends EmoteDataBase {
	provider: Extract<EmoteProvider, 'bttv'>;
}

export interface BoostyEmoteData extends EmoteDataBase {
	provider: Extract<EmoteProvider, 'boosty'>;
	scope: Extract<EmoteScope, 'global'>;
}

export type EmoteData = EmoteDataBase | TwitchEmoteData;

export abstract class Emote {
	public abstract readonly provider: EmoteProvider;
	protected readonly _data: EmoteData;

	protected constructor(provider: EmoteProvider, data: CreateEmote) {
		this._data = { ...data, provider };
	}

	public get id(): string {
		return this._data.id;
	}

	public get name(): string {
		return this._data.name;
	}

	public abstract getSrc(size?: EmoteSize): string;

	public toHtml(size: EmoteSize = 1, classes: string = 'BE-emote'): string {
		return html`<img
				class="${classes}"
				alt="${this._data.name}"
				src="${this.getSrc(size)}"
				data-type="emote"
				data-provider="${this._data.provider}"
				data-id="${this._data.id}"
				data-tooltip="true"
				loading="lazy"
				decoding="async"
			/>`;
	}

	public toJSON(): EmoteData {
		return {
			provider: this._data.provider,
			scope: this._data.scope,
			id: this._data.id,
			name: this._data.name,
			ownerId: this._data.ownerId,
			owner: this._data.owner,
			setId: this._data.setId,
			flags: this._data.flags,
			hidden: this._data.hidden
		};
	}
}
