import type { Emote } from '@shared/models'
import type { FavoriteEmotesService } from '@shared/services'
import type { EmoteAutocompletionContextResolver, EmotePickerContextResolver } from '../../components'
import type { ChannelContext } from '../../services'
import type { NamedSingleUserPageControllerOptions } from '../common'
import { EmoteContext } from '@shared/emote-context'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { createActionButtons } from '../../templates'
import { findDynamicChild, hasDynamicClass } from '../../utils'
import { NamedSingleUserPageController } from '../common'
import { BlogPostChangeUpdateMutationHandler, MiniRichEditorUpdateMutationHandler } from './mutation-handlers'
import { PostEditorPageEmoteAutocompletionContextResolver } from './post-editor-page-emote-autocompletion-context.resolver.ts'
import { PostEditorPageEmotePickerContextResolver } from './post-editor-page-emote-picker-context.resolver.ts'

export interface NewPostPageControllerOptions extends NamedSingleUserPageControllerOptions {
}

export class PostEditorPageController extends NamedSingleUserPageController<NewPostPageControllerOptions> {
	protected override readonly _logger = createAppLogger('PostEditorPageController')

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

	protected override _createComponentEmoteContext(favoriteEmotesService: FavoriteEmotesService, channelContext?: ChannelContext): EmoteContext {
		return new EmoteContext<Emote>(
			[
				this._options.globalEmoteService,
				...(channelContext ? [channelContext.emoteService] : []),
			],
			favoriteEmotesService,
		)
	}

	protected override _createEmotePickerContextResolver(emoteContext: EmoteContext): EmotePickerContextResolver {
		return new PostEditorPageEmotePickerContextResolver(emoteContext)
	}

	protected override _createEmoteAutocompletionContextResolver(emoteContext: EmoteContext): EmoteAutocompletionContextResolver {
		return new PostEditorPageEmoteAutocompletionContextResolver(emoteContext)
	}

	protected override _processPage(): void {
		this._processPostForm(this.$root)
		this._processTeaserForm(this.$root)
	}

	private _processPostForm(el: Element): void {
		const postEditor = findDynamicChild(el, BOOSTY_SELECTORS.posts.newPostEditor)

		if (postEditor)
			postEditor.append(createActionButtons())
	}

	private _processTeaserForm(el: Element): void {
		const teaserEditor = hasDynamicClass(el, BOOSTY_SELECTORS.posts.miniRichEditor) ? el : findDynamicChild(el, BOOSTY_SELECTORS.posts.miniRichEditor)

		if (!teaserEditor)
			return

		const existingButtons = [...teaserEditor.children]
			.filter(btn => btn instanceof HTMLButtonElement && btn.dataset.action === 'toggle-emote-picker')

		this._logger.success(teaserEditor)

		for (const button of existingButtons) {
			button.remove()
		}

		teaserEditor.append(createActionButtons())
	}

	protected override _initMutationHandlers(): void {
		this._mutationObserverService.register(
			new BlogPostChangeUpdateMutationHandler(this._logger, (el: Element) => this._processPostForm(el)),
		)

		this._mutationObserverService.register(
			new MiniRichEditorUpdateMutationHandler(this._logger, (el: Element) => this._processTeaserForm(el)),
		)
	}
}
