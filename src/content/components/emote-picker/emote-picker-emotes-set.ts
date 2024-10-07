import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { type EmotePickerState } from '@content/types';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { type EmoteProvider, type EmoteScope, type EmotesSet } from '@shared/types';
import { type EmoteInserter } from '../emote-inserter';

export class EmotePickerEmotesSet extends DomListener {
	private readonly _emotesList: HTMLDivElement;
	private _visibleEmoteCount: number = 0;

	constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		private readonly _logger: Logger,
		private readonly _emotesSet: EmotesSet,
		private readonly _provider: EmoteProvider,
		private readonly _scope: EmoteScope,
		private readonly _emoteInserter: EmoteInserter,
		private readonly _state: EmotePickerState
	) {
		super($root, { emitter, listeners: ['click'] });

		this.$root.classList.add('BE-emote-picker__emotes-set');
		this.$root.innerHTML = this._getTemplate(this._emotesSet);

		this._visibleEmoteCount = this._emotesSet.size;

		if (this._visibleEmoteCount > 0) {
			this.$root.classList.add('BE-emote-picker__emotes-set--show');
		}

		const emotesList = this.$root.querySelector('.BE-emote-picker__emotes-list');

		if (!(emotesList instanceof HTMLDivElement)) {
			throw new Error('Emotes list element not found');
		}

		this._emotesList = emotesList;
		this.initDomListeners();
	}

	public get visibleEmoteCount(): number {
		return this._visibleEmoteCount;
	}

	public destroy(): void {
		this.removeDomListeners();
	}

	public filerEmotes(keyword: string): void {
		let visibleEmoteCount = 0;

		for (const emote of this._emotesList.children) {
			if (!(emote as HTMLImageElement).alt.toLowerCase().includes(keyword)) {
				emote.classList.add('BE-emote-picker__emote--hide');
			} else {
				if (emote.classList.contains('BE-emote-picker__emote--hide')) {
					emote.classList.remove('BE-emote-picker__emote--hide');
				}

				visibleEmoteCount += 1;
			}
		}

		if (visibleEmoteCount === 0) {
			this._hide();
		} else {
			this._show();
		}

		this._visibleEmoteCount = visibleEmoteCount;
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (
				evt.target instanceof HTMLButtonElement &&
				evt.target.classList.contains('BE-emote-picker__emotes-set-container')
			) {
				const collapsed = evt.target.classList.contains('BE-emote-picker__emotes-set-container--collapsed');

				if (collapsed) {
					this._emotesList.classList.remove('BE-emote-picker__emotes-list--hide');
					evt.target.classList.remove('BE-emote-picker__emotes-set-container--collapsed');
					this._state.sets[this._provider].collapsed[this._scope] = false;
				} else {
					this._emotesList.classList.add('BE-emote-picker__emotes-list--hide');
					evt.target.classList.add('BE-emote-picker__emotes-set-container--collapsed');
					this._state.sets[this._provider].collapsed[this._scope] = true;
				}

				await this._writeState();
			} else if (
				evt.target instanceof HTMLImageElement &&
				evt.target.classList.contains('BE-emote-picker__emote')
			) {
				if (evt.target.dataset.provider === 'boosty' && evt.target.dataset.id) {
					const emote = this._emotesSet.get(evt.target.dataset.id);

					if (!emote) {
						return;
					}

					const emoteContainer = document.createElement('span');
					emoteContainer.innerHTML = emote.toHtml();
					this._emoteInserter.insertEmote(emoteContainer.firstElementChild as HTMLImageElement);
				} else {
					this._emoteInserter.insertEmote(evt.target.alt);
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _show(): void {
		this.$root.classList.add('BE-emote-picker__emotes-set--show');
	}

	private _hide(): void {
		this.$root.classList.remove('BE-emote-picker__emotes-set--show');
	}

	private _getTemplate(emotesSet: EmotesSet): string {
		const isCollapsed = this._state.sets[this._provider].collapsed[this._scope];

		return html`
			<button
				type="button"
				class="BE-emote-picker__emotes-set-container ${isCollapsed
					? 'BE-emote-picker__emotes-set-container--collapsed'
					: ''}"
			>
				${browser.i18n.getMessage(`${this._provider}_${this._scope}_emotes_title`)}
			</button>
			<div
				class="BE-emote-picker__emotes-list ${isCollapsed ? 'BE-emote-picker__emotes-list--hide' : ''}"
				data-scope="${this._scope}"
			>
				${this._getEmotesListHtml(emotesSet)}
			</div>
			
			
		`;
	}

	private _getEmotesListHtml(emotesSet: EmotesSet): string {
		let emotes = '';

		for (const emote of emotesSet.values()) {
			emotes += emote.toHtml(1, 'BE-emote-picker__emote');
		}

		return emotes;
	}

	private async _writeState(): Promise<void> {
		await Store.setEmotePickerState(this._state);
	}
}
