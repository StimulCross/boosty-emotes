import { createLogger } from '@stimulcross/logger';
import { type RedactorsState } from '@content/components';
import { EMOTE_AUTOCOMPLETION_EVENTS } from '@content/components/emote-autocompletion/constants';
import { EmoteAutocompletion } from '@content/components/emote-autocompletion/emote-autocompletion';
import type { PageContext } from '@content/contexts/page-context';
import { type TokenWithIndices } from '@content/types/token-with-indices';
import { getCaretPosition, splitTextIntoWordsWithIndices } from '@content/utils';
import { type FavoriteEmotes } from '@shared/components/favorite-emotes';
import { DomListener } from '@shared/dom-listener';
import type { EventEmitter } from '@shared/event-emitter';
import { type EmoteAutocompletionSettings } from '@shared/models/emote-autocompletion-settings';
import { Store } from '@shared/store';
import type { ScopesEmotesSets } from '@shared/types';
import { checkIsTextNode } from '@shared/utils/check-is-text-node';
import { createLoggerOptions } from '@shared/utils/create-logger-options';

export interface EmoteAutocompletionStyleOptions {
	bottomOffset?: string;
	leftOffset?: string;
	width?: string;
}

export class EmoteAutocompletionComponent extends DomListener {
	private static readonly _minSymbolsToComplete = 2;

	private readonly _logger = createLogger(createLoggerOptions(EmoteAutocompletionComponent.name));
	private _emoteAutocompletion: EmoteAutocompletion | null = null;

	constructor(
		$root: HTMLElement,
		emitter: EventEmitter,
		private readonly _publisherRootClassNames: string[],
		private readonly _context: PageContext,
		private readonly _redactorsState: RedactorsState,
		private readonly _styleOptions?: EmoteAutocompletionStyleOptions
	) {
		super($root, {
			emitter,
			listeners: ['click', 'keydown', 'keyup']
		});

		this.initDomListeners();

		this._handleEmoteComplete = this._handleEmoteComplete.bind(this);
		this._handleNoMatches = this._handleNoMatches.bind(this);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_AUTOCOMPLETION_EVENTS.emoteComplete, this._handleEmoteComplete);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.on(EMOTE_AUTOCOMPLETION_EVENTS.noMatches, this._handleNoMatches);

