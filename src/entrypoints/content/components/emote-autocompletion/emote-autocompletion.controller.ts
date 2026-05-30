import type { EmoteContext } from '@shared/emote-context'
import type { Emote, EmoteAutocompletionMatchType, EmoteAutocompletionSettings } from '@shared/models'
import type { EmoteProvider, EmoteScope } from '@shared/types'
import type { EmoteAutocompletionViewState } from './emote-autocompletion.view.ts'
import {

	emoteToViewModel,
} from '@shared/models'
import { EmoteAutocompletionView } from './emote-autocompletion.view.ts'

interface MatchedEmote {
	emote: Emote
	isFavorite: boolean
	matchType: EmoteAutocompletionMatchType
	priorityScore: number
}

export interface EmoteAutocompletionControllerOptions {
	context: EmoteContext
	settings: EmoteAutocompletionSettings
	onEmoteSelect: (emote: Emote) => void
	onClose: () => void
}

export class EmoteAutocompletionController {
	private readonly _view: EmoteAutocompletionView
	private readonly _context: EmoteContext

	private readonly _settings: EmoteAutocompletionSettings

	private _currentQuery = ''
	private _cachedMatches: Emote[] | null = null

	private _viewState: EmoteAutocompletionViewState = {
		matches: [],
		activeIndex: 0,
		query: '',
	}

	private _isMounted = false

	constructor(private readonly _options: EmoteAutocompletionControllerOptions) {
		this._view = new EmoteAutocompletionView({
			onEmoteClick: (provider, id, scope): void => this._handleMouseClick(provider, id, scope),
		})

		this._context = _options.context
		this._settings = _options.settings
	}

	public mount(container: HTMLElement, initialQuery: string): void {
		if (this._isMounted)
			return

		this._view.mount(container)
		this._isMounted = true

		this.updateQuery(initialQuery)
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._isMounted = false
	}

	public updateQuery(newQuery: string): void {
		const lowerQuery = newQuery.toLowerCase()

		if (
			this._cachedMatches
			&& lowerQuery.startsWith(this._currentQuery)
			&& lowerQuery.length > this._currentQuery.length
		) {
			this._processMatches(lowerQuery, this._cachedMatches)
		}

		else {
			this._processMatches(lowerQuery)
		}

		this._currentQuery = lowerQuery
	}

	public selectNext(): void {
		if (this._viewState.matches.length === 0)
			return

		this._viewState.activeIndex = (this._viewState.activeIndex + 1) % this._viewState.matches.length
		this._view.updateActiveIndex(this._viewState.activeIndex)
	}

	public selectPrev(): void {
		if (this._viewState.matches.length === 0)
			return

		this._viewState.activeIndex
			= (this._viewState.activeIndex - 1 + this._viewState.matches.length) % this._viewState.matches.length

		this._view.updateActiveIndex(this._viewState.activeIndex)
	}

	public completeCurrent(): void {
		if (this._viewState.matches.length === 0)
			return

		const activeViewModel = this._viewState.matches[this._viewState.activeIndex]

		this._emitSelection(activeViewModel.provider, activeViewModel.id, activeViewModel.scope)
	}

	private _processMatches(query: string, searchPool: Iterable<Emote> = this._context.emotes()): void {
		const matchedResults: MatchedEmote[] = []
		const nextCache: Emote[] = []

		for (const emote of searchPool) {
			let matchType: EmoteAutocompletionMatchType | undefined

			if (emote.code.startsWith(query))
				matchType = 'starts-with'

			else if (this._settings.matchType === 'contains' && emote.code.includes(query))
				matchType = 'contains'

			if (matchType) {
				nextCache.push(emote)

				const isFavorite = this._context.favorites.isFavorite(emote)

				matchedResults.push({
					emote,
					isFavorite,
					matchType,
					priorityScore: this._getProviderPriorityScore(emote.provider),
				})
			}
		}

		this._cachedMatches = nextCache

		if (matchedResults.length === 0) {
			this._options.onClose()

			return
		}

		const sorted = this._sortMatches(matchedResults).slice(0, this._settings.limit)

		this._viewState = {
			activeIndex: 0,
			matches: sorted.map(m => emoteToViewModel(m.emote, m.isFavorite)),
			query,
		}

		this._view.render(this._viewState)
	}

	private _sortMatches(matches: MatchedEmote[]): MatchedEmote[] {
		return matches.toSorted((a, b) => {
			if (this._settings.prioritizeFavoriteEmotes) {
				if (a.isFavorite && !b.isFavorite)
					return -1

				if (!a.isFavorite && b.isFavorite)
					return 1
			}

			if (this._settings.prioritizePrefixMatchedEmotes) {
				if (a.matchType === 'starts-with' && b.matchType === 'contains')
					return -1

				if (a.matchType === 'contains' && b.matchType === 'starts-with')
					return 1
			}

			if (this._settings.sortByPriority) {
				if (a.priorityScore < b.priorityScore)
					return -1

				if (a.priorityScore > b.priorityScore)
					return 1
			}

			return 0
		})
	}

	private _getProviderPriorityScore(provider: EmoteProvider): number {
		const index = this._settings.priority.indexOf(provider)

		return index === -1 ? 999 : index
	}

	private _handleMouseClick(provider: EmoteProvider, id: string, scope: EmoteScope): void {
		this._emitSelection(provider, id, scope)
	}

	private _emitSelection(provider: EmoteProvider, id: string, scope: EmoteScope): void {
		const emote = this._context.findById(provider, id, scope)

		if (emote) {
			this._options.onEmoteSelect(emote)
			this._options.onClose()
		}
	}
}
