import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { EVENTS } from '@/popup/constants';
import { type EventEmitter } from '@shared/event-emitter';
import type { EmotesSet, ThirdPartyEmoteProvider } from '@shared/types';
import { Component } from '../component';

export class EmotesListSetComponent extends Component {
	private readonly _emotesList: HTMLDivElement;
	public readonly name = EmotesListSetComponent.name;
	private _visibleEmoteCount: number = 0;

	constructor(
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _provider: ThirdPartyEmoteProvider,
		private _activeProvider: ThirdPartyEmoteProvider,
		emotesSet: EmotesSet,
		private readonly _updatedAt: number
	) {
		super(document.createElement('div'), { emitter });

		this.$root.classList.add('emotes-list__emotes-set');
		this.$root.innerHTML = this._getTemplate(emotesSet);

		if (this._isActive) {
			this._show();
		}

		this._visibleEmoteCount = emotesSet.size;

		if (this._visibleEmoteCount === 0) {
			this._emitter.emit(EVENTS.EMOTES_LIST_VISIBILITY_UPDATE, { provider: this._provider, count: 0 });
			this._hide();
		}

		const emotesList = this.$root.querySelector('.emotes-list__emotes');

		if (!(emotesList instanceof HTMLDivElement)) {
			throw new Error('Emotes list element not found');
		}

		this._emotesList = emotesList;

		this._emitter.on(EVENTS.EMOTES_LIST_SEARCH_INPUT, (input: string) => {
			try {
				this._filerEmotes(input);
				this._emitter.emit(EVENTS.EMOTES_LIST_VISIBILITY_UPDATE, {
					provider: this._provider,
					count: this._visibleEmoteCount
				});
			} catch (e) {
				this._logger.error(e);
			}
		});

		this._emitter.on(EVENTS.EMOTES_LIST_TAB_SELECT, (provider: ThirdPartyEmoteProvider) => {
			this._activeProvider = provider;

			if (this._isActive) {
				this._show();
			} else {
				this._hide();
			}
		});
	}

	public async init(): Promise<void> {
		await super.init();
		await this._updateStats();
	}

	private get _isActive(): boolean {
		return this._activeProvider === this._provider;
	}

	private _show(): void {
		this.$root.classList.add('emotes-list__emotes-set--show');
	}

	private _hide(): void {
		this.$root.classList.remove('emotes-list__emotes-set--show');
	}

	private _filerEmotes(keyword: string): void {
		let visibleEmoteCount = 0;

		for (const emote of this._emotesList.children) {
			if (!(emote as HTMLImageElement).alt.toLowerCase().includes(keyword)) {
				emote.classList.add('emotes-list__emote--hide');
			} else {
				if (emote.classList.contains('emotes-list__emote--hide')) {
					emote.classList.remove('emotes-list__emote--hide');
				}

				visibleEmoteCount += 1;
			}
		}

		if (visibleEmoteCount === 0) {
			this._hide();
		} else if (this._isActive) {
			this._show();
		}

		this._visibleEmoteCount = visibleEmoteCount;
	}

	private _getTemplate(emotesSet: EmotesSet): string {
		return html`
			<div class="emotes-list__emotes-container">
				<ul class="emotes-list__emotes-stats">
					<li class="emotes-list__emotes-stats-item" data-type="total">Total: unknown</li>
					<li class="emotes-list__emotes-stats-item" data-type="updated_at">Updated at: unknown</li>
				</ul>
				<div class="emotes-list__emotes">${this._getEmotesListHtml(emotesSet)}</div>
			</div>
		`;
	}

	private async _updateStats(): Promise<void> {
		const langs = await browser.i18n.getAcceptLanguages();
		const numberFormat = new Intl.NumberFormat(langs);
		const dateTimeFormat = new Intl.DateTimeFormat(langs, { dateStyle: 'short', timeStyle: 'short' });

		const totalMessage = browser.i18n.getMessage('user_info_total_emotes');
		const updatedAtMessage = browser.i18n.getMessage('user_info_emotes_updated_at');

		const statItems = this.$root.querySelectorAll('.emotes-list__emotes-stats-item');

		for (const item of statItems) {
			if (!(item instanceof HTMLElement)) {
				continue;
			}

			switch (item.dataset.type) {
				case 'total': {
					item.textContent = `${totalMessage}: ${numberFormat.format(this._emotesList.children.length)}`;
					break;
				}

				case 'updated_at': {
					item.textContent = `${updatedAtMessage}: ${dateTimeFormat.format(new Date(this._updatedAt))}`;
					break;
				}

				default:
					break;
			}
		}
	}

	private _getEmotesListHtml(emotesSet: EmotesSet): string {
		let emotes = '';

		for (const emote of emotesSet.values()) {
			emotes += emote.toHtml(1, 'emotes-list__emote');
		}

		return emotes;
	}
}
