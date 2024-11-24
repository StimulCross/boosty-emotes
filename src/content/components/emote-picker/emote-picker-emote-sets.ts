import { type Logger } from '@stimulcross/logger';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmotePickerState } from '@shared/models';
import { type EmotePickerTab } from '@shared/types';
import { EMOTE_PICKER_EVENTS } from './constants';
import { type EmotePickerEmoteSet } from './emote-picker-emotes-set/emote-picker-emote-set';

export class EmotePickerEmoteSets extends DomListener {
	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _state: EmotePickerState,
		private readonly _tab: EmotePickerTab,
		private readonly _emotesSets: EmotePickerEmoteSet[]
	) {
		super($root, { emitter });

		this.$root.classList.add('BE-emote-picker__emote-sets');
		this.$root.dataset.tab = this._tab;

		for (const set of _emotesSets) {
			this.$root.append(set.root);
		}

		this.initDomListeners();

		if (this._tab === this._state.activeTab) {
			if (this._emotesSets.some(set => set.visibleEmoteCount > 0)) {
				this._show();
			}
		}

		this._onSearchInput = this._onSearchInput.bind(this);
		this._onTabSelect = this._onTabSelect.bind(this);
		this._onEmoteSetVisibilityUpdate = this._onEmoteSetVisibilityUpdate.bind(this);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.searchInput, this._onSearchInput);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.tabSelect, this._onTabSelect);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.emoteSetVisibilityUpdate, this._onEmoteSetVisibilityUpdate);
	}

	public init(): void {
		this._emitVisibleEmoteCount();
	}

	public destroy(): void {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.searchInput, this._onSearchInput);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.tabSelect, this._onTabSelect);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.emoteSetVisibilityUpdate, this._onEmoteSetVisibilityUpdate);
		this.removeDomListeners();
		this._emotesSets.forEach(set => set.destroy());
	}

	private _show(): void {
		this.$root.classList.add('BE-emote-picker__emote-sets--show');
	}

	private _hide(): void {
		this.$root.classList.remove('BE-emote-picker__emote-sets--show');
	}

	private _emitVisibleEmoteCount(): void {
		const count = this._emotesSets.reduce((acc, cur) => {
			acc += cur.visibleEmoteCount;
			return acc;
		}, 0);

		this._emitter.emit(EMOTE_PICKER_EVENTS.emoteSetsVisibilityUpdate, {
			tabName: this._tab,
			count
		});
	}

	private _onSearchInput(input: string): void {
		try {
			for (const set of this._emotesSets) {
				set.filerEmotes(input);
			}
			this._emitVisibleEmoteCount();
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onTabSelect(tab: EmotePickerTab): void {
		try {
			if (this._tab === tab) {
				this._show();
			} else {
				this._hide();
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onEmoteSetVisibilityUpdate({ tab }: { tab: EmotePickerTab }): void {
		try {
			if (this._tab === tab) {
				this._emitVisibleEmoteCount();
			}
		} catch (e) {
			this._logger.error(e);
		}
	}
}
