import { computePosition, flip, offset, shift, size } from '@floating-ui/dom';
import { createLogger } from '@stimulcross/logger';
import { html } from 'code-tag';
import { DomListener } from '@shared/dom-listener';
import { EventEmitter } from '@shared/event-emitter';
import { type EmoteProvider } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { getTooltipEmoteSrcset } from './get-tooltip-emote-srcset';

export class EmoteTooltip extends DomListener {
	private readonly _logger = createLogger(createLoggerOptions(EmoteTooltip.name));
	private readonly _rootContainer: Element;
	private _currentTooltip: HTMLElement | null = null;
	private _currentEmote: HTMLImageElement | null = null;
	private _timeout: ReturnType<typeof setTimeout> | null = null;

	constructor(rootContainer: HTMLElement) {
		super(rootContainer, { emitter: new EventEmitter(), listeners: ['mouseover'] });

		this._rootContainer = rootContainer;
		this.initDomListeners();
	}

	public destroy(): void {
		this._reset();
		this.removeDomListeners();
	}

	private _onMouseover(evt: MouseEvent): void {
		try {
			if (this._isEmoteButton(evt.target)) {
				this._createEmoteTooltip(evt.target.firstElementChild! as HTMLImageElement);
			} else if (this._isEmoteImage(evt.target)) {
				this._createEmoteTooltip(evt.target);
			} else if (!this._isEmoteImage(evt.relatedTarget) && !this._isEmoteButton(evt.relatedTarget)) {
				this._reset();
			}
		} catch (e) {
			this._logger.error(e);
		}
	}

	private _isEmoteButton(element: unknown): element is HTMLButtonElement {
		return element instanceof HTMLButtonElement && element.dataset.tooltip === 'emote';
	}

	private _isEmoteImage(element: unknown): element is HTMLImageElement {
		return element instanceof HTMLImageElement && element.dataset.tooltip === 'emote';
	}

	private _createEmoteTooltip(emoteImage: HTMLImageElement): void {
		if (this._currentEmote === emoteImage) {
			return;
		}

		this._reset();

		this._currentEmote = emoteImage;
		const originalWidth = this._currentEmote.width;
		const originalHeight = this._currentEmote.height;
		const tooltipWidth = originalWidth * 3;
		const tooltipHeight = originalHeight * 3;

		this._currentTooltip = document.createElement('div');
		this._currentTooltip.classList.add('BE-emote-tooltip');

		if (this._currentEmote.dataset.type === 'smile') {
			this._currentEmote.dataset.provider = 'boosty';
		}

		this._currentTooltip.innerHTML = html`
						<div class="BE-emote-tooltip-container">
				<img
					class="BE-emote-tooltip-image"
					src="${this._currentEmote.src}"
					alt="${this._currentEmote.alt}"
					width="${String(tooltipWidth)}"
					height="${String(tooltipHeight)}"
					sizes="auto"
				/>
				<div class="BE-emote-tooltip-provider">${this._currentEmote.dataset.provider?.toUpperCase() ?? ''}</div>
				<div class="BE-emote-tooltip-name">${this._currentEmote.alt}</div>
			</div>`;

		this._rootContainer.appendChild(this._currentTooltip);

		computePosition(this._currentEmote, this._currentTooltip, {
			placement: 'top',
			strategy: 'absolute',
			middleware: [
				flip(),
				shift({ padding: 5 }),
				offset(8),
				size({
					apply({ availableWidth, availableHeight, elements }) {
						Object.assign(elements.floating.style, {
							maxWidth: `${availableWidth - 20}px`,
							maxHeight: `${availableHeight - 20}px`
						});
					}
				})
			]
		})
			.then(({ x, y }) => {
				if (this._currentTooltip) {
					Object.assign(this._currentTooltip.style, {
						left: `${x}px`,
						top: `${y}px`
					});
				}
			})
			.catch(e => this._logger.error(e));

		this._timeout = setTimeout(() => {
			if (this._currentTooltip) {
				try {
					this._currentTooltip.classList.add('BE-emote-tooltip--show');
					const img = this._currentTooltip.querySelector('.BE-emote-tooltip-image');

					if (img instanceof HTMLImageElement && this._currentEmote) {
						img.srcset = getTooltipEmoteSrcset(
							this._currentEmote.dataset.provider as EmoteProvider,
							this._currentEmote.dataset.id!,
							originalWidth,
							originalHeight
						);
					}
				} catch (e) {
					this._logger.warn(e);
				}
			}
		}, 300);
	}

	private _reset(): void {
		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = null;
		}

		if (this._currentEmote) {
			this._currentEmote = null;
		}

		if (this._currentTooltip) {
			this._currentTooltip.remove();
			this._currentTooltip = null;
		}
	}
}
