import type { Emote, ThirdPartyEmote } from '@shared/models'
import type { EmoteScope, ThirdPartyEmoteProvider } from '@shared/types'
import type { BoostyApiClient, ChannelContext, ChannelsService } from '../../services'
import type { PageControllerOptions } from '../page.controller.ts'
import { EmoteContext } from '@shared/emote-context'
import { CompositeFavoriteEmotesService } from '@shared/services'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { EmoteAutocompletionManager, EmotePickerManager } from '../../components'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { InputEmoteInjector, RedactorsService } from '../../services'
import { createEmotePickerButton } from '../../templates'
import {
	findDynamicChild,
	findDynamicChildren,
	findDynamicClosest,
	getCaretPosition,
	hasDynamicClass,
	injectEmotesIntoDom,
} from '../../utils'
import {
	CommentEditorClosedMutationHandler,
	CommentEditorMutationHandler,
	CommentsExpandMutationHandler,
	CommentsRenderMutationHandler,
	EmotePickerButtonMutationHandler,
	FeedLoadMutationHandler,
	FeedRerenderMutationHandler,
	LayoutChangeMutationHandler,
	PostExpandMutationHandler,
	PostSubscriptionBlockHeadingUpdateHandler,
} from '../channel-page/mutation-handlers'
import { PageController } from '../page.controller.ts'
import { MainPageEmoteAutocompletionContextResolver } from './main-page-emote-autocompletion-context.resolver.ts'
import { MainPageEmotePickerContextResolver } from './main-page-emote-picker-context.resolver.ts'

const EVENTS = ['input', 'keyup', 'click', 'mousedown']
const VALID_NAME_REGEX = /^[\d_a-z]+$/

export interface MainPageControllerOptions extends PageControllerOptions {
	channelsService: ChannelsService
	boostyApiClient: BoostyApiClient
}

export class MainPageController extends PageController<MainPageControllerOptions> {
	private readonly _injectionEmoteContextCache: Map<ChannelContext, EmoteContext<ThirdPartyEmote>> = new Map()
	private readonly _componentsEmoteContextCache: Map<ChannelContext, EmoteContext> = new Map()
	private readonly _seenIgnoredDisplayNames: Set<string> = new Set()

	private readonly _redactorsState = new RedactorsService()

	protected override readonly _logger = createAppLogger('MainPageController')

	protected _globalInjectionEmoteContext: EmoteContext<ThirdPartyEmote> | null = null
	protected _globalComponentsEmoteContext: EmoteContext | null = null

	protected _emotePickerManager: EmotePickerManager | null = null
	protected _emoteAutocompletionManager: EmoteAutocompletionManager | null = null

	constructor(options: MainPageControllerOptions) {
		super(options)

		this._bindEvents()
	}

	public async init(): Promise<void> {
		await super.init()

		this._globalInjectionEmoteContext = new EmoteContext<ThirdPartyEmote>(
			[this._options.globalEmoteService],
			this._options.globalFavoriteEmoteService,
		)

		this._globalComponentsEmoteContext = new EmoteContext<Emote>(
			[this._boostyEmoteService, this._options.globalEmoteService],
			this._options.globalFavoriteEmoteService,
		)

		const inputEmoteInjector = new InputEmoteInjector(this._redactorsState)

		this._emotePickerManager = new EmotePickerManager({
			$root: this.$root,
			inputEmoteInjector,
			contextResolver: new MainPageEmotePickerContextResolver(
				[BOOSTY_SELECTORS.comments.publisher, BOOSTY_SELECTORS.publisher.root],
				'default',
				this._resolveEmoteContextForComponentsFromPostRoot,
			),
		})

		this._emoteAutocompletionManager = new EmoteAutocompletionManager({
			$root: this.$root,
			inputEmoteInjector,
			contextResolver: new MainPageEmoteAutocompletionContextResolver(
				[BOOSTY_SELECTORS.comments.publisher, BOOSTY_SELECTORS.publisher.root],
				'default',
				this._resolveEmoteContextForComponentsFromPostRoot,
			),
		})

		this._initMutationHandlers()
		this._mutationObserverService.start()

		if (document.readyState === 'loading')
			document.addEventListener('DOMContentLoaded', () => this._processPage(), { once: true })

		this._processPage()

		this._logger.debug('Initialized')
	}

