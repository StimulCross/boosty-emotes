import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { BACKGROUND_EVENTS } from '@/background/constants';
import { TWITCH_CLIENT_ID } from '@shared/constants';
import { type EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import { type Message, type MessageLogin } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';

export class Authenticator {
	private readonly _logger = createLogger(createLoggerOptions(Authenticator.name));
	private _state: string | null = null;
	private _authenticationInProgress = false;

	constructor(private readonly _emitter: EventEmitter) {}

	public initListeners(): void {
		browser.runtime.onMessage.addListener(async (message: Message) => {
			if (message.type !== 'auth') {
				return;
			}

			if (this._authenticationInProgress) {
				this._logger.warn('Authentication already in progress');
				return;
			}

			try {
				this._authenticationInProgress = true;
				const responseRedirectUrl = await browser.identity.launchWebAuthFlow({
					url: this._buildAuthUrl(),
					interactive: true
				});

				if (browser.runtime.lastError) {
					this._logger.error(browser.runtime.lastError);
					throw new Error(`Authentication error: ${browser.runtime.lastError.message}`);
				}

				const params = new URLSearchParams(new URL(responseRedirectUrl).hash.slice(1));
				const state = params.get('state');

				if (this._state !== state) {
					throw new Error(`Invalid authorization state. Response url: ${responseRedirectUrl}`);
				}

				const error = params.get('error');

				if (error) {
					throw new Error(`Authorization response error. Response url: ${responseRedirectUrl}`);
				}

				const accessToken = params.get('access_token');

				if (!accessToken) {
					throw new Error(
						`Missing access token in authorization response. Response url: ${responseRedirectUrl}`
					);
				}

				await Store.setTwitchAccessToken(accessToken);

				const user = await TwitchApi.getAuthenticatedUser();

				if (!user) {
					throw new Error('Could not get authenticated user');
				}

				await Store.setIdentity(user);

				try {
					this._emitter.emit(BACKGROUND_EVENTS.LOGIN);
					await browser.runtime.sendMessage({ type: 'login', success: true });
				} catch (e) {
					if (!(e instanceof Error) || !e.message.includes('Receiving end does not exist')) {
						throw e;
					}
				}
			} catch (e) {
				await Store.setIdentity(null);
				await Store.setTwitchAccessToken(null);

				const responseMessage: MessageLogin = { type: 'login', success: false };

				if (e instanceof Error) {
					responseMessage.error = e.message;
				}

				console.log(responseMessage);

				await browser.runtime.sendMessage(responseMessage);
			} finally {
				this._state = null;
				this._authenticationInProgress = false;
			}
		});
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
