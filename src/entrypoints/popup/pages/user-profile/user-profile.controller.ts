import type { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import type { Controller } from '@shared/ui'
import { EmoteContext } from '@shared/emote-context'
import { ChannelEmoteService, ChannelFavoriteEmotesService } from '@shared/services'
import { storage } from '@shared/storage'
import { EmoteTooltipManager } from '@shared/ui/tooltip/emote-tooltip'
import { EmotesController } from '../../shared/components/emotes'
import tooltipThemeStyles from '../../shared/styles/tooltip-theme.module.css'
import { UserProfileHeaderController } from './components'
import { UserProfileView } from './user-profile.view.ts'

export interface UserProfilePageOptions {
	userId: string
	messageReceiver: MessageReceiver
	messageDispatcher: MessageDispatcher
}

export class UserProfileController implements Controller {
	private readonly _view = new UserProfileView()
	private readonly _userProfileHeaderController = new UserProfileHeaderController()
	private readonly _emotesController = new EmotesController('channel')

	private _emotesService: ChannelEmoteService | null = null
	private _favoriteEmotesService: ChannelFavoriteEmotesService | null = null
	private _tooltip: EmoteTooltipManager | null = null

	private _isMounted = false

	constructor(private readonly _options: UserProfilePageOptions) {}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._tooltip = new EmoteTooltipManager(this._view.$root, tooltipThemeStyles.tooltipTheme)
		this._userProfileHeaderController.mount(this._view.headerSlot)
		this._emotesController.mount(this._view.emotesSlot)

		this._view.mount(container)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._userProfileHeaderController.unmount()
		this._emotesController.unmount()

		this._emotesService?.destroy()
		this._emotesService = null

		this._favoriteEmotesService?.destroy()
		this._favoriteEmotesService = null

		this._tooltip?.destroy()
		this._tooltip = null

		this._view.unmount()

		this._isMounted = false
	}

	public async init(): Promise<void> {
		const user = await storage.users.getByTwitchId(this._options.userId)

		if (!user)
			throw new Error(`User with id "${this._options.userId}" not found`)

		this._userProfileHeaderController.setUser(user)

		const updatedDates = {
			twitch: user.state.twitchEmotesUpdatedAt,
			stv: user.state.sevenTvEmotesUpdatedAt,
			ffz: user.state.ffzEmotesUpdatedAt,
			bttv: user.state.bttvEmotesUpdatedAt,
		}

		this._emotesService = new ChannelEmoteService(user.twitchProfile.id, this._options.messageReceiver)

		this._favoriteEmotesService = new ChannelFavoriteEmotesService(
			user.twitchProfile.id,
			this._options.messageReceiver,
			this._options.messageDispatcher,
		)

		await Promise.all([this._emotesService.init(), this._favoriteEmotesService.init()])

		const emoteContext = new EmoteContext([this._emotesService], this._favoriteEmotesService)
		this._emotesController.setData(emoteContext, updatedDates)
	}
}
