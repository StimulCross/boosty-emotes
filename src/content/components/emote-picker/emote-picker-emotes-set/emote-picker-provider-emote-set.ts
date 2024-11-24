import { type Logger } from '@stimulcross/logger';
import { EMOTE_PICKER_EVENTS } from '@content/components/emote-picker/constants';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { createFavoriteIcon } from '@shared/components/favorite-icon/create-favorite-icon';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmotePickerState } from '@shared/models';
import { type FavoriteEmote } from '@shared/models/favorite-emote';
import { type EmoteProvider, type EmoteScope, type EmotesSet } from '@shared/types';
import { EmotePickerEmoteSet } from './emote-picker-emote-set';
import { type EmoteInserter } from '../../emote-inserter';

export class EmotePickerProviderEmoteSet extends EmotePickerEmoteSet {
	constructor(
		private readonly _provider: EmoteProvider,
		$root: HTMLDivElement,
		emitter: EventEmitter,
		logger: Logger,
		emotesSet: EmotesSet,
		scope: EmoteScope,
		emoteInserter: EmoteInserter,
		state: EmotePickerState,
		favoriteEmotes: FavoriteEmotes
	) {
		super($root, emitter, logger, _provider, emotesSet, scope, emoteInserter, state, favoriteEmotes);
		this._onFavoriteEmoteRemove = this._onFavoriteEmoteRemove.bind(this);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, this._onFavoriteEmoteRemove);
	}

	public destroy(): void {
		super.destroy();
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, this._onFavoriteEmoteRemove);
	}

	protected override _getEmotesListHtml(): string {
		let emotes = '';

		if (this._scope === 'global') {
			for (const emote of this._emotesSet.values()) {
				emotes += emote.toButton(
					1,
					'BE-emote-picker__emote-button',
					'BE-emote-picker__emote',
					this._favoriteEmotes.isGlobalFavorite(emote)
				).outerHTML;
			}
		} else {
			for (const emote of this._emotesSet.values()) {
				emotes += emote.toButton(
					1,
					'BE-emote-picker__emote-button',
					'BE-emote-picker__emote',
					this._favoriteEmotes.isChannelFavorite(emote)
				).outerHTML;
			}
		}

		return emotes;
	}

	protected override async _handleEmoteCtrlClick(emote: HTMLButtonElement): Promise<void> {
		const id = emote.dataset.id!;
		const provider = emote.dataset.provider as EmoteProvider;
		const scope = emote.dataset.scope as EmoteScope;

		const isFavorite =
			this._scope === 'global'
				? this._favoriteEmotes.isGlobalFavorite({ id, provider, scope })
				: this._favoriteEmotes.isChannelFavorite({ id, provider, scope });

		if (isFavorite) {
			this._scope === 'global'
				? await this._favoriteEmotes.removeGlobalEmoteFromFavorite({ id, provider, scope })
				: await this._favoriteEmotes.removeChannelEmoteFromFavorite({ id, provider, scope });

			this._removeFavoriteIconFromEmote(emote);
			this._emitter.emit(EMOTE_PICKER_EVENTS.favoriteEmoteRemoved, {
				provider: this._provider,
				scope: this._scope,
				id
			});
		} else {
			this._scope === 'global'
				? await this._favoriteEmotes.addGlobalEmoteToFavorite({ id, provider, scope })
				: await this._favoriteEmotes.addChannelEmoteToFavorite({ id, provider, scope });

			emote.append(createFavoriteIcon());

			this._emitter.emit(EMOTE_PICKER_EVENTS.favoriteEmoteAdded, emote.cloneNode(true));
		}
	}

	private _onFavoriteEmoteRemove({ provider, scope, id }: FavoriteEmote): void {
		try {
			if (this._provider !== provider || this._scope !== scope) {
				return;
			}

			for (const emote of this._emotesList.children) {
				if (emote instanceof HTMLElement && emote.dataset.id === id) {
					this._removeFavoriteIconFromEmote(emote);
				}
			}

			this._updateEmoteSetVisibility();
		} catch (e) {
			this._logger.error(e);
		}
	}
}
