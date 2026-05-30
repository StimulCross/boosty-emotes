import type { EmoteContext } from '@shared/emote-context'
import type { ThirdPartyEmote } from '@shared/models'
import type { EmoteViewModel } from '@shared/models/emotes/emote.view-model.ts'
import type { EmoteScope, ThirdPartyEmoteProvider } from '@shared/types'
import type { Controller } from '@shared/ui'
import type { EmoteTab } from './constants.ts'
import { emoteToViewModel } from '@shared/models'
import { ActionTooltipManager } from '@shared/ui/tooltip/action-tooltip'
import { createAppLogger } from '@shared/utils'
import { EmotesView } from './emotes.view.ts'

export class EmotesController implements Controller {
	private readonly _logger = createAppLogger('EmotesController')
	private readonly _view: EmotesView
	private readonly _actionTooltip = new ActionTooltipManager()

	private _emoteContext: EmoteContext<ThirdPartyEmote> | null = null
	private _updatedDates: Record<ThirdPartyEmoteProvider, number> | null = null

	private _searchQuery = ''
	private _activeTab: EmoteTab = 'twitch'

	private _isMounted = false

	constructor(private readonly _scope: EmoteScope) {
		this._view = new EmotesView({
			onSearch: query => this._handleSearch(query),
			onTabSelect: tab => this._handleTabSelect(tab),
			onEmoteClick: async (
				provider: ThirdPartyEmoteProvider,
				id: string,
				isCtrl: boolean,
				btn: HTMLButtonElement,
			) => await this._handleEmoteInteraction(provider, id, isCtrl, btn),
		})
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._view.mount(container)
		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._actionTooltip.destroy()

		this._isMounted = false
	}

	public setData(
		emoteContext: EmoteContext<ThirdPartyEmote>,
		updatedDates: Record<ThirdPartyEmoteProvider, number>,
	): void {
		this._emoteContext = emoteContext
		this._updatedDates = updatedDates

		this._activeTab = this._getFirstVisibleTab() ?? 'twitch'
		this._renderFullState()
	}

	private _handleSearch(query: string): void {
		this._searchQuery = query.toLowerCase()

		const visibleTabs = this._getVisibleTabs()

		if (!visibleTabs.includes(this._activeTab) && visibleTabs.length > 0) {
			this._activeTab = visibleTabs[0]
			this._renderFullState()
		}
		else {
			this._view.renderTabs(visibleTabs, this._activeTab)
			this._view.filterEmotes(this._searchQuery)
		}
	}

	private async _handleEmoteInteraction(
		provider: ThirdPartyEmoteProvider,
		id: string,
		isCtrl: boolean,
		btn: HTMLButtonElement,
	): Promise<void> {
		if (!this._emoteContext)
			return

		const emote = this._emoteContext.findById(provider, id, this._scope)

		if (!emote)
			return

		if (isCtrl) {
			const wasFavorite = this._emoteContext.favorites.isFavorite(emote)
			const isFavoriteNow = !wasFavorite

			await (isFavoriteNow
				? this._emoteContext.favorites.add(emote)
				: this._emoteContext.favorites.remove(emote))

			const totalFavs = this._emoteContext.favorites.total

			if (this._activeTab === 'favorite') {
				if (!isFavoriteNow) {
					this._view.removeEmoteNode(emote.id, emote.provider)

					if (totalFavs === 0) {
						this._activeTab = this._getFirstVisibleTab() ?? 'twitch'
						this._renderFullState()
					}
				}
			}
			else {
				this._view.toggleFavorite(emote.provider, emote.id, isFavoriteNow)

				if ((totalFavs === 1 && isFavoriteNow) || (totalFavs === 0 && !isFavoriteNow))
					this._view.renderTabs(this._getVisibleTabs(), this._activeTab)
			}

			return
		}

		try {
			await navigator.clipboard.writeText(emote.name)
			await this._actionTooltip.show(btn, browser.i18n.getMessage('copied'))
		}
		catch (err) {
			this._logger.error('Failed to copy emote to clipboard', err)
		}
	}

	private _handleTabSelect(tab: EmoteTab): void {
		if (this._activeTab !== tab) {
			this._activeTab = tab
			this._renderFullState()
		}
	}

	private _renderFullState(): void {
		if (!this._emoteContext || !this._updatedDates)
			return

		const visibleTabs = this._getVisibleTabs()
		const currentEmotes: EmoteViewModel[] = []

		if (this._activeTab === 'favorite') {
			for (const { provider, id, scope } of this._emoteContext.favorites.emotes()) {
				if (provider === 'boosty')
					continue

				const emote = this._emoteContext.findById(provider, id, scope)

				if (emote)
					currentEmotes.push(emoteToViewModel(emote, true))
			}
		}
		else {
			const set = this._emoteContext.getEmoteSet(this._activeTab, this._scope)

			if (set) {
				for (const emote of set)
					currentEmotes.push(emoteToViewModel(emote, this._emoteContext.favorites.isFavorite(emote)))
			}
		}

		this._view.render({
			searchQuery: this._searchQuery,
			activeTab: this._activeTab,
			visibleTabs,
			currentEmotes,
			stats:
				currentEmotes.length > 0
					? {
							total: currentEmotes.length,
							updatedAt:
								this._activeTab === 'favorite' ? Date.now() : this._updatedDates[this._activeTab],
						}
					: null,
		})
	}

	private _getVisibleTabs(): EmoteTab[] {
		if (!this._emoteContext)
			throw new Error('Emote context is not set')

		const result: EmoteTab[] = []

		for (const { provider, id, scope } of this._emoteContext.favorites.emotes()) {
			if (provider === 'boosty')
				continue

			const emote = this._emoteContext.findById(provider, id, scope)

			if (emote && this._isMatchingSearchQuery(emote.code)) {
				result.push('favorite')

				break
			}
		}

		for (const set of this._emoteContext.sets()) {
			for (const emote of set) {
				if (this._isMatchingSearchQuery(emote.code)) {
					result.push(emote.provider)

					break
				}
			}
		}

		return result
	}

	private _getFirstVisibleTab(): EmoteTab | null {
		if (!this._emoteContext)
			throw new Error('Emote context is not set')

		for (const { provider, id, scope } of this._emoteContext.favorites.emotes()) {
			if (provider === 'boosty')
				continue

			const emote = this._emoteContext.findById(provider, id, scope)

			if (emote && this._isMatchingSearchQuery(emote.code))
				return 'favorite'
		}

		for (const set of this._emoteContext.sets()) {
			for (const emote of set) {
				if (this._isMatchingSearchQuery(emote.code))
					return emote.provider
			}
		}

		return null
	}

	private _isMatchingSearchQuery(code: string): boolean {
		return this._searchQuery.length === 0 || code.includes(this._searchQuery)
	}
}
