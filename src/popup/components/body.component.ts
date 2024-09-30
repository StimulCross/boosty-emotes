import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { boostyIconSvg, twitchIconSvg } from '@shared/assets/svg';
import type { EventEmitter } from '@shared/event-emitter';
import { type User } from '@shared/models';
import { Store } from '@shared/store';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from './component';
import { EVENTS } from '../constants';

export class BodyComponent extends Component {
	public static readonly className = 'body';
	public readonly name = BodyComponent.name;
	private readonly _logger = createLogger(createLoggerOptions(BodyComponent.name));
	private _users: User[] = [];

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { listeners: ['click'], emitter });

		this._emitter.on(EVENTS.MODAL_ADD_USER_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.MODAL_ADD_USER_CLOSE, async () => {
			await this._updateUsers();
			this._show();
		});

		this._emitter.on(EVENTS.USER_INFO_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.USER_INFO_CLOSE, async () => {
			await this._updateUsers();
			this._show();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_OPEN, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.GLOBAL_EMOTES_CLOSE, async () => {
			await this._updateUsers();
			this._show();
		});

		this._emitter.on(EVENTS.LOGIN, async () => {
			await this._updateUsers();
			this._show();
		});

		this._emitter.on(EVENTS.LOGOUT, () => {
			this._updateHtml([]);
			this._hide();
		});

		this._emitter.on(EVENTS.BACK_BUTTON_CLICK, async () => {
			await this._updateUsers();
			this._show();
		});
	}

	public override async init(): Promise<void> {
		const identity = await Store.getIdentity();

		if (identity) {
			await this._updateUsers();
			this._show();
		} else {
			this._hide();
		}
	}

	private async _updateUsers(): Promise<void> {
		this._users = await Store.getUsers();
		this._updateHtml(this._users);
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		if (!(evt.target instanceof Element)) {
			return;
		}

		if (evt.target.classList.contains('body__add-user-button')) {
			this._hide();
			this._emitter.emit(EVENTS.MODAL_ADD_USER_OPEN);
		} else if (
			evt.target.classList.contains('body__cross-button') ||
			evt.target.classList.contains('body__icon-cross')
		) {
			const btn = evt.target.classList.contains('body__cross-button') ? evt.target : evt.target.parentNode;
			const usernames = evt.target.classList.contains('body__cross-button')
				? evt.target.previousElementSibling
				: evt.target.parentElement?.previousElementSibling;

			if (!usernames || !(usernames instanceof HTMLElement) || !btn || !(btn instanceof HTMLButtonElement)) {
				return;
			}

			btn.disabled = true;

			const boostyUsername = usernames.dataset.boostyUsername;

			if (!boostyUsername) {
				return;
			}

			try {
				await Store.removeUser(boostyUsername);
				const userCard = usernames.closest('.body__user-card');
				userCard?.remove();
			} catch (e) {
				this._logger.warn('Could not delete user', e);
			} finally {
				btn.disabled = false;
			}
		} else {
			const userCard = evt.target.closest('.body__user-card');

			if (!userCard) {
				return;
			}

			const usernames = userCard.querySelector('.body__usernames-container');

			if (!(usernames instanceof HTMLElement)) {
				return;
			}

			const boostyUsername = usernames.dataset.boostyUsername;
			const twitchUserId = usernames.dataset.twitchUserId;

			if (!boostyUsername || !twitchUserId) {
				return;
			}

			this._emitter.emit(EVENTS.USER_INFO_OPEN, { userId: twitchUserId });
			this._hide();
		}
	}

	private _updateHtml(users: User[]): void {
		this.$root.innerHTML = html`
			<div class="button button--medium button--primary body__add-user-button">
				${browser.i18n.getMessage('body_add_user')}
			</div>
			<ul class="body__users-list">
				${users
					// TODO: Handle inactive users
					.map(
						({ boostyUsername, twitchProfile }) => html`
							<li
								class="body__user-card"
								style="
									background-image: 
										linear-gradient(to right, rgba(255,255,255,0.9), rgba(229,207,255,0.65)),
										url('${twitchProfile.banner}'); 
								"
							>
								<div class="body__avatar">
									<img src="${twitchProfile.avatar}" alt="" />
								</div>
								<div
									class="body__usernames-container"
									data-boosty-username="${boostyUsername}"
									data-twitch-user-id="${twitchProfile.id}"
								>
									<div class="body__username-container">
										<span class="body__platform-icon body__platform-icon--twitch"
											>${twitchIconSvg}</span
										>
										<span class="body__username" title="${twitchProfile.displayName}"
											>${twitchProfile.displayName}</span
										>
									</div>
									<div class="body__username-container">
										<span class="body__platform-icon">${boostyIconSvg}</span>
										<span class="body__username" title="${boostyUsername}">${boostyUsername}</span>
									</div>
								</div>
								<button type="button" class="body__cross-button">
									<span class="body__icon-cross"></span>
								</button>
							</li>`
					)
					.join('\n')}
			</ul>
		`;
	}

	private _show(): void {
		this.$root.classList.add('body--show');
	}

	private _hide(): void {
		this.$root.classList.remove('body--show');
	}
}
