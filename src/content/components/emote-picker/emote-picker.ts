import { createLogger } from '@stimulcross/logger';
import { EmoteInserter, type RedactorsState } from '@content/components';
import { type EmotePickerState } from '@content/types';
import { type EventEmitter } from '@shared/event-emitter';
import { type ScopesEmotesSets, type ThirdPartyEmoteProvider } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import {
	EmotePickerBody,
	EmotePickerEmotesSet,
	EmotePickerHeader,
	EmotePickerProviderEmoteSets,
	EmotePickerSearch
} from '.';

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
		bottomOffset?: number
	) {
		this.$root.classList.add('BE-emote-picker');

		if (bottomOffset) {
			this.$root.style.bottom = `calc(100% - ${bottomOffset}px)`;
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

		const providerEmoteSets: EmotePickerProviderEmoteSets[] = [];

		const emoteInserter = new EmoteInserter(this.$publisher, this._redactorsState);

		const globalEmotes = this._emoteSets.get('global');
		const channelEmotes = this._emoteSets.get('channel');

		if (globalEmotes?.has('boosty')) {
			providerEmoteSets.push(
				new EmotePickerProviderEmoteSets(
					document.createElement('div'),
					_emitter,
					EmotePicker._logger,
					this._state,
					'boosty',
					[
						new EmotePickerEmotesSet(
							document.createElement('div'),
							_emitter,
							EmotePicker._logger,
							globalEmotes.get('boosty')!,
							'boosty',
							'global',
							emoteInserter,
							this._state
						)
					]
				)
			);
		}

		(['twitch', '7tv', 'ffz', 'bttv'] satisfies ThirdPartyEmoteProvider[]).forEach(provider => {
			const emoteSets: EmotePickerEmotesSet[] = [];

			if (channelEmotes?.has(provider)) {
				emoteSets.push(
					new EmotePickerEmotesSet(
						document.createElement('div'),
						_emitter,
						EmotePicker._logger,
						channelEmotes.get(provider)!,
						provider,
						'channel',
						emoteInserter,
						this._state
					)
				);
			}

			if (globalEmotes?.has(provider)) {
				emoteSets.push(
					new EmotePickerEmotesSet(
						document.createElement('div'),
						_emitter,
						EmotePicker._logger,
						globalEmotes.get(provider)!,
						provider,
						'global',
						emoteInserter,
						this._state
					)
				);
			}

			providerEmoteSets.push(
				new EmotePickerProviderEmoteSets(
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
