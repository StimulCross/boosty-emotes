import type { Emote } from '@shared/models'
import type { InputEmoteInjector } from '../../services'
import type { EmotePickerContext, EmotePickerContextResolver } from './emote-picker-context.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { createEmotePickerContainer } from '../../templates'
import emotePickerButtonStyles from '../../templates/emote-picker-button.module.css'
import { EmotePickerController } from './emote-picker.controller.ts'
import emotePickerStyles from './emote-picker.module.css'

export interface EmotePickerManagerOptions {
	$root: HTMLElement
	contextResolver: EmotePickerContextResolver
	inputEmoteInjector: InputEmoteInjector
}

export class EmotePickerManager {
	private readonly _logger = createAppLogger('EmotePickerManager')

	private _activeButton: HTMLElement | null = null
	private _currentContext: EmotePickerContext | null = null
	private _emotePickerContainer: HTMLElement | null = null
	// private _overlay: HTMLElement | null = null
	private _emotePickerController: EmotePickerController | null = null

	constructor(private readonly _options: EmotePickerManagerOptions) {
		this._bindEvents()
	}

	public get isShown(): boolean {
		return this._emotePickerContainer !== null
	}

	public destroy(): void {
		this._unbindEvents()
		this._hide()
	}

	private async _show(button: HTMLButtonElement): Promise<void> {
		if (this.isShown)
			this._hide()

		this._currentContext = await this._options.contextResolver.resolve(button)

		if (!this._currentContext) {
			this._logger.warn(
				`Failed to resolve emote picker context using ${this._options.contextResolver.constructor.name}`,
			)

			return
		}

		this._activeButton = button
		this._activeButton.classList.add(emotePickerButtonStyles.active)

		// this._overlay = createEmotePickerOverlay()
		// this._options.$root.append(this._overlay)

		this._emotePickerContainer = createEmotePickerContainer()
		this._currentContext.publisherRoot.append(this._emotePickerContainer)

		if (this._currentContext.placement)
			this._emotePickerContainer.dataset.placement = this._currentContext.placement

		this._emotePickerController = new EmotePickerController({
			context: this._currentContext.emoteContext,
			onEmoteSelect: emote => {
				if (!this._currentContext)
					return

				this._handleEmoteSelect(emote, this._currentContext.publisherRoot)
			},
		})

		this._emotePickerController.mount(this._emotePickerContainer)

		const persistedState = await storage.state.getEmotePickerState()

		await this._emotePickerController.init(persistedState)
	}

	private _hide(): void {
		if (this._emotePickerController) {
			this._emotePickerController.unmount()
			this._emotePickerController = null
		}

		if (this._emotePickerContainer) {
			this._emotePickerContainer.remove()
			this._emotePickerContainer = null
		}

		// if (this._overlay) {
		// 	this._overlay.remove()
		// 	this._overlay = null
		// }

		if (this._activeButton) {
			this._activeButton.classList.remove(emotePickerButtonStyles.active)
			this._activeButton = null
		}

		this._currentContext?.emoteContext.destroy()
		this._currentContext = null
	}

	private _bindEvents(): void {
		this._options.$root.addEventListener('click', this._handleClick)
		this._options.$root.addEventListener('keyup', this._handleKeyUp)
	}

	private _unbindEvents(): void {
		this._options.$root.removeEventListener('click', this._handleClick)
		this._options.$root.removeEventListener('keyup', this._handleKeyUp)
	}

	private _handleEmoteSelect(emote: Emote, publisherRoot: HTMLElement): void {
		try {
			this._options.inputEmoteInjector.injectEmote(publisherRoot, emote, true)
		}
		catch (err) {
			this._logger.error('Failed to inject emote', err)
		}
	}

	private readonly _handleClick = (evt: MouseEvent): void => {
		try {
			const target = evt.target as Element | null

			if (!target)
				return

			const emotePickerBtn = target.closest<HTMLButtonElement>('button[data-action="toggle-emote-picker"]')

			if (emotePickerBtn) {
				if (emotePickerBtn.classList.contains(emotePickerButtonStyles.active))
					this._hide()

				else
					void this._show(emotePickerBtn)
			}

			if (!this.isShown)
				return

			if (target instanceof HTMLElement && target.dataset.type === 'emote-picker-overlay') {
				this._hide()

				return
			}

			if (target.closest(`[class*="${BOOSTY_SELECTORS.publisher.sendButton}"]`)) {
				this._hide()

				return
			}

			const isInsidePicker = target.closest(`.${emotePickerStyles.root}`) !== null
			const isInsidePublisher = this._currentContext?.publisherRoot.contains(target) ?? false

			if (!isInsidePicker && !isInsidePublisher)
				this._hide()
		}
		catch (err) {
			this._logger.error('Error handling global click', err)
		}
	}

	private readonly _handleKeyUp = (evt: KeyboardEvent): void => {
		if (this.isShown && evt.key === 'Escape')
			this._hide()
	}
}
