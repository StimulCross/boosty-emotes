import { type Logger } from '@stimulcross/logger';
import { html } from 'code-tag';
import browser from 'webextension-polyfill';
import { EMOTE_PICKER_EVENTS } from '@content/components/emote-picker/constants';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { type EmotePickerState } from '@shared/models';
import { Store } from '@shared/store';
import { type EmotePickerTab, type EmoteScope, type EmotesSet } from '@shared/types';
import { type EmoteInserter } from '../../emote-inserter';

export abstract class EmotePickerEmoteSet extends DomListener {
	protected readonly _emotesList: HTMLDivElement;
	protected _visibleEmoteCount: number = 0;

	protected constructor(
		$root: HTMLDivElement,
		emitter: EventEmitter,
		protected readonly _logger: Logger,
		private readonly _tab: EmotePickerTab,
		protected readonly _emotesSet: EmotesSet,
		protected readonly _scope: EmoteScope,
		private readonly _emoteInserter: EmoteInserter,
		protected readonly _state: EmotePickerState,
		protected readonly _favoriteEmotes: FavoriteEmotes
	) {
		super($root, { emitter, listeners: ['click'] });

		this.$root.classList.add('BE-emote-picker__emotes-set');
		this.$root.innerHTML = this._getTemplate();

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
			if (!(emote.firstElementChild as HTMLImageElement).alt.toLowerCase().includes(keyword)) {
				emote.classList.add('BE-emote-picker__emote-button--hide');
			} else {
				if (emote.classList.contains('BE-emote-picker__emote-button--hide')) {
					emote.classList.remove('BE-emote-picker__emote-button--hide');
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

	private get _isCollapsed(): boolean {
		return this._state.sets[this._tab].collapsed[this._scope];
	}

	private set _isCollapsed(value: boolean) {
		this._state.sets[this._tab].collapsed[this._scope] = value;
	}

	protected abstract _getEmotesListHtml(): string;

	protected abstract _handleEmoteCtrlClick(emote: HTMLButtonElement): Promise<void>;

	protected _show(): void {
		this.$root.classList.add('BE-emote-picker__emotes-set--show');
	}

	protected _hide(): void {
		this.$root.classList.remove('BE-emote-picker__emotes-set--show');
	}

	protected _updateEmoteSetVisibility(): void {
		let visibleEmoteCount = 0;

		for (const emote of this._emotesList.children) {
			if (!emote.classList.contains('BE-emote-picker__emote-button--hide')) {
				visibleEmoteCount += 1;
			}
		}

		if (this._visibleEmoteCount === visibleEmoteCount) {
			return;
		}

		if (visibleEmoteCount === 0) {
			this._hide();
		} else {
			this._show();
		}

		this._visibleEmoteCount = visibleEmoteCount;

		this._emitter.emit(EMOTE_PICKER_EVENTS.emoteSetVisibilityUpdate, {
			tab: this._tab,
			scope: this._scope,
			visibleEmoteCount
		});
	}

	protected _removeFavoriteIconFromEmote(emote: Element): void {
		for (const el of emote.children) {
			if (el.classList.contains('favorite-icon')) {
				el.remove();
				break;
			}
		}
	}

	private async _handleEmoteSetClick(container: HTMLButtonElement): Promise<void> {
		const collapsed = container.classList.contains('BE-emote-picker__emotes-set-container--collapsed');

		if (collapsed) {
			this._emotesList.classList.remove('BE-emote-picker__emotes-list--hide');
			container.classList.remove('BE-emote-picker__emotes-set-container--collapsed');
			this._isCollapsed = false;
		} else {
			this._emotesList.classList.add('BE-emote-picker__emotes-list--hide');
			container.classList.add('BE-emote-picker__emotes-set-container--collapsed');
			this._isCollapsed = true;
		}

		await this._writeState();
	}

	private async _handleEmoteClick(emoteButton: HTMLButtonElement, ctrlKey: boolean): Promise<void> {
		if (ctrlKey) {
			await this._handleEmoteCtrlClick(emoteButton);
		} else {
			const image = emoteButton.firstElementChild;

			if (!(image instanceof HTMLImageElement)) {
				return;
			}

			if (emoteButton.dataset.provider === 'boosty' && emoteButton.dataset.id) {
				const emote = this._emotesSet.get(emoteButton.dataset.id);

				if (!emote) {
					return;
				}

				const emoteTempContainer = document.createElement('span');
				emoteTempContainer.innerHTML = emote.toHtml();
				this._emoteInserter.insertEmote(emoteTempContainer.firstElementChild as HTMLImageElement);
			} else {
				this._emoteInserter.insertEmote(image.alt);
			}
		}
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (!(evt.target instanceof HTMLButtonElement) && !(evt.target instanceof HTMLImageElement)) {
				return;
			}

			if (
				evt.target instanceof HTMLButtonElement &&
				evt.target.classList.contains('BE-emote-picker__emotes-set-container')
			) {
				await this._handleEmoteSetClick(evt.target);
			} else if (
				evt.target instanceof HTMLButtonElement &&
				evt.target.classList.contains('BE-emote-picker__emote-button')
			) {
				await this._handleEmoteClick(evt.target, evt.ctrlKey || evt.altKey);
			} else if (
				evt.target instanceof HTMLImageElement &&
				evt.target.classList.contains('BE-emote-picker__emote') &&
				evt.target.parentElement instanceof HTMLButtonElement &&
				evt.target.parentElement.classList.contains('BE-emote-picker__emote-button')
			) {
				await this._handleEmoteClick(evt.target.parentElement, evt.ctrlKey || evt.altKey);
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _getTemplate(): string {
		return html`
			<button
				type="button"
				class="BE-emote-picker__emotes-set-container ${this._isCollapsed
					? 'BE-emote-picker__emotes-set-container--collapsed'
					: ''}"
			>
				${browser.i18n.getMessage(`${this._tab}_${this._scope}_emotes_title`)}
			</button>
			<div
				class="BE-emote-picker__emotes-list ${this._isCollapsed ? 'BE-emote-picker__emotes-list--hide' : ''}"
				data-scope="${this._scope}"
			>
				${this._getEmotesListHtml()}
			</div>
			
			
		`;
	}

	private async _writeState(): Promise<void> {
		await Store.setEmotePickerState(this._state);
	}
}
