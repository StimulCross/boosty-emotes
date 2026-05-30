import type { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import type { GlobalThirdPartyEmote } from '@shared/models'
import type { ThirdPartyEmoteProvider } from '@shared/types'
import type { Controller } from '@shared/ui'
import { EmoteContext } from '@shared/emote-context'
import { GlobalEmoteService, GlobalFavoriteEmotesService } from '@shared/services'
import { storage } from '@shared/storage'
import { EmoteTooltipManager } from '@shared/ui/tooltip/emote-tooltip'
import { EmotesController } from '../../shared/components/emotes'
import tooltipThemeStyles from '../../shared/styles/tooltip-theme.module.css'
import { GlobalEmotesLayout } from './global-emotes.view.ts'

export interface GlobalEmotesPageOptions {
	messageReceiver: MessageReceiver
	messageDispatcher: MessageDispatcher
}

export class GlobalEmotesController implements Controller {
	private readonly _view = new GlobalEmotesLayout()
	private readonly _emotesController = new EmotesController('global')

	private _emotesService: GlobalEmoteService | null = null
	private _favoriteEmotesService: GlobalFavoriteEmotesService | null = null
	private _tooltip: EmoteTooltipManager | null = null

	private _isMounted = false

	constructor(private readonly _options: GlobalEmotesPageOptions) {}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._tooltip = new EmoteTooltipManager(this._view.$root, tooltipThemeStyles.tooltipTheme)
		this._emotesController.mount(this._view.emotesSlot)

		this._view.mount(container)

		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

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
		const globalEmotesState = await storage.state.getGlobalEmotesState()

		const updatedDates: Record<ThirdPartyEmoteProvider, number> = {
			twitch: globalEmotesState.twitchGlobalEmotesUpdatedAt,
			stv: globalEmotesState.sevenTvGlobalEmotesUpdatedAt,
			ffz: globalEmotesState.ffzGlobalEmotesUpdatedAt,
			bttv: globalEmotesState.bttvGlobalEmotesUpdatedAt,
		}

		this._emotesService = new GlobalEmoteService(this._options.messageReceiver)

		this._favoriteEmotesService = new GlobalFavoriteEmotesService(
			this._options.messageReceiver,
			this._options.messageDispatcher,
		)

		await Promise.all([this._emotesService.init(), this._favoriteEmotesService.init()])

		const emoteContext = new EmoteContext<GlobalThirdPartyEmote>([this._emotesService], this._favoriteEmotesService)
		this._emotesController.setData(emoteContext, updatedDates)
	}
}
