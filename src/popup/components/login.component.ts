import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import type { EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { type MessageAuth } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from './component';
import { EVENTS } from '../constants';

export class LoginComponent extends Component {
	public static readonly className = 'login';
	public readonly name = LoginComponent.name;
	private readonly _logger = createLogger(createLoggerOptions(LoginComponent.name));

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { listeners: ['click'], emitter });
		this._updateHtml();
	}

	public override async init(): Promise<void> {
		this._emitter.on(EVENTS.LOGIN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.LOGOUT, () => {
			this._show();
		});

		const identity = await Store.getIdentity();

		if (identity) {
			this._hide();
		} else {
			this._show();
		}
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		if (!(evt.target instanceof HTMLButtonElement) || evt.target.dataset.type !== 'login') {
			return;
		}

		try {
			await browser.runtime.sendMessage({
				type: 'auth'
			} satisfies MessageAuth);
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _updateHtml(): void {
		this.$root.innerHTML = html`
			<button
				class="button button--primary button--large"
				type="button"
				data-type="login"
			>
				${browser.i18n.getMessage('login_button')}
			</button>
		`;
	}

	private _show(): void {
		this.$root.classList.add('login--show');
	}

	private _hide(): void {
		this.$root.classList.remove('login--show');
	}
}