	public override async destroy(): Promise<void> {
		await super.destroy()

		this._unbindEvents()

		if (this._globalInjectionEmoteContext) {
			this._globalInjectionEmoteContext.destroy()
			this._globalInjectionEmoteContext = null
		}

		if (this._globalComponentsEmoteContext) {
			this._globalComponentsEmoteContext.destroy()
			this._globalComponentsEmoteContext = null
		}

		for (const cached of this._injectionEmoteContextCache.values())
			cached.destroy()

		for (const cached of this._componentsEmoteContextCache.values())
			cached.destroy()

		this._injectionEmoteContextCache.clear()
		this._componentsEmoteContextCache.clear()

		if (this._emotePickerManager) {
			this._emotePickerManager.destroy()
			this._emotePickerManager = null
		}

		if (this._emoteAutocompletionManager) {
			this._emoteAutocompletionManager.destroy()
			this._emoteAutocompletionManager = null
		}
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

	protected override _processPage(): void {
		const posts = findDynamicChildren(this.$root, BOOSTY_SELECTORS.posts.feedItemWrap)

		for (const post of posts)
			this._processPost(post).catch(err => this._logger.error('Failed to process post', post, err))
	}

	protected override _initMutationHandlers(): void {
		this._mutationObserverService.register(
			new CommentsRenderMutationHandler(this._logger, (el: Element) => void this._processComment(el)),
		)

		this._mutationObserverService.register(
			new CommentsExpandMutationHandler(this._logger, (el: Element) => void this._processComment(el)),
		)

		this._mutationObserverService.register(
			new FeedLoadMutationHandler(this._logger, (el: Element) => void this._processPost(el)),
		)

		this._mutationObserverService.register(
			new FeedRerenderMutationHandler(this._logger, (el: Element) => void this._processPost(el)),
		)

		this._mutationObserverService.register(
			new PostSubscriptionBlockHeadingUpdateHandler(this._logger, (el: Element) => void this._processPostContent(el)),
		)

		this._mutationObserverService.register(
			new PostExpandMutationHandler(this._logger, (el: Element) => void this._processPostContent(el)),
		)

		this._mutationObserverService.register(
			new LayoutChangeMutationHandler(this._logger, () => this._processPage()),
		)

		this._mutationObserverService.register(new EmotePickerButtonMutationHandler(this._logger))

		this._mutationObserverService.register(
			new CommentEditorMutationHandler(this._logger, (el: HTMLElement) => this._processCommentEditor(el)),
		)

		this._mutationObserverService.register(
			new CommentEditorClosedMutationHandler(this._logger, (el: HTMLElement) =>
				void this._processCommentEditorClosed(el)),
		)
	}

	private async _processPost(el: Element): Promise<void> {
		const postRoot = this._getPostRootFromInsidePost(el)

		if (!postRoot)
			return

		try {
			const emoteContext = await this._resolveEmoteContextFromPostRoot(postRoot)

			const smileBtn = findDynamicChild<HTMLButtonElement>(postRoot, BOOSTY_SELECTORS.ui.smileButton)

			if (smileBtn)
				smileBtn.replaceWith(createEmotePickerButton())

			const content = findDynamicChild(postRoot, BOOSTY_SELECTORS.posts.content)

			if (content)
				this._injectEmotesIntoPostContent(content, emoteContext)

			const comments = findDynamicChildren(postRoot, BOOSTY_SELECTORS.comments.content)

			for (const comment of comments)
				this._injectEmotesIntoComment(comment, emoteContext)
		}
		catch (err) {
			this._logger.error('Failed to process post', postRoot, err)
		}
	}

	private async _processPostContent(el: Element): Promise<void> {
		const postRoot = this._getPostRootFromInsidePost(el)

		if (!postRoot)
			return

		try {
			const emoteContext = await this._resolveEmoteContextFromPostRoot(postRoot)
			this._injectEmotesIntoPostContent(el, emoteContext)
		}
		catch (err) {
			this._logger.error('Failed to process comment', el, err)
		}
	}

	private async _processComment(el: Element): Promise<void> {
		const postRoot = this._getPostRootFromInsidePost(el)

		if (!postRoot)
			return

		try {
			const emoteContext = await this._resolveEmoteContextFromPostRoot(postRoot)
			this._injectEmotesIntoComment(el, emoteContext)
		}
		catch (err) {
			this._logger.error('Failed to process comment', el, err)
		}
	}

	private _processCommentEditor(el: HTMLElement): void {
		const smileBtn = findDynamicChild(el, BOOSTY_SELECTORS.ui.smileButton)

		if (smileBtn instanceof HTMLButtonElement)
			smileBtn.replaceWith(createEmotePickerButton())
	}

	private async _processCommentEditorClosed(el: HTMLElement): Promise<void> {
		const postRoot = this._getPostRootFromInsidePost(el)

		if (!postRoot)
			return

		try {
			const content = findDynamicChild(el, BOOSTY_SELECTORS.comments.content)

			if (content) {
				const emoteContext = await this._resolveEmoteContextFromPostRoot(postRoot)
				this._injectEmotesIntoComment(content, emoteContext)
			}
		}
		catch (err) {
			this._logger.error('Failed to process comment editor close', el, err)
		}
	}

	private _getPostRootFromInsidePost(el: Element): HTMLElement | null {
		return findDynamicClosest<HTMLElement>(el, BOOSTY_SELECTORS.posts.feedItemWrap)
	}

	private async _resolveChannelContextFromInsidePost(el: Element): Promise<ChannelContext | null> {
		const postRoot = this._getPostRootFromInsidePost(el)

		if (!postRoot)
			return null

		const authorDisplayName = findDynamicChild(postRoot, BOOSTY_SELECTORS.posts.postHeaderWithAuthor)?.textContent.trim()

		if (!authorDisplayName) {
			this._logger.warn('Failed to resolve author display name')

			return null
		}

		if (this._seenIgnoredDisplayNames.has(authorDisplayName))
			return null

		const contextByDisplayName = await this._options.channelsService.getOrCreateByAlias(authorDisplayName)

		if (contextByDisplayName)
			return contextByDisplayName

		const ignoredUser = await storage.ignoredUsers.getIgnoredUserByDisplayName(authorDisplayName)

		if (ignoredUser)
			return null

		const userByDisplayName = await storage.users.getByBoostyDisplayName(authorDisplayName)

		if (userByDisplayName) {
			const context = await this._options.channelsService.getOrCreate(userByDisplayName.twitchProfile.id)
			// eslint-disable-next-line ts/no-non-null-assertion
			this._options.channelsService.addAlias(userByDisplayName.boostyProfile.displayName!, userByDisplayName.twitchProfile.id)

			return context
		}

		const maybeName = authorDisplayName.toLowerCase().replaceAll(/\s+/g, '')

		if (!VALID_NAME_REGEX.test(maybeName)) {
			this._seenIgnoredDisplayNames.add(authorDisplayName)

			return null
		}

		this._logger.debug(`Trying to retrieve Boosty user candidate "${maybeName}" (@${authorDisplayName})`)

		const boostyUser = await this._options.boostyApiClient.getUser(maybeName)

		if (!boostyUser) {
			this._logger.debug(`Candidate Boosty user "${maybeName}" not found (@${authorDisplayName})`)

			this._seenIgnoredDisplayNames.add(authorDisplayName)

			return null
		}

		this._logger.info(`Boosty user @${boostyUser.blogUrl} found for display name "${authorDisplayName}"`)

		const username = boostyUser.blogUrl
		const user = await storage.users.getByBoostyName(username)

		if (!user) {
			await storage.ignoredUsers.addIgnoredUser({
				id: boostyUser.owner.id,
				name: boostyUser.blogUrl,
				displayName: boostyUser.owner.name,
			})

			this._seenIgnoredDisplayNames.add(authorDisplayName)

			return null
		}

		const promises: Promise<void>[] = [storage.ignoredUsers.removeIgnoredUserByName(boostyUser.blogUrl)]

		if (!user.boostyProfile.id || user.boostyProfile.displayName !== boostyUser.owner.name) {
			promises.push(
				storage.users.setBoostyProfileData(
					user.twitchProfile.id,
					{ id: boostyUser.owner.id, displayName: boostyUser.owner.name },
				),
			)
		}

		await Promise.all(promises)

		const userId = user.twitchProfile.id

		const context = await this._options.channelsService.getOrCreate(userId)
		this._options.channelsService.addAlias(user.boostyProfile.name, userId)
		this._options.channelsService.addAlias(boostyUser.owner.name, userId)

		return context
	}

	private async _resolveEmoteContextFromPostRoot(postRoot: HTMLElement): Promise<EmoteContext<ThirdPartyEmote>> {
		const channelContext = await this._resolveChannelContextFromInsidePost(postRoot)

		if (!channelContext) {
			if (!this._globalInjectionEmoteContext)
				throw new Error('Global injection context is not initialized')

			return this._globalInjectionEmoteContext
		}

		const cached = this._injectionEmoteContextCache.get(channelContext)

		if (cached)
			return cached

		const emoteContext = new EmoteContext<ThirdPartyEmote>(
			[this._options.globalEmoteService, channelContext.emoteService],
			new CompositeFavoriteEmotesService(this._options.globalFavoriteEmoteService, channelContext.favoriteEmotesService),
		)

		this._injectionEmoteContextCache.set(channelContext, emoteContext)

		return emoteContext
	}

	private readonly _resolveEmoteContextForComponentsFromPostRoot = async (el: HTMLElement): Promise<EmoteContext> => {
		const channelContext = await this._resolveChannelContextFromInsidePost(el)

		if (!channelContext) {
			if (!this._globalComponentsEmoteContext)
				throw new Error('Global components context is not initialized')

			return this._globalComponentsEmoteContext
		}

		const cached = this._componentsEmoteContextCache.get(channelContext)

		if (cached)
			return cached

		const emoteContext = new EmoteContext<Emote>(
			[this._boostyEmoteService, this._options.globalEmoteService, channelContext.emoteService],
			new CompositeFavoriteEmotesService(
				this._options.globalFavoriteEmoteService,
				channelContext.favoriteEmotesService,
			),
		)

		this._componentsEmoteContextCache.set(channelContext, emoteContext)

		return emoteContext
	}

	private _injectEmotesIntoPostContent(node: Node, context: EmoteContext<ThirdPartyEmote>): void {
		injectEmotesIntoDom(
			node,
			context,
			(child: Node) =>
				!(
					hasDynamicClass(child, BOOSTY_SELECTORS.trash.trackingPixel)
					|| hasDynamicClass(child, BOOSTY_SELECTORS.trash.iframe)
				),
		)
	}

	private _injectEmotesIntoComment(node: Node, context: EmoteContext<ThirdPartyEmote>): void {
		injectEmotesIntoDom(node, context, (child: Node) => !hasDynamicClass(child, BOOSTY_SELECTORS.trash.attachedImage))
	}

	private _updateRedactorCaretPosition(element: Element): void {
		const redactor = element.closest(`.${BOOSTY_SELECTORS.publisher.redactor}`)

		if (!(redactor instanceof HTMLElement))
			return

		const caretPosition = getCaretPosition(element)
		this._redactorsState.set(redactor, caretPosition)
	}

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

		if (!(target instanceof HTMLElement))
			return

		const emoteBox = target.closest<HTMLButtonElement>('button[data-action="page-emote-click"]')

		if (!emoteBox)
			return

		evt.stopPropagation()
		evt.preventDefault()

		const { provider, id, scope } = emoteBox.dataset

		if (!provider || !id || !scope)
			return

		const postRoot = this._getPostRootFromInsidePost(emoteBox)

		if (!postRoot)
			return

		this._resolveEmoteContextFromPostRoot(postRoot).then((emoteContext: EmoteContext<ThirdPartyEmote>) => {
			const emote = emoteContext.findById(
				provider as ThirdPartyEmoteProvider,
				id,
				scope as EmoteScope,
			)

			if (!emote)
				return

			if (evt.ctrlKey || evt.altKey) {
				this._handleFavoriteEmoteToggle(emote, emoteBox, emoteContext).catch(err =>
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
		}).catch(err => this._logger.error(err))
	}

	private async _handleFavoriteEmoteToggle(
		emote: ThirdPartyEmote,
		emoteBox: HTMLButtonElement,
		emoteContext: EmoteContext<ThirdPartyEmote>,
	): Promise<void> {
		const isFavorite = emoteContext.favorites.isFavorite(emote)

		await (isFavorite
			? emoteContext.favorites.remove(emote)
			: emoteContext.favorites.add(emote))

		const isFavoriteNow = !isFavorite
		emoteBox.dataset.isFavorite = isFavoriteNow ? 'true' : ''
		await this._emoteTooltip.updateTooltipEmoteData({ isFavorite: isFavoriteNow })
	}
}
