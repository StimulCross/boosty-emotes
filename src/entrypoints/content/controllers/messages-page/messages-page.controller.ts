import type { Emote } from '@shared/models'
import type { FavoriteEmotesService } from '@shared/services'
import type { EmoteAutocompletionContextResolver, EmotePickerContextResolver } from '../../components'
import type { ChannelContext } from '../../services'
import type { SingleUserPageControllerOptions } from '../common'
import { EmoteContext } from '@shared/emote-context'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_PROFILE_UPDATE_INTERVAL_MS, BOOSTY_SELECTORS } from '../../constants.ts'
import { createEmotePickerButton } from '../../templates'
import { findDynamicChild, findDynamicChildren, hasDynamicClass } from '../../utils'
import {
	SingleUserPageController,
	SingleUserPageEmoteAutocompletionContextResolver,
	SingleUserPageEmotePickerContextResolver,
} from '../common'
import {
	DialogMessageAddedMutationHandler,
	DialogMessagesScrollContainerUpdatedMutationHandler,
	DialogMessagesUpdatedMutationHandler,
} from './mutation-handlers'

export interface MessagesPageControllerOptions extends SingleUserPageControllerOptions {
	dialogId: string
}

export class MessagesPageController extends SingleUserPageController<MessagesPageControllerOptions> {
	protected override readonly _logger = createAppLogger('MessagesPageController')
	private readonly _dialogId: string

	constructor(options: MessagesPageControllerOptions) {
		super(options)

		this._dialogId = options.dialogId
	}

	public override async destroy(): Promise<void> {
		await super.destroy()
		this._options.channelsService.removeAlias(this._dialogId)
	}

