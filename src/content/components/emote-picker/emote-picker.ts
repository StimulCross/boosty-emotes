import { createLogger } from '@stimulcross/logger';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { type EventEmitter } from '@shared/event-emitter';
import { type Emote, type EmotePickerState } from '@shared/models';
import { type ScopesEmotesSets, type ThirdPartyEmoteProvider } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmoteInserter, type RedactorsState } from '..';
import {
	type EmotePickerEmoteSet,
	EmotePickerFavoriteEmoteSet,
	EmotePickerProviderEmoteSet
} from './emote-picker-emotes-set';
import { EmotePickerBody, EmotePickerHeader, EmotePickerEmoteSets, EmotePickerSearch } from '.';

export class EmotePicker {
	private static readonly _logger = createLogger(createLoggerOptions(EmotePicker.name));

	private readonly _header: EmotePickerHeader;
	private readonly _search: EmotePickerSearch;
	private readonly _body: EmotePickerBody;

	constructor(
		private readonly $root: HTMLDivElement,
		private readonly _emitter: EventEmitter,
		private readonly $publisher: HTMLElement,
		private readonly _redactorsState: RedactorsState,
		private readonly _state: EmotePickerState,
		private readonly _emoteSets: ScopesEmotesSets,
		private readonly _favoriteEmotes: FavoriteEmotes,
		bottomOffset?: string
	) {
		this.$root.classList.add('BE-emote-picker');

		if (bottomOffset) {
			this.$root.style.bottom = bottomOffset;
		}

		this._header = new EmotePickerHeader(
			document.createElement('div'),
			this._emitter,
			EmotePicker._logger,
			this._state
		);
		this.$root.append(this._header.root);

		this._search = new EmotePickerSearch(document.createElement('div'), this._emitter, EmotePicker._logger);
		this.$root.append(this._search.root);

		const providerEmoteSets: EmotePickerEmoteSets[] = [];

		const emoteInserter = new EmoteInserter(this.$publisher, this._redactorsState);

		const globalEmotes = this._emoteSets.get('global');
		const channelEmotes = this._emoteSets.get('channel');

		const globalFavoriteEmotes = new Map<string, Emote>();

		if (globalEmotes) {
			for (const providerEmotes of globalEmotes.values()) {
				for (const emote of providerEmotes.values()) {
					if (this._favoriteEmotes.isGlobalFavorite(emote)) {
						globalFavoriteEmotes.set(emote.id, emote);
					}
				}
			}
		}

		const favoriteEmoteSets: EmotePickerEmoteSet[] = [];

		if (this._favoriteEmotes.channelFavoriteEmotes && channelEmotes) {
			const channelFavoriteEmotes = new Map<string, Emote>();

			for (const providerEmotes of channelEmotes.values()) {
				for (const emote of providerEmotes.values()) {
					if (this._favoriteEmotes.isChannelFavorite(emote)) {
						channelFavoriteEmotes.set(emote.id, providerEmotes.get(emote.name)!);
					}
				}
			}

			favoriteEmoteSets.push(
				new EmotePickerFavoriteEmoteSet(
					document.createElement('div'),
					_emitter,
					EmotePicker._logger,
					channelFavoriteEmotes,
					'channel',
					emoteInserter,
					this._state,
					this._favoriteEmotes
				)
			);
		}

		favoriteEmoteSets.push(
			new EmotePickerFavoriteEmoteSet(
				document.createElement('div'),
				_emitter,
				EmotePicker._logger,
				globalFavoriteEmotes,
				'global',
				emoteInserter,
				this._state,
				this._favoriteEmotes
			)
		);

		providerEmoteSets.push(
			new EmotePickerEmoteSets(
				document.createElement('div'),
				_emitter,
				EmotePicker._logger,
				this._state,
				'favorite',
				favoriteEmoteSets
			)
		);

		if (globalEmotes?.has('boosty')) {
			providerEmoteSets.push(
				new EmotePickerEmoteSets(
					document.createElement('div'),
					_emitter,
					EmotePicker._logger,
					this._state,
					'boosty',
					[
						new EmotePickerProviderEmoteSet(
							'boosty',
							document.createElement('div'),
							_emitter,
							EmotePicker._logger,
							globalEmotes.get('boosty')!,
							'global',
							emoteInserter,
							this._state,
							this._favoriteEmotes
						)
					]
				)
			);
		}

		(['twitch', '7tv', 'ffz', 'bttv'] satisfies ThirdPartyEmoteProvider[]).forEach(provider => {
			const emoteSets: EmotePickerEmoteSet[] = [];

			if (channelEmotes?.has(provider)) {
				emoteSets.push(
					new EmotePickerProviderEmoteSet(
						provider,
						document.createElement('div'),
						_emitter,
						EmotePicker._logger,
						channelEmotes.get(provider)!,
						'channel',
						emoteInserter,
						this._state,
						this._favoriteEmotes
					)
				);
			}

			if (globalEmotes?.has(provider)) {
				emoteSets.push(
					new EmotePickerProviderEmoteSet(
						provider,
						document.createElement('div'),
						_emitter,
						EmotePicker._logger,
						globalEmotes.get(provider)!,
						'global',
						emoteInserter,
						this._state,
						this._favoriteEmotes
					)
				);
			}

			providerEmoteSets.push(
				new EmotePickerEmoteSets(
					document.createElement('div'),
					_emitter,
					EmotePicker._logger,
					this._state,
					provider,
					emoteSets
				)
			);
		});

		this._body = new EmotePickerBody(document.createElement('div'), providerEmoteSets);
		this._body.init();
		this.$root.append(this._body.root);

		$publisher.append(this.$root);
	}

	public get root(): HTMLDivElement {
		return this.$root;
	}

	public destroy(): void {
		this._header.destroy();
		this._search.destroy();
		this._body.destroy();
		this.$root.remove();
	}
}
