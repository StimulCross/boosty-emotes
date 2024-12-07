import { createLogger } from '@stimulcross/logger';
import { type PageContext } from '@content/contexts/page-context';
import { createEmotePickerOverlay } from '@content/templates';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { DomListener } from '@shared/dom-listener';
import { type EventEmitter } from '@shared/event-emitter';
import { Store } from '@shared/store';
import { type ScopesEmotesSets } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { type RedactorsState } from '..';
import { EmotePicker } from '.';

export interface EmotePickerStyleOptions {
	zIndex?: string;
	bottomOffset?: string;
}

export class EmotePickerComponent extends DomListener {
	private readonly _logger = createLogger(createLoggerOptions(EmotePickerComponent.name));
	private _currentEmotePickerActiveButton: HTMLElement | null = null;
	private _emotePicker: EmotePicker | null = null;
	private _emotePickerOverlay: HTMLElement | null = null;

	constructor(
		$root: HTMLElement,
		emitter: EventEmitter,
		private readonly _publisherRootClassNames: string[],
		private readonly _context: PageContext,
		private readonly _redactorsState: RedactorsState,
		private readonly _styleOptions?: EmotePickerStyleOptions
	) {
		super($root, {
			emitter,
			listeners: ['click', 'keyup']
		});

		this.initDomListeners();
	}

	public get isShown(): boolean {
		return this._currentEmotePickerActiveButton !== null || this._emotePicker !== null;
	}

	public destroy(): void {
		this.removeDomListeners();
		this._hide();
	}

	private async _show(
		button: HTMLElement,
		emoteSets: ScopesEmotesSets,
		favoriteEmotes: FavoriteEmotes
	): Promise<void> {
		let publisherRoot: Node | null = null;

		for (const className of this._publisherRootClassNames) {
			const el = button.closest(`[class*="${className}"]`);

			if (el) {
				publisherRoot = el;
				break;
			}
		}

		if (!(publisherRoot instanceof HTMLElement)) {
			this._hide();
			return;
		}

		this._currentEmotePickerActiveButton = button;
		this._currentEmotePickerActiveButton.classList.add('BE-emote-picker__button--active');

		const emotePickerState = await Store.getEmotePickerState();

		this._emotePicker = new EmotePicker(
			document.createElement('div'),
			this._emitter,
			publisherRoot,
			this._redactorsState,
			emotePickerState,
			emoteSets,
			favoriteEmotes,
			this._styleOptions?.bottomOffset
		);
		this._emotePickerOverlay = createEmotePickerOverlay(this._styleOptions?.zIndex);
		this.$root.append(this._emotePickerOverlay);
	}

	private _hide(): void {
		if (this._emotePicker) {
			this._emotePicker.destroy();
			this._emotePicker = null;
		}

		if (this._currentEmotePickerActiveButton) {
			this._currentEmotePickerActiveButton.classList.remove('BE-emote-picker__button--active');
			this._currentEmotePickerActiveButton = null;
		}

		if (this._emotePickerOverlay) {
			this._emotePickerOverlay.remove();
			this._emotePickerOverlay = null;
		}
	}

	private async _onClick(evt: MouseEvent): Promise<void> {
		try {
			if (evt.target instanceof Element) {
				let emotePickerBtn: HTMLButtonElement | null = null;

				if (evt.target.classList.contains('BE-emote-picker__button')) {
					emotePickerBtn = evt.target as HTMLButtonElement;
				} else if (evt.target.classList.contains('BE-emote-picker__icon')) {
					emotePickerBtn = evt.target.parentElement! as HTMLButtonElement;
				} else if (evt.target.parentElement?.classList.contains('BE-emote-picker__icon')) {
					emotePickerBtn = evt.target.parentElement.parentElement! as HTMLButtonElement;
				}

				if (emotePickerBtn) {
					if (emotePickerBtn.classList.contains('BE-emote-picker__button--active') || this.isShown) {
						this._hide();
					} else {
						await this._show(
							emotePickerBtn,
							this._context.getAvailableEmoteSetsByScope(),
							await this._context.getFavoriteEmotes()
						);
					}
				} else if (evt.target.classList.contains('BE-emote-picker__overlay')) {
					this._hide();
				} else if (
					this.isShown &&
					!evt.target.closest('.BE-emote-picker') &&
					this._publisherRootClassNames.every(
						className => !(evt.target as Element).closest(`[class*=${className}]`)
					)
				) {
					this._hide();
				} else if (this.isShown && evt.target.closest('[class*=Publisher_sendContainer_]')) {
					this._hide();
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _onKeyup(evt: KeyboardEvent): void {
		try {
			if (this.isShown && evt.key === 'Escape') {
				this._hide();
			}
		} catch (e) {
			this._logger.error(e);
		}
	}
}
