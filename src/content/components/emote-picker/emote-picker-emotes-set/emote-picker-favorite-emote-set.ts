import { type Logger } from '@stimulcross/logger';
import { EMOTE_PICKER_EVENTS } from '@content/components/emote-picker/constants';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmotePickerState } from '@shared/models';
import type { FavoriteEmote } from '@shared/models/favorite-emote';
import { type EmoteProvider, type EmoteScope, type EmotesSet } from '@shared/types';
import { EmotePickerEmoteSet } from './emote-picker-emote-set';
import { type EmoteInserter } from '../../emote-inserter';

export class EmotePickerFavoriteEmoteSet extends EmotePickerEmoteSet {
	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		logger: Logger,
		emotesSet: EmotesSet,
		scope: EmoteScope,
		emoteInserter: EmoteInserter,
		state: EmotePickerState,
		favoriteEmotes: FavoriteEmotes
	) {
		super($root, emitter, logger, 'favorite', emotesSet, scope, emoteInserter, state, favoriteEmotes);

		this._onFavoriteEmoteAdd = this._onFavoriteEmoteAdd.bind(this);
		this._onFavoriteEmoteRemove = this._onFavoriteEmoteRemove.bind(this);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.favoriteEmoteAdded, this._onFavoriteEmoteAdd);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, this._onFavoriteEmoteRemove);
	}

	public override destroy(): void {
		super.destroy();
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.favoriteEmoteAdded, this._onFavoriteEmoteAdd);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, this._onFavoriteEmoteRemove);
	}

	protected override _getEmotesListHtml(): string {
		let emotes = '';

		for (const emote of this._emotesSet.values()) {
			emotes += emote.toButton(1, 'BE-emote-picker__emote-button', 'BE-emote-picker__emote', true).outerHTML;
		}

		return emotes;
	}

	protected override async _handleEmoteCtrlClick(emote: HTMLButtonElement): Promise<void> {
		const id = emote.dataset.id!;
		const provider = emote.dataset.provider as EmoteProvider;
		const scope = emote.dataset.scope as EmoteScope;

		const isFavorite =
			scope === 'global'
				? this._favoriteEmotes.isGlobalFavorite({ id, provider, scope })
				: this._favoriteEmotes.isChannelFavorite({ id, provider, scope });

		if (!isFavorite) {
			return;
		}

		if (scope === 'global') {
			await this._favoriteEmotes.removeGlobalEmoteFromFavorite({ id, provider, scope });
		} else {
			await this._favoriteEmotes.removeChannelEmoteFromFavorite({ id, provider, scope });
		}

		this._removeFavoriteIconFromEmote(emote);

		emote.remove();
		this._emitter.emit(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, { id, provider, scope });

		this._updateEmoteSetVisibility();
	}

	private _onFavoriteEmoteAdd(emote: HTMLButtonElement): void {
		try {
			const scope = emote.dataset.scope;

			if (this._scope !== scope) {
				return;
			}

			this._emotesList.append(emote);
			this._updateEmoteSetVisibility();
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onFavoriteEmoteRemove({ provider, scope, id }: FavoriteEmote): void {
		try {
			if (this._scope !== scope) {
				return;
			}

			for (const emote of this._emotesList.children) {
				if (emote instanceof HTMLElement && emote.dataset.id === id && emote.dataset.provider === provider) {
					emote.remove();
				}
			}

			this._updateEmoteSetVisibility();
		} catch (e) {
			this._logger.error(e);
		}
	}
}
