import type { Emote } from '@shared/models'
import type { FavoriteEmotesService } from '@shared/services'
import type { EmoteAutocompletionContextResolver, EmotePickerContextResolver } from '../../components'
import type { ChannelContext } from '../../services'
import { EmoteContext } from '@shared/emote-context'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { createEmotePickerButton } from '../../templates'
import { findDynamicChild, findDynamicChildren, hasDynamicClass } from '../../utils'
import {
	ChatMessageMutationHandler,
	ChatMessageTextMutationHandler,
	ChatTooltipMutationHandler,
	NamedSingleUserPageController,
	SingleUserPageEmoteAutocompletionContextResolver,
} from '../common'
import {
	AboutSectionMutationHandler,
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
	SubscriptionDescriptionMutationHandler,
	TargetCardMutationHandler,
} from './mutation-handlers'

export class ChannelPageController extends NamedSingleUserPageController {
	protected override readonly _logger = createAppLogger('ChannelPageController')

	protected override async _resolveChannelContext(): Promise<ChannelContext | null> {
		const lowerName = this._options.username.toLowerCase()

		const contextByName = await this._options.channelsService.getOrCreateByAlias(lowerName)

		if (contextByName)
			return contextByName

		const user = await storage.users.getByBoostyName(lowerName)

		if (!user)
			return null

		const twitchUserId = user.twitchProfile.id

		const context = await this._options.channelsService.getOrCreate(twitchUserId)
		this._options.channelsService.addAlias(lowerName, twitchUserId)

		return context
	}

	protected override _createComponentEmoteContext(
		favoriteEmotesService: FavoriteEmotesService,
		channelContext?: ChannelContext,
	): EmoteContext {
		return new EmoteContext<Emote>(
			[
				this._boostyEmoteService,
				this._options.globalEmoteService,
				...(channelContext ? [channelContext.emoteService] : []),
			],
			favoriteEmotesService,
		)
	}

