import type { Emote } from '@shared/models'
import type { InputEmoteInjector } from '../../services'
import type { TokenWithIndices } from '../../types/token-with-indices.ts'
import type { PopupPositionOptions } from '../../utils'
import type { EmoteAutocompletionContext, EmoteAutocompletionContextResolver } from './emote-autocompletion-context.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { createEmoteAutocompletionContainer } from '../../templates'
import {
	getCaretPosition,
	getCaretRect,
	isTextNode,
	positionPopupAtCaret,
	splitTextIntoWordsWithIndices,
} from '../../utils'
import { EmoteAutocompletionController } from './emote-autocompletion.controller.ts'
import emoteAutocompletionStyles from './emote-autocompletion.module.css'

const DEFAULT_POPUP_POSITION_OPTIONS: PopupPositionOptions = {
	gap: 20,
	leftOffset: 60,
	maxHeight: 300,
}

export interface EmoteAutocompletionManagerOptions {
	$root: HTMLElement
	contextResolver: EmoteAutocompletionContextResolver
	inputEmoteInjector: InputEmoteInjector
}

export class EmoteAutocompletionManager {
	private readonly _logger = createAppLogger('EmoteAutocompletionManager')

	private _currentContext: EmoteAutocompletionContext | null = null
	private _controller: EmoteAutocompletionController | null = null
	private readonly _overlay: HTMLElement
	private _container: HTMLElement | null = null

	private _currentToken: TokenWithIndices | null = null

	constructor(private readonly _options: EmoteAutocompletionManagerOptions) {
		this._bindEvents()

		this._overlay = document.createElement('div')
		this._overlay.style.position = 'absolute'
		this._overlay.style.top = '0'
		this._overlay.style.left = '0'
		this._overlay.style.width = '0'
		this._overlay.style.height = '0'
		this._overlay.style.overflow = 'visible'
		this._overlay.style.zIndex = '2147483647'

		document.body.append(this._overlay)
	}

	public get isShown(): boolean {
		return this._controller !== null
	}

	public destroy(): void {
		this._unbindEvents()
		this._hide()
		this._overlay.remove()
	}

	private async _show(inputElement: HTMLElement, token: TokenWithIndices, caretRect?: DOMRect | null): Promise<void> {
		if (this.isShown)
			this._hide()

		caretRect = caretRect ?? getCaretRect()

		if (!caretRect) {
			this._logger.warn('Failed to get caret rect')

			return
		}

		const [context, settings] = await Promise.all([
			this._options.contextResolver.resolve(inputElement),
			storage.settings.getAutocompletionSettings(),
		])

		if (!context) {
			this._logger.warn('Failed to resolve autocompletion context for input', inputElement)

			return
		}

		this._currentContext = context
		this._currentToken = token
		this._container = createEmoteAutocompletionContainer()

		const placement = context.placement ?? 'default'

		if (placement !== 'default') {
			this._container.dataset.placement = placement
			this._currentContext.publisherRoot.append(this._container)
		}
		else {
			this._overlay.append(this._container)
		}

		this._controller = new EmoteAutocompletionController({
			context: this._currentContext.emoteContext,
			settings,
			onClose: () => this._hide(),
			onEmoteSelect: emote => this._handleEmoteSelect(emote),
		})

		const query = token.value.startsWith(':') ? token.value.slice(1) : token.value
		this._controller.mount(this._container, query)

		if (placement === 'default') {
			await positionPopupAtCaret(this._container, caretRect, DEFAULT_POPUP_POSITION_OPTIONS)
		}
	}

	private _hide(): void {
		if (this._controller) {
			this._controller.unmount()
			this._controller = null
		}

		if (this._container) {
			this._container.remove()
			this._container = null
		}

		this._currentContext?.emoteContext.destroy()
		this._currentContext = null
		this._currentToken = null
	}

	private _handleEmoteSelect(emote: Emote): void {
		if (!this._currentContext || !this._currentToken)
			return

		try {
			this._options.inputEmoteInjector.replaceTextWithEmote(
				this._currentContext.publisherRoot,
				emote,
				this._currentToken.start,
				this._currentToken.end,
				true,
			)
		}
		catch (err) {
			this._logger.error('Failed to inject autocompleted emote', err)
		}
	}