		this._logger.debug('Created');
	}

	public destroy(): void {
		this.removeDomListeners();
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_AUTOCOMPLETION_EVENTS.emoteComplete, this._handleEmoteComplete);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._emitter.off(EMOTE_AUTOCOMPLETION_EVENTS.noMatches, this._handleNoMatches);
		this._hide();
	}

	private get _isShown(): boolean {
		return this._emoteAutocompletion !== null;
	}

	private _show(
		paragraph: Element,
		emoteSets: ScopesEmotesSets,
		favoriteEmotes: FavoriteEmotes,
		emoteAutocompletionSettings: EmoteAutocompletionSettings,
		initialInput: TokenWithIndices
	): void {
		let publisherRoot: Node | null = null;

		for (const className of this._publisherRootClassNames) {
			const el = paragraph.closest(`[class*="${className}"]`);

			if (el) {
				publisherRoot = el;
				break;
			}
		}

		if (!(publisherRoot instanceof HTMLElement)) {
			this._hide();
			return;
		}

		this._emoteAutocompletion = new EmoteAutocompletion(
			document.createElement('div'),
			this._emitter,
			publisherRoot,
			this._redactorsState,
			emoteSets,
			favoriteEmotes,
			initialInput,
			emoteAutocompletionSettings,
			this._styleOptions?.bottomOffset,
			this._styleOptions?.leftOffset,
			this._styleOptions?.width
		);
	}

	private _hide(): void {
		if (this._emoteAutocompletion) {
			this._emoteAutocompletion.destroy();
			this._emoteAutocompletion = null;
		}
	}

	private _getCurrentWord(block: HTMLElement): TokenWithIndices | null {
		const cursor = getCaretPosition(block);

		if (!cursor) {
			return null;
		}
		const item = block.childNodes[cursor.itemIndex];

		if (!checkIsTextNode(item) || !item.textContent) {
			return null;
		}

		const words = splitTextIntoWordsWithIndices(item.textContent);
		return words.find(word => cursor.offset > word.start && cursor.offset <= word.end) ?? null;
	}

	private _onClick(evt: MouseEvent): void {
		if (!(evt.target instanceof HTMLElement)) {
			return;
		}

		if (
			this._isShown &&
			!evt.target.closest('.BE-emote-autocompletion') &&
			this._publisherRootClassNames.every(className => !(evt.target as Element).closest(`[class*=${className}]`))
		) {
			this._hide();
		} else if (this._isShown && evt.target.closest('[class*=Publisher_sendContainer_]')) {
			this._hide();
		}
	}

	private _onKeydown(evt: KeyboardEvent): void {
		if (!(evt.target instanceof HTMLElement) || !evt.target.classList.contains('cdx-block')) {
			return;
		}

		if (evt.code === 'Tab') {
			evt.preventDefault();
		} else if (
			(evt.code === 'ArrowUp' || evt.code === 'ArrowDown' || evt.code === 'Space' || evt.code === 'Enter') &&
			this._isShown
		) {
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	private async _onKeyup(evt: KeyboardEvent): Promise<void> {
		try {
			if (evt.target instanceof HTMLElement && evt.target.classList.contains('cdx-block')) {
				if (evt.code === 'Escape') {
					if (this._isShown) {
						evt.preventDefault();
						evt.stopPropagation();

						this._hide();

						return;
					}
				}

				if (evt.code === 'ArrowUp') {
					if (this._isShown) {
						evt.preventDefault();
						evt.stopPropagation();

						this._emoteAutocompletion?.selectPrev();

						return;
					}
				}

				if (evt.code === 'ArrowDown') {
					if (this._isShown) {
						evt.preventDefault();
						evt.stopPropagation();

						this._emoteAutocompletion?.selectNext();

						return;
					}
				}

				if (evt.code === 'Space') {
					if (this._isShown) {
						evt.preventDefault();
						evt.stopPropagation();

						this._emoteAutocompletion?.completeCurrentEmote();

						return;
					}
				}

				const token = this._getCurrentWord(evt.target);

				if (evt.code === 'Tab') {
					evt.preventDefault();

					if (this._isShown) {
						if (evt.shiftKey) {
							this._emoteAutocompletion?.selectPrev();
						} else {
							this._emoteAutocompletion?.selectNext();
						}
					} else {
						if (!token || token.value.length < EmoteAutocompletionComponent._minSymbolsToComplete) {
							return;
						}

						const emoteAutoCompletionSettings = await Store.getEmoteAutocompletionSettings();

						if (!emoteAutoCompletionSettings.useTabAutocompletion) {
							return;
						}

						this._show(
							evt.target,
							this._context.getAvailableEmoteSetsByScope(),
							await this._context.getFavoriteEmotes(),
							emoteAutoCompletionSettings,
							token
						);
					}

					return;
				}

				if (!token) {
					this._hide();
					return;
				}

				if (token.value.startsWith(':')) {
					const emoteAutoCompletionSettings = await Store.getEmoteAutocompletionSettings();

					if (!emoteAutoCompletionSettings.useColonAutocompletion) {
						return;
					}

					token.value = token.value.slice(1);

					if (token.value.length < EmoteAutocompletionComponent._minSymbolsToComplete) {
						this._hide();
						return;
					}

					if (this._emoteAutocompletion) {
						this._emoteAutocompletion.update(token);
					} else {
						this._show(
							evt.target,
							this._context.getAvailableEmoteSetsByScope(),
							await this._context.getFavoriteEmotes(),
							await Store.getEmoteAutocompletionSettings(),
							token
						);
					}
				} else {
					// eslint-disable-next-line no-lonely-if
					if (evt.code === 'Backspace' || evt.code === 'ArrowLeft' || evt.code === 'ArrowRight') {
						if (this._isShown) {
							this._hide();
						}
					}
				}
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _handleEmoteComplete(): void {
		this._hide();
	}

	private _handleNoMatches(): void {
		this._hide();
	}
}