	protected override async _resolveChannelContext(): Promise<ChannelContext | null> {
		const contextByDialogId = await this._options.channelsService.getOrCreateByAlias(this._dialogId)

		if (contextByDialogId) {
			this._logger.debug('Found context by dialog id')

			return contextByDialogId
		}

		const displayName = this._extractAuthorDisplayName()

		if (displayName) {
			const ignoredUser = await storage.ignoredUsers.getIgnoredUserByDisplayName(displayName)

			if (ignoredUser)
				return null

			const contextByBoostyDisplayName = await this._options.channelsService.getOrCreateByAlias(displayName)

			if (contextByBoostyDisplayName) {
				this._logger.debug('Found context by Boosty display name')
				this._options.channelsService.addAlias(this._dialogId, contextByBoostyDisplayName.userId)

				return contextByBoostyDisplayName
			}

			const user = await storage.users.getByBoostyDisplayName(displayName)

			if (user) {
				const twitchUserId = user.twitchProfile.id
				const context = await this._options.channelsService.getOrCreate(twitchUserId)

				this._logger.debug('Found context by local Boosty display name')

				this._options.channelsService.addAlias(this._dialogId, twitchUserId)
				this._options.channelsService.addAlias(displayName, twitchUserId)

				return context
			}
		}
		else {
			this._logger.debug('Could not find boosty username from dialog header')
		}

		const dialog = await this._boostyApiClient.getDialog(this._dialogId)

		if (!dialog)
			return null

		this._logger.debug('Fetched dialog from API', dialog)

		const user = await storage.users.getByBoostyName(dialog.chatmate.url)

		if (!user) {
			await storage.ignoredUsers.addIgnoredUser({
				id: dialog.chatmate.id,
				name: dialog.chatmate.url,
				displayName: dialog.chatmate.name,
			})

			return null
		}

		const { boostyProfile, twitchProfile } = user

		const promises: Promise<void>[] = [storage.ignoredUsers.removeIgnoredUserByName(boostyProfile.name)]

		if (!boostyProfile.id || boostyProfile.displayName !== dialog.chatmate.name) {
			promises.push(
				storage.users.setBoostyProfileData(twitchProfile.id, {
					id: dialog.chatmate.id,
					displayName: dialog.chatmate.name,
				}),
			)

			this._logger.info('Boosty profile was updated', user)
		}

		await Promise.all(promises)

		const twitchUserId = twitchProfile.id
		const context = await this._options.channelsService.getOrCreate(twitchUserId)

		this._options.channelsService.addAlias(this._dialogId, twitchUserId)
		this._options.channelsService.addAlias(dialog.chatmate.name, twitchUserId)

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

	protected override async _checkBoostyProfile(): Promise<void> {
		const displayName = this._extractAuthorDisplayName()

		if (!displayName)
			return

		const user = await storage.users.getByBoostyDisplayName(displayName)

		if (!user)
			return

		const { boostyProfile, twitchProfile, state } = user

		let shouldUpdateFromApi = false

		if (!boostyProfile.id || displayName !== boostyProfile.displayName)
			shouldUpdateFromApi = true

		if (Date.now() > state.boostyProfileUpdatedAt + BOOSTY_PROFILE_UPDATE_INTERVAL_MS)
			shouldUpdateFromApi = true

		if (shouldUpdateFromApi) {
			const dialog = await this._boostyApiClient.getDialog(this._dialogId)

			if (!dialog) {
				this._logger.error('Could not fetch dialog from API')

				return
			}

			await storage.users.setBoostyProfileData(twitchProfile.id, {
				id: dialog.chatmate.id,
				displayName: dialog.chatmate.name,
			})

			this._logger.info('Boosty profile was updated', user)
		}
	}

	protected override _createEmotePickerContextResolver(emoteContext: EmoteContext): EmotePickerContextResolver {
		return new SingleUserPageEmotePickerContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.messages.publisher],
			'messages',
		)
	}

	protected override _createEmoteAutocompletionContextResolver(
		emoteContext: EmoteContext,
	): EmoteAutocompletionContextResolver {
		return new SingleUserPageEmoteAutocompletionContextResolver(
			emoteContext,
			[BOOSTY_SELECTORS.messages.publisher],
			'default',
		)
	}

	protected override _initMutationHandlers(): void {
		this._mutationObserverService.register(
			new DialogMessageAddedMutationHandler(this._logger, (el: Element) =>
				this._injectEmotesToChat(el as HTMLElement)),
		)

		this._mutationObserverService.register(
			new DialogMessagesScrollContainerUpdatedMutationHandler(this._logger, (el: Element) =>
				this._injectEmotesToChat(el as HTMLElement)),
		)

		this._mutationObserverService.register(
			new DialogMessagesUpdatedMutationHandler(this._logger, (el: Element) =>
				this._injectEmotesToChat(el as HTMLElement)),
		)
	}

	protected override _processPage(): void {
		const smileBtn = findDynamicChild(this.$root, BOOSTY_SELECTORS.ui.smileButton)

		if (smileBtn)
			smileBtn.replaceWith(createEmotePickerButton())

		this._injectEmotesToChat(this.$root)
	}

	private _extractAuthorDisplayName(): string | null {
		const displayNameNode = findDynamicChild(this.$root, BOOSTY_SELECTORS.ui.username)

		if (!displayNameNode?.textContent)
			return null

		return displayNameNode.textContent.trim()
	}

	private _injectEmotesToChat(el: HTMLElement): void {
		const messageContainers = findDynamicChildren(el, BOOSTY_SELECTORS.messages.messageContent)

		// eslint-disable-next-line no-labels
		messagesLoop: for (const messageContainer of messageContainers) {
			for (const child of messageContainer.children) {
				if (hasDynamicClass(child, BOOSTY_SELECTORS.messages.deletedMessage)) {
					// eslint-disable-next-line no-labels
					continue messagesLoop
				}

				this._injectEmotesToMessage(child as HTMLElement)
			}
		}
	}

	private _injectEmotesToMessage(el: HTMLElement): void {
		this._injectEmotes(el, child => hasDynamicClass(child, BOOSTY_SELECTORS.ui.blockRenderer))
	}
}
