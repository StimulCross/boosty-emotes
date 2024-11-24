import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { boostyIconSvg, bttvIconSvg, favoriteIconSvg, ffzIconSvg, stvIconSvg, twitchIconSvg } from '@shared/assets/svg';
import { DomListener } from '@shared/dom-listener';
import type { EventEmitter } from '@shared/event-emitter';
import type { EmotePickerState } from '@shared/models';
import { Store } from '@shared/store';
import { type EmotePickerTab, type EmoteProvider } from '@shared/types';
import { EMOTE_PICKER_EVENTS } from './constants';

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

		this._onEmoteVisibilityUpdate = this._onEmoteVisibilityUpdate.bind(this);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_PICKER_EVENTS.emoteSetsVisibilityUpdate, this._onEmoteVisibilityUpdate);
	}

	public destroy(): void {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_PICKER_EVENTS.emoteSetsVisibilityUpdate, this._onEmoteVisibilityUpdate);
		this.removeDomListeners();
	}

	private _onEmoteVisibilityUpdate({ tabName, count }: { tabName: EmotePickerTab; count: number }): void {
		try {
			const tabs = this.$root.querySelectorAll('.BE-emote-picker__provider');

			const visibleTabs: HTMLElement[] = [];

			for (const tab of tabs) {
				if ((tab as HTMLElement).dataset.tab === tabName) {
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
				const _tabName = tab.dataset.tab as EmotePickerTab;
				this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, _tabName);
			} else if (!hasActiveTab) {
				tabs.forEach(tab => tab.classList.remove('BE-emote-picker__provider--active'));

				const tab = visibleTabs[0];
				tab.classList.add('BE-emote-picker__provider--active');
				const _tabName = tab.dataset.tab as EmotePickerTab;
				this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, _tabName);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (evt.target instanceof Element) {
				let currentTab: HTMLElement | null;

				if (evt.target.classList.contains('BE-emote-picker__provider')) {
					currentTab = evt.target as HTMLElement;
				} else {
					currentTab = evt.target.closest('.BE-emote-picker__provider');
				}

				if (currentTab) {
					if (currentTab.classList.contains('BE-emote-picker__provider--active')) {
						return;
					}

					const tabs = this.$root.querySelectorAll('.BE-emote-picker__provider');

					for (const tab of tabs) {
						tab.classList.remove('BE-emote-picker__provider--active');
					}

					currentTab.classList.add('BE-emote-picker__provider--active');
					const tabName = currentTab.dataset.tab as EmoteProvider | null;

					if (!tabName) {
						return;
					}

					this._state.activeTab = tabName;
					await this._writeState();

					this._emitter.emit(EMOTE_PICKER_EVENTS.tabSelect, tabName);
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(activeTab: EmotePickerTab): string {
		return html`
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--favorite ${activeTab === 'favorite'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="favorite"
			>
				<div class="BE-emote-picker__provider-icon">${favoriteIconSvg}</div>
				<div class="BE-emote-picker__provider-name">${browser.i18n.getMessage('favorite_tab_title')}</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--boosty ${activeTab === 'boosty'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="boosty"
			>
				<div class="BE-emote-picker__provider-icon">${boostyIconSvg}</div>
				<div class="BE-emote-picker__provider-name">BOOSTY</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--twitch ${activeTab === 'twitch'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="twitch"
			>
				<div class="BE-emote-picker__provider-icon">${twitchIconSvg}</div>
				<div class="BE-emote-picker__provider-name">TWITCH</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--7tv ${activeTab === '7tv'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="7tv"
			>
				<div class="BE-emote-picker__provider-icon">${stvIconSvg}</div>
				<div class="BE-emote-picker__provider-name">7TV</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--ffz ${activeTab === 'ffz'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="ffz"
			>
				<div class="BE-emote-picker__provider-icon">${ffzIconSvg}</div>
				<div class="BE-emote-picker__provider-name">FFZ</div>
			</div>
			<div
				class="BE-emote-picker__provider BE-emote-picker__provider--bttv ${activeTab === 'bttv'
					? 'BE-emote-picker__provider--active'
					: ''}"
				data-tab="bttv"
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
