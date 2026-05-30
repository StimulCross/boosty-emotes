import type { Emote } from '@shared/models'
import type { EmoteService, FavoriteEmotesService } from '@shared/services'
import type { EmoteProvider, EmoteScope } from '@shared/types'
import type { EmoteSet } from './emote-set.ts'
import { createAppLogger } from '@shared/utils'

export class EmoteContext<TEmote extends Emote = Emote> {
	private readonly _logger = createAppLogger('EmoteContext')

	private readonly _providerScopeIdIndex = new Map<EmoteProvider, Map<EmoteScope, EmoteSet<TEmote>>>()
	private readonly _nameIndex = new Map<string, TEmote>()
	private readonly _unsubscribers: Array<() => void> = []

	constructor(
		private readonly _sources: Iterable<EmoteService<TEmote>>,
		private readonly _favorites: FavoriteEmotesService,
	) {
		this._buildIndex()

		for (const source of _sources) {
			this._unsubscribers.push(source.subscribe(() => {
				this._buildIndex()
				this._pruneFavorites()
			}))
		}
	}

	public get favorites(): FavoriteEmotesService {
		return this._favorites
	}

	public destroy(): void {
		for (const unsub of this._unsubscribers) unsub()

		this._unsubscribers.length = 0
	}

	public findByName(name: string): TEmote | null {
		return this._nameIndex.get(name) ?? null
	}

	public findById(provider: EmoteProvider, id: string, scope: EmoteScope): TEmote | null {
		return this._providerScopeIdIndex.get(provider)?.get(scope)?.emotes.get(id) ?? null
	}

	public getEmoteSet(provider: EmoteProvider, scope: EmoteScope): EmoteSet | null {
		return this._providerScopeIdIndex.get(provider)?.get(scope) ?? null
	}

	public scopes(provider: EmoteProvider): Iterable<EmoteScope> | null {
		return this._providerScopeIdIndex.get(provider)?.keys() ?? null
	}

	public providers(): Iterable<EmoteProvider> {
		return this._providerScopeIdIndex.keys()
	}

	public* sets(): Iterable<EmoteSet<TEmote>> {
		for (const source of this._sources)
			yield* source.emoteSets.values()
	}

	public scopedSets(provider: EmoteProvider): Iterable<[scope: EmoteScope, EmoteSet<TEmote>]> {
		return this._providerScopeIdIndex.get(provider)?.entries() ?? []
	}

	public emotes(): Iterable<TEmote> {
		return this._nameIndex.values()
	}

	public rebuild(): void {
		this._buildIndex()
		this._pruneFavorites()
	}

	private _buildIndex(): void {
		this._providerScopeIdIndex.clear()
		this._nameIndex.clear()

		for (const source of this._sources) {
			for (const set of source.emoteSets.values()) {
				let scopeMap = this._providerScopeIdIndex.get(set.provider)

				if (!scopeMap) {
					scopeMap = new Map()
					this._providerScopeIdIndex.set(set.provider, scopeMap)
				}

				scopeMap.set(set.scope, set)

				for (const emote of set)
					this._nameIndex.set(emote.name, emote)
			}
		}
	}

	private _pruneFavorites(): void {
		for (const favoriteEmote of this._favorites.emotes()) {
			if (!this.findById(favoriteEmote.provider, favoriteEmote.id, favoriteEmote.scope)) {
				this._favorites.remove(favoriteEmote).catch(err => {
					this._logger.error(err)
				})
			}
		}
	}
}
