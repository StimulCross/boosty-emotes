import type { MessageReceiver } from '@shared/messaging'
import type { Emote, ThirdPartyEmote } from '@shared/models'
import type { EmoteService, FavoriteEmotesService } from '@shared/services'
import type { EmoteScope, ThirdPartyEmoteProvider } from '@shared/types'
import type { EmoteAutocompletionContextResolver, EmotePickerContextResolver } from '../../../components'
import type { BoostyApiClient, ChannelContext, ChannelsService } from '../../../services'
import type { PageControllerOptions } from '../../page.controller.ts'
import { EmoteContext } from '@shared/emote-context'
import { CompositeFavoriteEmotesService } from '@shared/services'
import { EmoteAutocompletionManager, EmotePickerManager } from '../../../components'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { InputEmoteInjector, RedactorsService } from '../../../services'
import { getCaretPosition, injectEmotesIntoDom } from '../../../utils'
import { PageController } from '../../page.controller.ts'

const EVENTS = ['input', 'keyup', 'click', 'mousedown']

export interface SingleUserPageControllerOptions extends PageControllerOptions {
	messageReceiver: MessageReceiver
	channelsService: ChannelsService
	boostyApiClient: BoostyApiClient
}

export abstract class SingleUserPageController<
	O extends SingleUserPageControllerOptions = SingleUserPageControllerOptions,
