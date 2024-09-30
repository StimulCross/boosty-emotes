import { html } from 'code-tag';
import { Component } from '@popup/components/component';
import { createUserEmotesListComponent } from '@popup/components/emotes-list/create-user-emotes-list';
import { type EmotesListComponent } from '@popup/components/emotes-list/emotes-list.component';
import { EVENTS } from '@popup/constants';
import { boostyIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { EmoteTooltip } from '@shared/components/emote-tooltip';
import { type EventEmitter } from '@shared/event-emitter';
import { type User } from '@shared/models';
import { Store } from '@shared/store';

export class UserInfoComponent extends Component {
	public static readonly className = 'user-info';
	public readonly name = UserInfoComponent.name;
	private _currentUser: User | null = null;
	private readonly _tooltip: EmoteTooltip | null = null;
	private _emotesList: EmotesListComponent | null = null;

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { emitter });

		this._tooltip = new EmoteTooltip(this.$root);

		this._emitter.on(EVENTS.USER_INFO_OPEN, async ({ userId }) => {
			this._currentUser = await Store.getUser(userId);

			if (this._currentUser) {
				this._initHtml(this._currentUser);
				const emotesByProvider = await Store.getChannelEmotesByProvider(userId);
				const body = this.$root.querySelector('.user-info__body');
				this._emotesList = createUserEmotesListComponent(this._currentUser, emotesByProvider);
				await this._emotesList.init();
				body!.append(this._emotesList.root);
			} else {
				this._initHtml(null);
			}

			this._show();
		});

		this._emitter.on(EVENTS.LOGOUT, async () => {
			await this._hide();
		});

		this._emitter.on(EVENTS.BACK_BUTTON_CLICK, async () => {
			await this._hide();
		});
	}

	public override async destroy(): Promise<void> {
		await super.destroy();
		await this._emotesList?.destroy();
		this._emotesList = null;
		this._tooltip?.destroy();
	}

	private _initHtml(user: User | null): void {
		this.$root.innerHTML = user
			? html`
				<div class="user-info__body">
						<div
							class="user-info__profile"
							style="
								background-image: 
									linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(239,222,255,0.7)),
									url('${user.twitchProfile.banner}'); 
							"
						>
							<div class="user-info__avatar">
								<img src="${user.twitchProfile.avatar}" alt="" />
							</div>
							<div class="user-info__usernames-container">
								<div class="user-info__username-container">
									<span class="user-info__platform-icon">${twitchIconSvg}</span>
									<a
										href="https://twitch.tv/${user.twitchProfile.name}"
										class="user-info__username"
										target="_blank"
										title="${user.twitchProfile.displayName}"
										>${user.twitchProfile.displayName}</a
									>
								</div>
								<div class="user-info__username-container">
									<span class="user-info__platform-icon">${boostyIconSvg}</span>
									<a
										href="https://boosty.to/${user.boostyUsername}"
										class="user-info__username"
										target="_blank"
										title="${user.boostyUsername}"
										>${user.boostyUsername}</a
									>
								</div>
							</div>
						</div>
					</div>
			`
			: html``;
	}

	private async _reset(): Promise<void> {
		this._currentUser = null;
		await this._emotesList?.destroy();
		this._emotesList = null;
	}

	private _show(): void {
		this.$root.classList.add('user-info--show');
	}

	private async _hide(): Promise<void> {
		this.$root.classList.remove('user-info--show');
		await this._reset();
	}
}
