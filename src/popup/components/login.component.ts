import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { TWITCH_CLIENT_ID } from '@shared/constants';
import type { EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from './component';
import { EVENTS } from '../constants';

export class LoginComponent extends Component {
	public static readonly className = 'login';
	public readonly name = LoginComponent.name;
	private readonly _logger = createLogger(createLoggerOptions(LoginComponent.name));
	private _state: string | null = null;

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
			evt.target.disabled = true;

			const responseRedirectUrl = await browser.identity.launchWebAuthFlow({
				url: this._buildAuthUrl(),
				interactive: true
			});

			if (browser.runtime.lastError) {
				this._logger.warn('Authentication error:', browser.runtime.lastError);
				return;
			}

			const params = new URLSearchParams(new URL(responseRedirectUrl).hash.slice(1));
			const state = params.get('state');

			if (this._state !== state) {
				this._logger.warn('Invalid authorization state:', params);
				return;
			}

			const error = params.get('error');

			if (error) {
				this._logger.warn(`Authorization response error: ${error}. ${params.get('error_description')}`);
				return;
			}

			const accessToken = params.get('access_token');

			if (!accessToken) {
				this._logger.warn('Missing access token in authorization response', responseRedirectUrl);
			}

			await Store.setTwitchAccessToken(accessToken);

			const user = await TwitchApi.getAuthenticatedUser();

			if (!user) {
				this._logger.warn('Could not get authenticated user');
				return;
			}

			await Store.setIdentity(user);
			this._emitter.emit(EVENTS.LOGIN, user);
			await browser.runtime.sendMessage({ type: 'login' });
		} catch (e) {
			await Store.setIdentity(null);
			await Store.setTwitchAccessToken(null);
			this._logger.error('Authorization request error:', e);
		} finally {
			this._state = null;
			evt.target.disabled = false;
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

	private _buildAuthUrl(): string {
		this._state = this._generateState();

		const url = new URL('https://id.twitch.tv/oauth2/authorize');
		url.searchParams.set('client_id', TWITCH_CLIENT_ID);
		url.searchParams.set('response_type', 'token');
		url.searchParams.set('redirect_uri', browser.identity.getRedirectURL());
		url.searchParams.set('scope', '');
		url.searchParams.set('state', this._state);

		return url.toString();
	}

	private _generateState(): string {
		return [...Array<undefined>(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
	}
}