	protected override _createEmotePickerContextResolver(emoteContext: EmoteContext): EmotePickerContextResolver {
		return new SingleUserPageEmoteAutocompletionContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.comments.publisher, BOOSTY_SELECTORS.chat.publisher, BOOSTY_SELECTORS.publisher.root],
			'default',
		)
	}

	protected override _createEmoteAutocompletionContextResolver(
		emoteContext: EmoteContext,
	): EmoteAutocompletionContextResolver {
		return new SingleUserPageEmoteAutocompletionContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.comments.publisher, BOOSTY_SELECTORS.chat.publisher, BOOSTY_SELECTORS.publisher.root],
			'default',
		)
	}

	protected override _extractAuthorDisplayName(): string | null {
		const displayNameNode = findDynamicChild(this.$root, BOOSTY_SELECTORS.ui.username)

		if (!displayNameNode?.textContent)
			return null

		return displayNameNode.textContent.trim()
	}

	protected override _initMutationHandlers(): void {
		this._mutationObserverService.register(
			new CommentsRenderMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoComment(el)),
		)

		this._mutationObserverService.register(
			new CommentsExpandMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoComment(el)),
		)

		this._mutationObserverService.register(
			new FeedLoadMutationHandler(this._logger, (el: Element) => this._processPost(el)),
		)

		this._mutationObserverService.register(
			new FeedRerenderMutationHandler(this._logger, (el: Element) => this._processPost(el)),
		)

		this._mutationObserverService.register(
			new PostSubscriptionBlockHeadingUpdateHandler(this._logger, (el: Node) => this._injectEmotesIntoPostContent(el)),
		)

		this._mutationObserverService.register(
			new PostExpandMutationHandler(this._logger, (el: Node) => this._injectEmotesIntoPostContent(el)),
		)

		this._mutationObserverService.register(
			new LayoutChangeMutationHandler(this._logger, () => this._processPage()),
		)

		this._mutationObserverService.register(
			new SubscriptionDescriptionMutationHandler(this._logger, (el: Element) => this._injectEmotes(el)),
		)

		this._mutationObserverService.register(
			new AboutSectionMutationHandler(this._logger, (el: Node) => this._injectEmotes(el)),
		)

		this._mutationObserverService.register(
			new TargetCardMutationHandler(this._logger, (el: Element) => this._injectEmotes(el)),
		)

		this._mutationObserverService.register(
			new ChatMessageMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoChatMessage(el)),
		)

		this._mutationObserverService.register(new ChatTooltipMutationHandler(this._logger))

		this._mutationObserverService.register(
			new ChatMessageTextMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoChatMessage(el)),
		)

		this._mutationObserverService.register(new EmotePickerButtonMutationHandler(this._logger))

		this._mutationObserverService.register(
			new CommentEditorMutationHandler(this._logger, (el: HTMLElement) => this._processCommentEditor(el)),
		)

		this._mutationObserverService.register(
			new CommentEditorClosedMutationHandler(this._logger, (el: HTMLElement) =>
				this._processCommentEditorClosed(el)),
		)
	}

	protected override _processPage(): void {
		const aboutContent = findDynamicChild(this.$root, BOOSTY_SELECTORS.about.content)

		if (aboutContent)
			this._injectEmotes(aboutContent)

		const feed = findDynamicChild(this.$root, BOOSTY_SELECTORS.posts.feed)

		if (feed) {
			const posts = findDynamicChildren(feed, BOOSTY_SELECTORS.posts.feedItemWrap)

			for (const post of posts)
				this._processPost(post)
		}

		const targets = findDynamicChildren(this.$root, BOOSTY_SELECTORS.targets.itemDescription)

		for (const target of targets)
			this._injectEmotes(target)

		const subscriptions = findDynamicChildren(this.$root, BOOSTY_SELECTORS.subscriptions.itemDescription)

		for (const subscription of subscriptions) {
			if (subscription.firstChild)
				this._injectEmotes(subscription.firstChild)
		}
	}

	private _processPost(post: Element): void {
		if (post instanceof HTMLElement) {
			const content = findDynamicChild(post, BOOSTY_SELECTORS.posts.content)

			if (content)
				this._injectEmotesIntoPostContent(content)

			const smileBtn = findDynamicChild(post, BOOSTY_SELECTORS.ui.smileButton)

			if (smileBtn instanceof HTMLButtonElement)
				smileBtn.replaceWith(createEmotePickerButton())

			const comments = findDynamicChildren(post, BOOSTY_SELECTORS.comments.content)

			for (const comment of comments)
				this._injectEmotesIntoComment(comment)
		}
	}

	private _injectEmotesIntoPostContent(node: Node): void {
		this._injectEmotes(
			node,
			(child: Node) =>
				!(
					hasDynamicClass(child, BOOSTY_SELECTORS.trash.trackingPixel)
					|| hasDynamicClass(child, BOOSTY_SELECTORS.trash.iframe)
				),
		)
	}

	private _injectEmotesIntoComment(node: Node): void {
		this._injectEmotes(node, (child: Node) => !hasDynamicClass(child, BOOSTY_SELECTORS.trash.attachedImage))
	}

	private _injectEmotesIntoChatMessage(node: Node): void {
		this._injectEmotes(
			node,
			child => !(child instanceof HTMLDivElement && hasDynamicClass(child, BOOSTY_SELECTORS.chat.tooltip)),
		)
	}

	private _processCommentEditor(el: HTMLElement): void {
		const smileBtn = findDynamicChild(el, BOOSTY_SELECTORS.ui.smileButton)

		if (smileBtn instanceof HTMLButtonElement)
			smileBtn.replaceWith(createEmotePickerButton())
	}

	private _processCommentEditorClosed(el: HTMLElement): void {
		const content = findDynamicChild(el, BOOSTY_SELECTORS.comments.content)

		if (content)
			this._injectEmotesIntoComment(content)
	}
}
