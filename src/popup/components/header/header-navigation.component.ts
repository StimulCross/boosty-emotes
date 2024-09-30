import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { EVENTS } from '@popup/constants';
import { type EventEmitter } from '@shared/event-emitter';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from '../component';

export class HeaderNavigationComponent extends Component {
	private readonly _logger = createLogger(createLoggerOptions(HeaderNavigationComponent.name));

	constructor(emitter: EventEmitter) {
		super(document.createElement('div'), { emitter, listeners: ['click'] });
		this.$root.classList.add('header__navigation');
		this._updateHtml();

		this._emitter.on(EVENTS.MODAL_ADD_USER_OPEN, () => {
			this._show();
		});

		this._emitter.on(EVENTS.MODAL_ADD_USER_CLOSE, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.USER_INFO_OPEN, () => {
			this._show();
		});

		this._emitter.on(EVENTS.USER_INFO_CLOSE, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_OPEN, () => {
			this._show();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_CLOSE, () => {
			this._hide();
		});
	}

	private _show(): void {
		this.$root.classList.add('header__navigation--show');
	}

	private _hide(): void {
		this.$root.classList.remove('header__navigation--show');
	}

	private _onClick(evt: MouseEvent): void {
		if (
			evt.target instanceof Element &&
			(evt.target.classList.contains('header__back-button') ||
				evt.target.classList.contains('header__back-button-icon') ||
				evt.target.classList.contains('header__back-button-text'))
		) {
			const btn = evt.target.classList.contains('header__back-button') ? evt.target : evt.target.parentNode;

			if (!(btn instanceof HTMLButtonElement)) {
				return;
			}

			try {
				this._hide();
				this._emitter.emit(EVENTS.BACK_BUTTON_CLICK);
			} catch (e) {
				this._logger.warn(e);
			}
		}
	}

	private _updateHtml(): void {
		this.$root.innerHTML = html`
			<button class="header__back-button">
				<span class="material-symbols-rounded header__back-button-icon">arrow_back</span>
				<span class="header__back-button-text">${browser.i18n.getMessage('user_info_back_button')} </span>
			</button>
		`;
	}
}
