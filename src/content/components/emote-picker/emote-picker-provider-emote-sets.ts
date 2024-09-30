import { type Logger } from '@stimulcross/logger';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmoteProvider } from '@shared/types';
import { EMOTE_PICKER_EVENTS } from './constants';
import { type EmotePickerEmotesSet } from './emote-picker-emotes-set';
import { type EmotePickerState } from '../../types';

export class EmotePickerProviderEmoteSets extends DomListener {
	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _state: EmotePickerState,
		private readonly _provider: EmoteProvider,
		private readonly _emotesSets: EmotePickerEmotesSet[]
	) {
		super($root, { emitter });

		this.$root.classList.add('BE-emote-picker__emote-sets');
		this.$root.dataset.provider = this._provider;

		for (const set of _emotesSets) {
			this.$root.append(set.root);
		}

		this.initDomListeners();
		this._emitVisibleEmoteCount();

		if (this._provider === this._state.activeTab) {
			this._show();
		}

		this._emitter.on(EMOTE_PICKER_EVENTS.searchInput, (input: string) => {
			try {
				for (const set of this._emotesSets) {
					set.filerEmotes(input);
				}
				this._emitVisibleEmoteCount();
			} catch (e) {
				this._logger.error(e);
			}
		});

		this._emitter.on(EMOTE_PICKER_EVENTS.tabSelect, (provider: EmoteProvider) => {
			try {
				if (this._provider === provider) {
					this._show();
				} else {
					this._hide();
				}
			} catch (e) {
				this._logger.error(e);
			}
		});
	}

	public destroy(): void {
		this.removeDomListeners();
		this._emotesSets.forEach(set => set.destroy());
	}

	private _emitVisibleEmoteCount(): void {
		const count = this._emotesSets.reduce((acc, cur) => {
			acc += cur.visibleEmoteCount;
			return acc;
		}, 0);

		this._emitter.emit(EMOTE_PICKER_EVENTS.emoteSetVisibilityUpdate, {
			provider: this._provider,
			count
		});
	}

	private _show(): void {
		this.$root.classList.add('BE-emote-picker__emote-sets--show');
	}

	private _hide(): void {
		this.$root.classList.remove('BE-emote-picker__emote-sets--show');
	}
}
