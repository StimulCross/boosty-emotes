import { createLogger } from '@stimulcross/logger';
import browser from 'webextension-polyfill';
import { boostyIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { BOOSTY_USERNAME_REGEX } from '@shared/constants';
import { BoostyUserAlreadyExistsError } from '@shared/errors';
import { TwitchUserAlreadyExistsError } from '@shared/errors/twitch-user-already-exists.error';
import type { EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { TwitchApi } from '@shared/twitch-api';
import { type MessageAddUser } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { Component } from './component';
import { EVENTS } from '../constants';

export class AddUserModalComponent extends Component {
	public static readonly className = 'add-user-modal';
	public readonly name = AddUserModalComponent.name;
	private readonly _logger = createLogger(createLoggerOptions(AddUserModalComponent.name));

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { listeners: ['click'], emitter });

		$root.classList.add('popup');

		this._update();
		this._emitter.on(EVENTS.LOGOUT, () => {
			this._hide();
		});

		this._emitter.on(EVENTS.MODAL_ADD_USER_OPEN, async () => {
			const tabs = await browser.tabs.query({ active: true, currentWindow: true });

			// TODO: Detect Twitch username on page if any

			if (tabs.length > 0) {
				const tab = tabs[0];

				if (tab.url) {
					const matches = BOOSTY_USERNAME_REGEX.exec(tab.url);

					if (matches?.groups?.username) {
						const boostyInput = this.$root.querySelector(
							'.add-user-modal__username-input[data-platform="boosty"]'
						);

						if (boostyInput && boostyInput instanceof HTMLInputElement) {
							boostyInput.value = matches.groups.username;
						}
					}
				}
			}

			this._show();
		});

		this._emitter.on(EVENTS.BACK_BUTTON_CLICK, () => {
			this._hide();
		});
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		if (!(evt.target instanceof HTMLElement)) {
			return;
		}

		if (
			evt.target.classList.contains('add-user-modal__close') ||
			evt.target.classList.contains('add-user-modal__cancel-button')
		) {
			evt.preventDefault();
			this._hide();
			this._emitter.emit(EVENTS.MODAL_ADD_USER_CLOSE);
		} else if (evt.target.classList.contains('add-user-modal__add-button')) {
			evt.preventDefault();

			const errorMessage = this.$root.querySelector('.add-user-modal__error-message');
			const boostyInput = this.$root.querySelector('[data-platform=boosty]');
			const twitchInput = this.$root.querySelector('[data-platform=twitch]');

			if (
				!errorMessage ||
				!boostyInput ||
				!twitchInput ||
				!(boostyInput instanceof HTMLInputElement) ||
				!(twitchInput instanceof HTMLInputElement)
			) {
				return;
			}

			if (!boostyInput.value || !twitchInput.value) {
				errorMessage.textContent = browser.i18n.getMessage('add_user_empty_inputs_error');
				return;
			}

			if (!(await Store.getTwitchAccessToken())) {
				return;
			}

			try {
				const twitchUser = await TwitchApi.getUserByName(twitchInput.value.toLowerCase());

				if (!twitchUser) {
					errorMessage.textContent = browser.i18n.getMessage('add_user_user_does_not_exist', [
						twitchInput.value
					]);
					return;
				}

				await Store.addUser({
					boostyUsername: boostyInput.value,
					twitchProfile: twitchUser,
					state: {
						active: true,
						updatedAt: 0,
						twitchEmotesUpdatedAt: 0,
						sevenTvEmotesUpdatedAt: 0,
						ffzEmotesUpdatedAt: 0,
						bttvEmotesUpdatedAt: 0
					}
				});

				this._hide();
				this._emitter.emit(EVENTS.MODAL_ADD_USER_CLOSE);
				await browser.runtime.sendMessage({
					type: 'add_user',
					data: { userId: twitchUser.id }
				} satisfies MessageAddUser);
			} catch (e) {
				if (e instanceof BoostyUserAlreadyExistsError) {
					errorMessage.textContent = browser.i18n.getMessage('add_user_boosty_user_already_exists', [
						e.boostyUsername,
						e.twitchUsername
					]);
				} else if (e instanceof TwitchUserAlreadyExistsError) {
					errorMessage.textContent = browser.i18n.getMessage('add_user_twitch_user_already_exists', [
						e.boostyUsername,
						e.twitchUsername
					]);
				} else {
					errorMessage.textContent = browser.i18n.getMessage('add_user_unknown_error');
					this._logger.error(e);
				}
			}
		}
	}

	private _update(): void {
		this.$root.innerHTML = `<div class="add-user-modal__error-message-container">
				<spam class="add-user-modal__error-message"></spam>
			</div>
			<div class="add-user-modal__body">
				<form action="" method="post">
					<div class="add-user-modal__platform">
					    <span class="add-user-modal__input-platform-icon">${twitchIconSvg}</span>
						<input
							id="twitch-input"
							placeholder="${browser.i18n.getMessage('add_user_twitch_input_placeholder')}"
							class="add-user-modal__username-input"
							type="text"
							name="Twitch Username"
							data-platform="twitch"
						/>
					</div>
					<div class="add-user-modal__platform">
					    <span class="add-user-modal__input-platform-icon">${boostyIconSvg}</span>
						<input
							id="boosty-input"
							placeholder="${browser.i18n.getMessage('add_user_boosty_input_placeholder')}"
							class="add-user-modal__username-input"
							type="text"
							name="Boosty Username"
							data-platform="boosty"
						/>
					</div>
					<div class="add-user-modal__input-buttons">
						<button class=" button button--small button--primary add-user-modal__add-button add-user-modal__input-button">${browser.i18n.getMessage('add_user_add_button')}</button>
						<button class="button button--small button--secondary add-user-modal__cancel-button add-user-modal__input-button">${browser.i18n.getMessage('add_user_cancel_button')}</button>
					</div>
				</form>
			</div>`;
	}

	private _reset(): void {
		const inputs = this.$root.querySelectorAll('input');
		inputs.forEach(input => (input.value = ''));

		const error = this.$root.querySelector('.add-user-modal__error-message');

		if (error) {
			error.textContent = '';
		}
	}

	private _show(): void {
		this.$root.classList.add('popup--show');
	}

	private _hide(): void {
		this.$root.classList.remove('popup--show');
		this._reset();
	}
}
