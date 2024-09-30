import { createLogger } from '@stimulcross/logger';
import { EmoteInserter, type RedactorsState } from '@content/components';
import { type EmotePickerState } from '@content/types';
import { type EventEmitter } from '@shared/event-emitter';
import { type Emote } from '@shared/models';
import { type EmoteProvider, type ThirdPartyEmoteProvider } from '@shared/types';
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
		private readonly _globalEmotesByProvider: Map<EmoteProvider, Map<string, Emote>>,
		private readonly _channelEmotesByProvider: Map<EmoteProvider, Map<string, Emote>>,
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
						this._globalEmotesByProvider.get('boosty')!,
						'Boosty Emotes',
						'boosty',
						'global',
						emoteInserter,
						this._state,
						this._globalEmotesByProvider
					)
				]
			)
		);

		(['twitch', '7tv', 'ffz', 'bttv'] satisfies ThirdPartyEmoteProvider[]).forEach(provider => {
			providerEmoteSets.push(
				new EmotePickerProviderEmoteSets(
					document.createElement('div'),
					_emitter,
					EmotePicker._logger,
					this._state,
					provider,
					[
						new EmotePickerEmotesSet(
							document.createElement('div'),
							_emitter,
							EmotePicker._logger,
							this._channelEmotesByProvider.get(provider)!,
							`${provider} channel emotes`,
							provider,
							'channel',
							emoteInserter,
							this._state,
							this._globalEmotesByProvider
						),
						new EmotePickerEmotesSet(
							document.createElement('div'),
							_emitter,
							EmotePicker._logger,
							this._globalEmotesByProvider.get(provider)!,
							`${provider} global emotes`,
							provider,
							'global',
							emoteInserter,
							this._state,
							this._globalEmotesByProvider
						)
					]
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
