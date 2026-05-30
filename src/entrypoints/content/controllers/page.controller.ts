import type { Emote } from '@shared/models'
import type { GlobalEmoteService, GlobalFavoriteEmotesService } from '@shared/services'
import type { Logger } from '@stimulcross/logger'
import { EmoteSet } from '@shared/emote-context'
import { boostyEmotes } from '@shared/models'
import { StaticEmotesService } from '@shared/services'
import { ActionTooltipManager } from '@shared/ui'
import { EmoteTooltipManager } from '@shared/ui/tooltip/emote-tooltip'
import { MutationObserverService } from '../services'
import tooltipThemeStyles from '../styles/tooltip-theme.module.css'

export interface PageControllerOptions {
	$root: HTMLElement
	globalEmoteService: GlobalEmoteService
	globalFavoriteEmoteService: GlobalFavoriteEmotesService
}

export abstract class PageController<O extends PageControllerOptions = PageControllerOptions> {
	protected abstract readonly _logger: Logger

	protected readonly $root: HTMLElement
	protected readonly _mutationObserverService: MutationObserverService
	protected readonly _emoteTooltip: EmoteTooltipManager
	protected readonly _actionTooltip: ActionTooltipManager

	protected _boostyEmoteService = new StaticEmotesService(
		new EmoteSet<Emote>('boosty', 'global', boostyEmotes),
	)

	protected constructor(protected readonly _options: O) {
		this.$root = _options.$root

		this._mutationObserverService = new MutationObserverService(this.$root)
		this._emoteTooltip = new EmoteTooltipManager(this.$root, tooltipThemeStyles.tooltipTheme)
		this._actionTooltip = new ActionTooltipManager()
	}

	public async init(): Promise<void> {
		return
	}

	public async destroy(): Promise<void> {
		this._mutationObserverService.stop()
		this._emoteTooltip.destroy()
		this._actionTooltip.destroy()
	}

	protected abstract _processPage(): void
	protected abstract _initMutationHandlers(): void
}