	private _bindEvents(): void {
		document.addEventListener('click', this._handleClick, true)
		document.addEventListener('keydown', this._handleKeydown, true)
		// eslint-disable-next-line ts/no-misused-promises
		document.addEventListener('keyup', this._handleKeyup, true)
	}

	private _unbindEvents(): void {
		document.removeEventListener('click', this._handleClick, true)
		document.removeEventListener('keydown', this._handleKeydown, true)
		// eslint-disable-next-line ts/no-misused-promises
		document.removeEventListener('keyup', this._handleKeyup, true)
	}

	private readonly _handleClick = (evt: MouseEvent): void => {
		if (!this.isShown || !(evt.target instanceof Element))
			return

		const isInsidePopup = evt.target.closest(`.${emoteAutocompletionStyles.root}`) !== null
		const isInsideEditor = evt.target.closest(BOOSTY_SELECTORS.publisher.cdxBlock) !== null

		if (!isInsidePopup && !isInsideEditor)
			this._hide()
	}

	private readonly _handleKeydown = (evt: KeyboardEvent): void => {
		if (
			!(evt.target instanceof HTMLElement)
			|| !evt.target.classList.contains(BOOSTY_SELECTORS.publisher.cdxBlock)
		) {
			return
		}

		if (evt.code === 'Tab') {
			evt.preventDefault()
			evt.stopPropagation()
			evt.stopImmediatePropagation()

			if (this.isShown) {
				evt.shiftKey ? this._controller?.selectPrev() : this._controller?.selectNext()
			}
		}
		else if (this.isShown && ['ArrowUp', 'ArrowDown', 'Enter'].includes(evt.code)) {
			evt.preventDefault()
			evt.stopPropagation()
		}
	}

	private readonly _handleKeyup = async (evt: KeyboardEvent): Promise<void> => {
		if (
			!(evt.target instanceof HTMLElement)
			|| !evt.target.classList.contains(BOOSTY_SELECTORS.publisher.cdxBlock)
		) {
			return
		}

		const caretRect = getCaretRect()

		if (!caretRect) {
			this._logger.warn('Failed to get caret rect')

			return
		}

		if (this.isShown) {
			switch (evt.code) {
				case 'Escape':
					this._hide()

					return

				case 'ArrowUp':
					this._controller?.selectPrev()

					return

				case 'ArrowDown':
					this._controller?.selectNext()

					return

				case 'Space':
				case 'Enter':
				case 'NumpadEnter':
					this._controller?.completeCurrent()

					return

				case 'ArrowLeft':
				case 'ArrowRight':
					this._hide()

					return
			}
		}

		const token = this._getCurrentWord(evt.target)

		if (!token) {
			if (this.isShown)
				this._hide()

			return
		}

		if (evt.code === 'Tab') {
			if (!this.isShown) {
				const settings = await storage.settings.getAutocompletionSettings()

				if (settings.useTabAutocompletion && token.value.length >= 2) {
					await this._show(evt.target, token, caretRect)
				}
			}

			return
		}

		if (token.value.startsWith(':')) {
			const settings = await storage.settings.getAutocompletionSettings()

			if (!settings.useColonAutocompletion)
				return

			const query = token.value.slice(1)

			if (query.length < 2) {
				if (this.isShown)
					this._hide()

				return
			}

			if (this.isShown) {
				this._currentToken = token
				this._controller?.updateQuery(query)

				const newCaretRect = getCaretRect()

				if (newCaretRect && this._container && this._currentContext?.placement === 'default') {
					await positionPopupAtCaret(this._container, newCaretRect, DEFAULT_POPUP_POSITION_OPTIONS)
				}
			}
			else {
				await this._show(evt.target, token, caretRect)
			}
		}
		else if (this.isShown && evt.code === 'Backspace') {
			this._hide()
		}
	}

	private _getCurrentWord(block: HTMLElement): TokenWithIndices | null {
		const cursor = getCaretPosition(block)

		if (!cursor)
			return null

		const item = block.childNodes[cursor.itemIndex]

		if (!isTextNode(item) || !item.textContent)
			return null

		const words = splitTextIntoWordsWithIndices(item.textContent)

		return words.find(word => cursor.offset > word.start && cursor.offset <= word.end) ?? null
	}
}