> extends PageController<O> {
	protected readonly _boostyApiClient: BoostyApiClient
	protected _injectionEmoteContext: EmoteContext<ThirdPartyEmote> | null = null
	protected _emotePickerManager: EmotePickerManager | null = null
	protected _emoteAutocompletionManager: EmoteAutocompletionManager | null = null

	private _channelContext: ChannelContext | null = null
	private readonly _redactorsState = new RedactorsService()

	constructor(options: O) {
		super(options)

		this._boostyApiClient = options.boostyApiClient

		this._bindEvents()

		this._mutationObserverService.registerFilter(
			(mutation: MutationRecord) => mutation.target instanceof HTMLElement,
		)
	}

	public async init(): Promise<void> {
		await super.init()

		this._channelContext = await this._resolveChannelContext()
		const compositeFavorites = new CompositeFavoriteEmotesService(
			this._options.globalFavoriteEmoteService,
			this._channelContext?.favoriteEmotesService,
		)

		await compositeFavorites.init()

		const sources: EmoteService<ThirdPartyEmote>[] = [this._options.globalEmoteService]

		if (this._channelContext)
			sources.push(this._channelContext.emoteService)

		this._injectionEmoteContext = new EmoteContext<ThirdPartyEmote>(
			sources,
			compositeFavorites,
		)

		const pickerEmoteContext = this._createComponentEmoteContext(compositeFavorites, this._channelContext)

		const inputEmoteInjector = new InputEmoteInjector(this._redactorsState)

		this._emotePickerManager = new EmotePickerManager({
			$root: this.$root,
			inputEmoteInjector,
			contextResolver: this._createEmotePickerContextResolver(pickerEmoteContext),
		})

		this._emoteAutocompletionManager = new EmoteAutocompletionManager({
			$root: this.$root,
			inputEmoteInjector,
			contextResolver: this._createEmoteAutocompletionContextResolver(pickerEmoteContext),
		})

		this._initMutationHandlers()

		if (document.readyState === 'loading')
			document.addEventListener('DOMContentLoaded', () => this._processPage(), { once: true })

		this._processPage()
		this._mutationObserverService.start()

		this._checkBoostyProfile()
			.catch(err => this._logger.error('Failed to update Boosty profile', err))

		this._logger.debug('Initialized')
	}

	public override async destroy(): Promise<void> {
		await super.destroy()

		this._unbindEvents()
		this._injectionEmoteContext?.destroy()
		this._emotePickerManager?.destroy()
		this._emoteAutocompletionManager?.destroy()

		// it's better to keep it cached
		// this._channelContext?.destroy()
	}

	protected abstract _resolveChannelContext(): Promise<ChannelContext | null>

	protected abstract _createComponentEmoteContext(
		favoriteEmotesService: FavoriteEmotesService,
		channelContext?: ChannelContext | null
	): EmoteContext

	protected abstract _createEmotePickerContextResolver(emoteContext: EmoteContext): EmotePickerContextResolver

	protected abstract _createEmoteAutocompletionContextResolver(
		emoteContext: EmoteContext,
	): EmoteAutocompletionContextResolver

	protected _injectEmotes(
		node: Node,
		shouldProcessNode?: (node: Node) => boolean,
		allowedTags?: ReadonlySet<string>,
	): void {
		if (!this._injectionEmoteContext) {
			this._logger.warn('Emote context is not initialized')

			return
		}

		injectEmotesIntoDom(node, this._injectionEmoteContext, shouldProcessNode, allowedTags)
	}

	protected _updateRedactorCaretPosition(element: Element): void {
		const redactor = element.closest(`.${BOOSTY_SELECTORS.publisher.redactor}`)

		if (!(redactor instanceof HTMLElement))
			return

		const caretPosition = getCaretPosition(element)
		this._redactorsState.set(redactor, caretPosition)
	}

	protected _bindEvents(): void {
		this.$root.addEventListener('click', this._handleEmoteClick, { capture: true })

		for (const evt of EVENTS)
			this.$root.addEventListener(evt, this._handleRedactorInteraction)
	}

	protected _unbindEvents(): void {
		this.$root.removeEventListener('click', this._handleEmoteClick, { capture: true })

		for (const evt of EVENTS)
			this.$root.removeEventListener(evt, this._handleRedactorInteraction)
	}

	protected abstract _checkBoostyProfile(): Promise<void>

	private readonly _handleRedactorInteraction = (evt: Event): void => {
		try {
			const target = evt.target

			if (!(target instanceof Element))
				return

			if (evt.type === 'mousedown' && !target.closest('button[data-action="toggle-emote-picker"]'))
				return

			const elToCheck = evt.type === 'mousedown' ? document.activeElement : target

			if (!(elToCheck instanceof Element))
				return

			const cdxBlock = elToCheck.classList.contains(BOOSTY_SELECTORS.publisher.cdxBlock)
				? elToCheck
				: elToCheck.closest(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`)

			if (cdxBlock)
				this._updateRedactorCaretPosition(cdxBlock)
		}
		catch (err) {
			this._logger.error(err)
		}
	}

	private readonly _handleEmoteClick = (evt: MouseEvent): void => {
		const target = evt.target

		if (!(target instanceof HTMLElement) || !this._injectionEmoteContext)
			return

		const emoteBox = target.closest<HTMLButtonElement>('button[data-action="page-emote-click"]')

		if (!emoteBox)
			return

		evt.stopPropagation()
		evt.preventDefault()

		const { provider, id, scope } = emoteBox.dataset

		if (!provider || !id || !scope)
			return

		const emote = this._injectionEmoteContext.findById(provider as ThirdPartyEmoteProvider, id, scope as EmoteScope)

		if (!emote)
			return

		if (evt.ctrlKey || evt.altKey) {
			this._handleFavoriteEmoteToggle(emote, emoteBox).catch(err =>
				this._logger.error('Failed to handle favorite emote click', err))
		}
		else {
			navigator.clipboard
				.writeText(emote.name)
				.then(() => {
					this._actionTooltip
						.show(emoteBox, browser.i18n.getMessage('copied'))
						.catch(err => this._logger.error('Failed to show tooltip', err))
				})
				.catch(err => this._logger.error('Failed to write name to clipboard', err))
		}
	}

	private async _handleFavoriteEmoteToggle(emote: Emote, emoteBox: HTMLButtonElement): Promise<void> {
		if (!this._injectionEmoteContext)
			return

		const isFavorite = this._injectionEmoteContext.favorites.isFavorite(emote)

		await (isFavorite
			? this._injectionEmoteContext.favorites.remove(emote)
			: this._injectionEmoteContext.favorites.add(emote))

		const isFavoriteNow = !isFavorite

		emoteBox.dataset.isFavorite = isFavoriteNow ? 'true' : ''

		await this._emoteTooltip.updateTooltipEmoteData({ isFavorite: isFavoriteNow })
	}
}
