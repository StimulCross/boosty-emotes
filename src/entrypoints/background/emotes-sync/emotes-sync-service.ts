import type { EmoteSet } from '@shared/emote-context'
import type { ThirdPartyEmote } from '@shared/models'
import type { Logger } from '@stimulcross/logger'
import type { EmoteApiClient } from '../emotes-api-client'

export interface SyncEmotesOptions<TEmote extends ThirdPartyEmote> {
	providerTitle: string
	fetchNewEmotes: () => Promise<TEmote[]>
	fetchLocalEmotes: () => Promise<EmoteSet<TEmote>>
	updateEmotes: (emotes: TEmote[]) => Promise<void>
	updateState: () => Promise<void>
}

export interface EmotesSyncResult<TEmote extends ThirdPartyEmote = ThirdPartyEmote> {
	added: TEmote[]
	removed: TEmote[]
}

export abstract class EmotesSyncService<TEmote extends ThirdPartyEmote> {
	protected abstract readonly _logger: Logger

	constructor(
		protected readonly _emotesApiClient: EmoteApiClient,
		private readonly _updateIntervalMs: number,
	) {}

	protected _shouldUpdate(lastUpdate: number): boolean {
		return Date.now() - lastUpdate >= this._updateIntervalMs
	}

	protected async _syncEmotes({
		providerTitle,
		fetchNewEmotes,
		fetchLocalEmotes,
		updateEmotes,
		updateState,
	}: SyncEmotesOptions<TEmote>): Promise<EmotesSyncResult<TEmote> | null> {
		let isChanged = false

		try {
			this._logger.debug(`Syncing ${providerTitle} emotes...`)

			const newEmotes = await fetchNewEmotes()
			const localEmotes = await fetchLocalEmotes()
			const localEmotesMap = new Map(Array.from(localEmotes, emote => [emote.id, emote]))

			const added: TEmote[] = []
			const removed: TEmote[] = []

			for (const emote of newEmotes) {
				if (localEmotesMap.has(emote.id))
					localEmotesMap.delete(emote.id)

				else
					added.push(emote)
			}

			for (const emote of localEmotesMap.values())
				removed.push(emote)

			const operations: Array<Promise<unknown>> = [updateState()]

			if (added.length > 0 || removed.length > 0) {
				this._logger.info(
					`[${providerTitle}] Adding ${added.length}; Removing ${removed.length}; Total: ${newEmotes.length}`,
				)

				operations.push(updateEmotes([...newEmotes]))
				isChanged = true
			}

			await Promise.all(operations)

			return isChanged ? { added, removed } : null
		}
		catch (err) {
			this._logger.warn(`Failed to sync ${providerTitle} emotes`, err)

			return null
		}
	}

	protected async _runTasks(
		tasks: Array<Promise<EmotesSyncResult<TEmote> | null>>,
	): Promise<EmotesSyncResult<TEmote> | null> {
		if (tasks.length === 0)
			return null

		const results = await Promise.allSettled(tasks)

		const fulfilled = results
			.filter(
				(r): r is PromiseFulfilledResult<EmotesSyncResult<TEmote>> =>
					r.status === 'fulfilled' && r.value !== null,
			)
			.map(r => r.value)

		if (fulfilled.length === 0)
			return null

		return fulfilled.reduce(
			(acc, cur) => {
				acc.added.push(...cur.added)
				acc.removed.push(...cur.removed)

				return acc
			},
			{ added: [], removed: [] },
		)
	}
}
