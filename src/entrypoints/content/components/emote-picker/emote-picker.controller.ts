import type { EmoteContext } from '@shared/emote-context'
import type { Emote, EmotePickerState, EmoteViewModel } from '@shared/models'
import type { EmoteProvider, EmoteScope } from '@shared/types'
import type { EmotePickerTab } from './constants.ts'
import { emoteToViewModel } from '@shared/models'
import { storage } from '@shared/storage/storage.ts'
import { createAppLogger } from '@shared/utils'
import { isValidEmotePickerTab } from './constants.ts'
import { EmotePickerView } from './emote-picker.view.ts'

export interface EmotePickerControllerOptions {
	context: EmoteContext
	onEmoteSelect: (emote: Emote) => void
}

export class EmotePickerController {
	private readonly _logger = createAppLogger('EmotePickerController')
	private readonly _view: EmotePickerView
	private readonly _context: EmoteContext

	private _persistedState!: EmotePickerState

	private _searchQuery = ''
	private _activeTab: EmotePickerTab = 'twitch'
	private _isMounted = false

	constructor(private readonly _options: EmotePickerControllerOptions) {
		this._view = new EmotePickerView({
			onSearch: query => this._handleSearch(query),
			onTabSelect: tab => this._handleTabSelect(tab),
			onScopeToggle: (scope, isCollapsed) => this._handleScopeToggle(scope, isCollapsed),
			onEmoteClick: async (provider, id, scope, isCtrl) =>
				await this._handleEmoteInteraction(provider, id, scope, isCtrl),
		})

		this._context = this._options.context
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
		this._isMounted = false
	}

	public async init(persistedState: EmotePickerState): Promise<void> {
		this._persistedState = persistedState
		this._activeTab = persistedState.activeTab

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

	private _handleTabSelect(tab: EmotePickerTab): void {
		if (!isValidEmotePickerTab(tab)) {
			this._logger.warn('Invalid emote picker tab selected:', tab)

			return
		}

		if (this._activeTab !== tab) {
			this._activeTab = tab
			this._persistedState.activeTab = tab

			this._renderFullState()
			this._saveState()
		}
	}

	private _handleScopeToggle(scope: EmoteScope, isCollapsed: boolean): void {
		// eslint-disable-next-line ts/no-unnecessary-condition
		if (!this._persistedState.sets[this._activeTab].collapsed)
			this._persistedState.sets[this._activeTab].collapsed = { channel: false, global: false }

		this._persistedState.sets[this._activeTab].collapsed[scope] = isCollapsed
		this._saveState()
	}

	private async _handleEmoteInteraction(
		provider: EmoteProvider,
		id: string,
		scope: EmoteScope,
		isCtrl: boolean,
	): Promise<void> {
		const emote = this._context.findById(provider, id, scope)

		if (!emote)
			return

		if (isCtrl) {
			const wasFavorite = this._context.favorites.isFavorite(emote)
			const isFavoriteNow = !wasFavorite

			try {
				await (isFavoriteNow ? this._context.favorites.add(emote) : this._context.favorites.remove(emote))
				const totalFavs = this._context.favorites.total

				if (this._activeTab === 'favorite') {
					if (!isFavoriteNow) {
						this._view.removeEmoteNode(id, provider)

						if (totalFavs === 0) {
							this._activeTab = this._getFirstVisibleTab() ?? 'twitch'
							this._renderFullState()
						}
					}
				}
				else {
					this._view.toggleFavorite(provider, id, isFavoriteNow)

					if ((totalFavs === 1 && isFavoriteNow) || (totalFavs === 0 && !isFavoriteNow))
						this._view.renderTabs(this._getVisibleTabs(), this._activeTab)
				}
			}
			catch (err) {
				this._logger.error('Failed to toggle favorite status', err)
			}

			return
		}

		this._options.onEmoteSelect(emote)
	}

	private _renderFullState(): void {
		const visibleTabs = this._getVisibleTabs()

		if (!visibleTabs.includes(this._activeTab) && visibleTabs.length > 0)
			this._activeTab = visibleTabs[0]

		const emotes: Record<EmoteScope, EmoteViewModel[]> = { global: [], channel: [] }

		if (this._activeTab === 'favorite') {
			for (const { provider, id, scope } of this._context.favorites.emotes()) {
				const emote = this._context.findById(provider, id, scope)

				if (!emote)
					continue

				emotes[emote.scope].push(emoteToViewModel(emote, true))
			}
		}
		else {
			for (const [scope, set] of this._context.scopedSets(this._activeTab)) {
				for (const emote of set) {
					const isFavorite = this._context.favorites.isFavorite(emote)
					const viewModel = emoteToViewModel(emote, isFavorite)

					emotes[scope].push(viewModel)
				}
			}
		}

		this._view.render({
			searchQuery: this._searchQuery,
			activeTab: this._activeTab,
			visibleTabs,
			emotes,
			isChannelCollapsed: this._persistedState.sets[this._activeTab].collapsed.channel,
			isGlobalCollapsed: this._persistedState.sets[this._activeTab].collapsed.global,
		})
	}

	private _getVisibleTabs(): EmotePickerTab[] {
		const result: EmotePickerTab[] = []

		let hasVisibleFav = false

		for (const { provider, id, scope } of this._context.favorites.emotes()) {
			const emote = this._context.findById(provider, id, scope)

			if (emote && this._isMatchingSearchQuery(emote)) {
				hasVisibleFav = true

				break
			}
		}

		if (hasVisibleFav)
			result.push('favorite')

		for (const set of this._context.sets()) {
			for (const emote of set) {
				if (this._isMatchingSearchQuery(emote)) {
					result.push(emote.provider)

					break
				}
			}
		}

		return result
	}

	private _getFirstVisibleTab(): EmotePickerTab | null {
		for (const { provider, id, scope } of this._context.favorites.emotes()) {
			const emote = this._context.findById(provider, id, scope)

			if (emote && this._isMatchingSearchQuery(emote))
				return 'favorite'
		}

		for (const set of this._context.sets()) {
			for (const emote of set) {
				if (this._isMatchingSearchQuery(emote))
					return emote.provider
			}
		}

		return null
	}

	private _isMatchingSearchQuery(emote: Emote): boolean {
		return this._searchQuery.length === 0 || emote.name.toLowerCase().includes(this._searchQuery)
	}

	private _saveState(): void {
		storage.state
			.updateEmotePickerState(this._persistedState)
			.catch(err => this._logger.error('Failed to save emote picker state', err))
	}
}
