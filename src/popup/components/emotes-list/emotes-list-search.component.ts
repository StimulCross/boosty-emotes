import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { EVENTS } from '@/popup/constants';
import { searchIconSvg } from '@shared/assets/svg';
import { type EventEmitter } from '@shared/event-emitter';
import { Component } from '../component';

export class EmotesListSearchComponent extends Component {
	public readonly name = EmotesListSearchComponent.name;
	private _prevInputValue: string = '';

	constructor(
		emitter: EventEmitter,
		private readonly _logger: Logger
	) {
		super(document.createElement('div'), { emitter, listeners: ['input'] });

		this.$root.classList.add('emotes-list__search');
		this.$root.innerHTML = this._getTemplate();
	}

	private _onInput(evt: Event): void {
		try {
			if (evt.target instanceof HTMLInputElement && evt.target.classList.contains('emotes-list__search-input')) {
				const input = evt.target;
				input.value = input.value.replace(/\s+/gu, '').toLowerCase();

				if (this._prevInputValue === input.value) {
					return;
				}

				this._prevInputValue = input.value;
				this._emitter.emit(EVENTS.EMOTES_LIST_SEARCH_INPUT, input.value);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(): string {
		return html`
			<div class="emotes-list__search-icon">${searchIconSvg}</div>
			<input class="emotes-list__search-input" type="text" />
		`;
	}
}
