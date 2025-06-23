import { html } from 'code-tag';
import { createFavoriteIcon } from '@shared/components/favorite-icon/create-favorite-icon';
import { EmoteAutocompletionMatchType } from '../../enums';
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
	private _nameLowerCase?: string;

	protected constructor(provider: EmoteProvider, data: CreateEmote) {
		this._data = { ...data, provider };
		this._nameLowerCase = this._data.name.toLowerCase();
	}

	public get scope(): EmoteScope {
		return this._data.scope;
	}

	public get id(): string {
		return this._data.id;
	}

	public get name(): string {
		return this._data.name;
	}

	public get nameLowerCase(): string {
		if (this._nameLowerCase) {
			return this._nameLowerCase;
		}

		return (this._nameLowerCase = this._data.name.toLowerCase());
	}

	matches(token: string): EmoteAutocompletionMatchType | null {
		if (this.nameLowerCase.startsWith(token)) {
			return EmoteAutocompletionMatchType.StartsWith;
		}

		if (this.nameLowerCase.includes(token)) {
			return EmoteAutocompletionMatchType.Includes;
		}

		return null;
	}

	public abstract getSrc(size?: EmoteSize): string;

	public toHtml(size: EmoteSize = 1, classes: string = 'BE-emote'): string {
		return html`<img
				translate="no"
				class="${classes}"
				alt="${this._data.name}"
				src="${this.getSrc(size)}"
				data-type="emote"
				data-provider="${this._data.provider}"
				data-scope="${this._data.scope}"
				data-id="${this._data.id}"
				data-tooltip="emote"
				loading="lazy"
				decoding="async"
			/>`;
	}

	public toButton(
		size: EmoteSize = 1,
		buttonClasses: string = '',
		imageClasses: string = 'BE-emote',
		isFavorite?: boolean
	): HTMLButtonElement {
		const button = document.createElement('button');
		button.setAttribute('class', buttonClasses);
		button.dataset.type = 'emote';
		button.dataset.provider = this._data.provider;
		button.dataset.scope = this._data.scope;
		button.dataset.id = this._data.id;
		button.dataset.name = this._data.name;
		button.dataset.tooltip = 'emote';

		const image = document.createElement('img');
		image.setAttribute('class', imageClasses);
		image.setAttribute('alt', this._data.name);
		image.setAttribute('src', this.getSrc(size));
		image.setAttribute('loading', 'lazy');
		image.setAttribute('decoding', 'async');
		image.dataset.type = 'emote';
		image.dataset.provider = this._data.provider;
		image.dataset.scope = this._data.scope;
		image.dataset.id = this._data.id;
		image.dataset.tooltip = 'emote';

		button.append(image);

		if (isFavorite) {
			button.append(createFavoriteIcon());
		}

		return button;
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
