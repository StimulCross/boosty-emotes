import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { searchIconSvg } from '@shared/assets/svg';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { EMOTE_PICKER_EVENTS } from './constants';

export class EmotePickerSearch extends DomListener {
	private _prevInputValue: string = '';

	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger
	) {
		super($root, {
			emitter,
			listeners: ['input']
		});

		this.$root.classList.add('BE-emote-picker__search');
		this.$root.innerHTML = this._getTemplate();

		this.initDomListeners();
	}

	public destroy(): void {
		this.removeDomListeners();
	}

	private _onInput(evt: Event): void {
		try {
			if (
				evt.target instanceof HTMLInputElement &&
				evt.target.classList.contains('BE-emote-picker__search-input')
			) {
				const input = evt.target;
				input.value = input.value.replace(/\s+/gu, '').toLowerCase();

				if (this._prevInputValue === input.value) {
					return;
				}

				this._prevInputValue = input.value;
				this._emitter.emit(EMOTE_PICKER_EVENTS.searchInput, input.value);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(): string {
		return html`
			<div class="BE-emote-picker__search-icon">${searchIconSvg}</div>
			<input class="BE-emote-picker__search-input" type="text" />

		`;
	}
}
