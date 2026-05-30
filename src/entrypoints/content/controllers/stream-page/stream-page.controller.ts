import type { Emote } from '@shared/models'
import type { FavoriteEmotesService } from '@shared/services'
import type { EmoteAutocompletionContextResolver, EmotePickerContextResolver } from '../../components'
import type { ChannelContext } from '../../services'
import type { SingleUserPageControllerOptions } from '../common'
import { EmoteContext } from '@shared/emote-context'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { createEmotePickerButton } from '../../templates'
import { findDynamicChild, findDynamicChildren, hasDynamicClass } from '../../utils'
import {
	ChatBoxRootChangeMutationHandler,
	ChatMessageMutationHandler,
	ChatMessageTextMutationHandler,
	ChatTooltipMutationHandler,
	NamedSingleUserPageController,
	SingleUserPageEmoteAutocompletionContextResolver,
	SingleUserPageEmotePickerContextResolver,
	StreamChatChangeMutationHandler,
	StreamLayoutChangeMutationHandler,
} from '../common'

export interface StreamPageControllerOptions extends SingleUserPageControllerOptions {
	username: string
}

export class StreamPageController extends NamedSingleUserPageController<StreamPageControllerOptions> {
	protected override readonly _logger = createAppLogger('StreamPageController')

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
		return new SingleUserPageEmotePickerContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.chat.publisher],
			'stream-chat',
		)
	}

	protected override _createEmoteAutocompletionContextResolver(
		emoteContext: EmoteContext,
	): EmoteAutocompletionContextResolver {
		return new SingleUserPageEmoteAutocompletionContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.chat.publisher],
			'stream-chat',
		)
	}

	protected override _extractAuthorDisplayName(): string | null {
		const displayNameNode = findDynamicChild(this.$root, BOOSTY_SELECTORS.stream.authorName)

		if (!displayNameNode?.textContent)
			return null

		return displayNameNode.textContent.trim()
	}

	protected override _initMutationHandlers(): void {
		this._mutationObserverService.register(
			new ChatMessageMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoChatMessage(el)),
		)

		this._mutationObserverService.register(new ChatTooltipMutationHandler(this._logger))

		this._mutationObserverService.register(
			new ChatMessageTextMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoChatMessage(el)),
		)

		this._mutationObserverService.register(
			new StreamLayoutChangeMutationHandler(this._logger, (el: Element) => this._injectEmotes(el)),
		)

		this._mutationObserverService.register(new StreamChatChangeMutationHandler(this._logger))

		this._mutationObserverService.register(
			new ChatBoxRootChangeMutationHandler(this._logger, (el: Element) => this._injectEmotesIntoChatMessage(el)),
		)
	}

	protected override _processPage(): void {
		const emotePickerBtn = findDynamicChild(this.$root, BOOSTY_SELECTORS.ui.smileButton)

		if (emotePickerBtn)
			emotePickerBtn.replaceWith(createEmotePickerButton())

		const description = findDynamicChild(this.$root, BOOSTY_SELECTORS.stream.description)

		if (description)
			this._injectEmotes(description)

		const messages = findDynamicChildren(this.$root, BOOSTY_SELECTORS.chat.text)

		for (const message of messages)
			this._injectEmotesIntoChatMessage(message)
	}

	private _injectEmotesIntoChatMessage(node: Node): void {
		this._injectEmotes(
			node,
			child => !(child instanceof HTMLDivElement && hasDynamicClass(child, BOOSTY_SELECTORS.chat.tooltip)),
		)
	}
}
