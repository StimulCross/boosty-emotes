import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { boostyIconSvg, bttvIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { DomListener } from '@shared/dom-listener';
import type { EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { type EmoteProvider } from '@shared/types';
import { EMOTE_PICKER_EVENTS } from './constants';
import type { EmotePickerState } from '../../types';

export class EmotePickerHeader extends DomListener {
	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _state: EmotePickerState
	) {
		super($root, {
			emitter,
			listeners: ['click']
		});

		this.$root.classList.add('BE-emote-picker__header');
		this.$root.innerHTML = this._getTemplate(this._state.activeTab);

		this.initDomListeners();

		this._emitter.on(
			EMOTE_PICKER_EVENTS.emoteSetVisibilityUpdate,
			({ provider, count }: { provider: EmoteProvider; count: number }) => {
				try {
					const tabs = this.$root.querySelectorAll('.BE-emote-picker__provider');

					const visibleTabs: HTMLElement[] = [];

					for (const tab of tabs) {
						if ((tab as HTMLElement).dataset.provider === provider) {
							if (count > 0) {
								tab.classList.remove('BE-emote-picker__provider--hide');
							} else {
								tab.classList.add('BE-emote-picker__provider--hide');
							}
						}

						if (!tab.classList.contains('BE-emote-picker__provider--hide')) {
							visibleTabs.push(tab as HTMLElement);
						}
					}

					let hasActiveTab = false;

					for (const visibleTab of visibleTabs) {
						if (visibleTab.classList.contains('BE-emote-picker__provider--active')) {
							hasActiveTab = true;
						}
					}

					if (visibleTabs.length === 0) {
						tabs.forEach(tab => tab.classList.remove('BE-emote-picker__provider--active'));

						const tab = tabs[0] as HTMLElement;
						tab.classList.remove('BE-emote-picker__provider--hide');
						tab.classList.add('BE-emote-picker__provider--active');
						const providerName = tab.dataset.provider as EmoteProvider;
						this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, providerName);
					} else if (!hasActiveTab) {
						tabs.forEach(tab => tab.classList.remove('BE-emote-picker__provider--active'));

						const tab = visibleTabs[0];
						tab.classList.add('BE-emote-picker__provider--active');

						const providerName = tab.dataset.provider as EmoteProvider;
						this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, providerName);
					}
				} catch (e) {
					this._logger.error(e);
				}
			}
		);
	}

	public destroy(): void {
		this.removeDomListeners();
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (evt.target instanceof Element) {
				let provider: HTMLElement | null;

				if (evt.target.classList.contains('BE-emote-picker__provider')) {
					provider = evt.target as HTMLElement;
				} else {
					provider = evt.target.closest('.BE-emote-picker__provider');
				}

				if (provider) {
					if (provider.classList.contains('BE-emote-picker__provider--active')) {
						return;
					}

					const tabs = this.$root.querySelectorAll('.BE-emote-picker__provider');

					for (const tab of tabs) {
						tab.classList.remove('BE-emote-picker__provider--active');
					}

					provider.classList.add('BE-emote-picker__provider--active');
					const providerName = provider.dataset.provider as EmoteProvider | null;

					if (!providerName) {
						return;
					}

					this._state.activeTab = providerName;
					await this._writeState();

					this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, providerName);
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(activeTab: EmoteProvider): string {
		return html`
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--boosty ${activeTab === 'boosty'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-provider="boosty"
			>
				<div class="BE-emote-picker__provider-icon">${boostyIconSvg}</div>
				<div class="BE-emote-picker__provider-name">BOOSTY</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--twitch ${activeTab === 'twitch'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-provider="twitch"
			>
				<div class="BE-emote-picker__provider-icon">${twitchIconSvg}</div>
				<div class="BE-emote-picker__provider-name">TWITCH</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--7tv ${activeTab === '7tv'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-provider="7tv"
			>
				<div class="BE-emote-picker__provider-icon">${stvIconSvg}</div>
				<div class="BE-emote-picker__provider-name">7TV</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--ffz ${activeTab === 'ffz'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-provider="ffz"
			>
				<div class="BE-emote-picker__provider-icon">${ffzIconSvg}</div>
				<div class="BE-emote-picker__provider-name">FFZ</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--bttv ${activeTab === 'bttv'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-provider="bttv"
			>
				<div class="BE-emote-picker__provider-icon">${bttvIconSvg}</div>
				<div class="BE-emote-picker__provider-name">BTTV</div>
			</div>
		`;
	}

	private async _writeState(): Promise<void> {
		await Store.setEmotePickerState(this._state);
	}
}
