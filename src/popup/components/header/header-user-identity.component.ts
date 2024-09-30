import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { EVENTS } from '@popup/constants';
import { type EventEmitter } from '@shared/event-emitter';
import type { UserIdentity } from '@shared/models';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from '../component';

export class HeaderUserIdentityComponent extends Component {
	private readonly _logger = createLogger(createLoggerOptions(HeaderUserIdentityComponent.name));
	private _identity: UserIdentity | null = null;

	constructor(emitter: EventEmitter) {
		super(document.createElement('div'), { emitter, listeners: ['click'] });
		this.$root.classList.add('header__user-identity');

		this._emitter.on(EVENTS.LOGIN, (identity: UserIdentity) => {
			this._handleIdentityUpdate(identity);
		});

		this._emitter.on(EVENTS.LOGOUT, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.MODAL_ADD_USER_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.MODAL_ADD_USER_CLOSE, () => {
			this._show();
		});

		this._emitter.on(EVENTS.USER_INFO_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.USER_INFO_CLOSE, () => {
			this._show();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_CLOSE, () => {
			this._show();
		});

		this._emitter.on(EVENTS.BACK_BUTTON_CLICK, () => {
			this._show();
		});
	}

	public setIdentity(identity: UserIdentity): void {
		this._handleIdentityUpdate(identity);
	}

	public override async init(): Promise<void> {
		await super.init();

		window.addEventListener('click', (evt: MouseEvent) => {
			if (!(evt.target instanceof Element)) {
				return;
			}

			if (
				evt.target.classList.contains('header__menu') ||
				evt.target.classList.contains('header__menu-button') ||
				evt.target.classList.contains('header__menu-icon')
			) {
				return;
			}

			const menu = this.$root.querySelector('.header__menu');

			if (!menu) {
				return;
			}

			menu.classList.remove('header__menu--show');
		});
	}

	private _handleIdentityUpdate(identity: UserIdentity): void {
		this._identity = identity;
		this._updateHtml(this._identity.displayName, this._identity.avatar);
		this._show();
	}

	private _show(): void {
		this.$root.classList.add('header__user-identity--show');
	}

	private _hide(): void {
		this._identity = null;
		this.$root.classList.remove('header__user-identity--show');
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		if (!(evt.target instanceof HTMLElement)) {
			return;
		}

		if (
			evt.target.classList.contains('header__menu-button') ||
			evt.target.classList.contains('header__menu-icon')
		) {
			this._toggleMenu();
		} else if (evt.target.classList.contains('header__menu-list-item')) {
			const action = evt.target.dataset.action;

			switch (action) {
				case 'logout': {
					await this._handleLogOut();
					break;
				}

				case 'global_emotes': {
					this._emitter.emit(EVENTS.GLOBAL_EMOTES_OPEN);
					break;
				}

				default:
					break;
			}
		}
	}

	private _updateHtml(username: string, avatar: string): void {
		this.$root.innerHTML = html`
			<div class="header__identity">
				<img class="header__avatar" src="${avatar}" title="Avatar" alt="Avatar" />
				<span class="header__username">${username}</span>
			</div>
			<button class="header__menu-button">
				<span class="header__menu-icon material-symbols-rounded">more_vert</span>
			</button>
			<div class="header__menu">
				<ul class="header__menu-list">
					<li class="header__menu-list-item" data-action="global_emotes">
						${browser.i18n.getMessage('header_global_emotes')}
					</li>
					<li class="header__menu-list-item header__menu-list-item--crit" data-action="logout">
						${browser.i18n.getMessage('header_logout')}
					</li>
				</ul>
			</div>
		`;
	}

	private _toggleMenu(): void {
		const menu = this.$root.querySelector('.header__menu');

		if (!menu || !(menu instanceof HTMLElement)) {
			return;
		}

		menu.classList.toggle('header__menu--show');
	}

	private async _handleLogOut(): Promise<void> {
		const menuBtn = this.$root.querySelector('.header__menu-button');

		if (!menuBtn || !(menuBtn instanceof HTMLButtonElement)) {
			return;
		}

		try {
			menuBtn.disabled = true;
			await TwitchApi.revokeAccessToken();
			await browser.runtime.sendMessage({ type: 'logout' });
			await Store.clear();
		} catch (e) {
			this._logger.error(e);
		} finally {
			await Store.setIdentity(null);
			await Store.setTwitchAccessToken(null);
			this._emitter.emit(EVENTS.LOGOUT);
			menuBtn.disabled = false;
		}
	}
}
