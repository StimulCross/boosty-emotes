import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { bttvIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { type EventEmitter } from '@shared/event-emitter';
import type { EmoteProvider, ThirdPartyEmoteProvider } from '@shared/types';
import { EVENTS } from '../../constants';
import { Component } from '../component';

export class EmotesListProvidersComponent extends Component {
	public readonly name = EmotesListProvidersComponent.name;

	constructor(
		emitter: EventEmitter,
		private readonly _logger: Logger,
		activeProvider: ThirdPartyEmoteProvider
	) {
		super(document.createElement('ul'), { emitter, listeners: ['click'] });

		this.$root.classList.add('emotes-list__providers');
		this.$root.innerHTML = this._getTemplate(activeProvider);

		this._emitter.on(
			EVENTS.EMOTES_LIST_VISIBILITY_UPDATE,
			({ provider, count }: { provider: EmoteProvider; count: number }) => {
				try {
					const tabs = this.$root.querySelectorAll('.emotes-list__provider');

					const visibleTabs: HTMLElement[] = [];

					for (const tab of tabs) {
						if ((tab as HTMLElement).dataset.provider === provider) {
							if (count > 0) {
								tab.classList.remove('emotes-list__provider--hide');
							} else {
								tab.classList.add('emotes-list__provider--hide');
							}
						}

						if (!tab.classList.contains('emotes-list__provider--hide')) {
							visibleTabs.push(tab as HTMLElement);
						}
					}

					let hasActiveTab = false;

					for (const visibleTab of visibleTabs) {
						if (visibleTab.classList.contains('emotes-list__provider--active')) {
							hasActiveTab = true;
						}
					}

					if (visibleTabs.length === 0) {
						tabs.forEach(tab => tab.classList.remove('emotes-list__provider--active'));

						const tab = tabs[0] as HTMLElement;
						tab.classList.remove('emotes-list__provider--hide');
						tab.classList.add('emotes-list__provider--active');
						const providerName = tab.dataset.provider as EmoteProvider;
						this._emitter.emit(EVENTS.EMOTES_LIST_TAB_SELECT, providerName);
					} else if (!hasActiveTab) {
						tabs.forEach(tab => tab.classList.remove('emotes-list__provider--active'));

						const tab = visibleTabs[0];
						tab.classList.add('emotes-list__provider--active');

						const providerName = tab.dataset.provider as EmoteProvider;
						this._emitter.emit(EVENTS.EMOTES_LIST_TAB_SELECT, providerName);
					}
				} catch (e) {
					this._logger.error(e);
				}
			}
		);
	}

	private _onClick(evt: MouseEvent): void {
		try {
			if (evt.target instanceof Element) {
				let provider: HTMLElement | null;

				if (evt.target.classList.contains('emotes-list__provider')) {
					provider = evt.target as HTMLElement;
				} else {
					provider = evt.target.closest('.emotes-list__provider');
				}

				if (provider) {
					if (provider.classList.contains('emotes-list__provider--active')) {
						return;
					}

					const tabs = this.$root.querySelectorAll('.emotes-list__provider');

					for (const tab of tabs) {
						tab.classList.remove('emotes-list__provider--active');
					}

					provider.classList.add('emotes-list__provider--active');
					const providerName = provider.dataset.provider as EmoteProvider | null;

					if (!providerName) {
						return;
					}

					this._emitter.emit(EVENTS.EMOTES_LIST_TAB_SELECT, providerName);
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(activeProvider: ThirdPartyEmoteProvider): string {
		return html`
			<li
				class="emotes-list__provider emotes-list__provider--twitch${activeProvider === 'twitch'
					? ' emotes-list__provider--active'
					: ''}"
				data-provider="twitch"
			>
				<div class="emotes-list__provider-icon">${twitchIconSvg}</div>
				<div class="emotes-list__provider-name">TWITCH</div>
			</li>
			<li
				class="emotes-list__provider emotes-list__provider--7tv${activeProvider === '7tv'
					? ' emotes-list__provider--active'
					: ''}"
				data-provider="7tv"
			>
				<div class="emotes-list__provider-icon">${stvIconSvg}</div>
				<div class="emotes-list__provider-name">7TV</div>
			</li>
			<li
				class="emotes-list__provider emotes-list__provider--ffz${activeProvider === 'ffz'
					? ' emotes-list__provider--active'
					: ''}"
				data-provider="ffz"
			>
				<div class="emotes-list__provider-icon">${ffzIconSvg}</div>
				<div class="emotes-list__provider-name">FFZ</div>
			</li>
			<li
				class="emotes-list__provider emotes-list__provider--bttv${activeProvider === 'bttv'
					? ' emotes-list__provider--active'
					: ''}"
				data-provider="bttv"
			>
				<div class="emotes-list__provider-icon">${bttvIconSvg}</div>
				<div class="emotes-list__provider-name">BTTV</div>
			</li>
		`;
	}
}
