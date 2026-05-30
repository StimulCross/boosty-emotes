import type { EmoteContext } from '@shared/emote-context'
import type { EmoteAutocompletionContext, EmoteAutocompletionContextResolver, EmoteAutocompletionPlacement, EmoteAutocompletionPlacementResolver } from '../../../components'
import { findDynamicClosest } from '../../../utils'

export class SingleUserPageEmoteAutocompletionContextResolver implements EmoteAutocompletionContextResolver {
	constructor(
		private readonly _emoteContext: EmoteContext,
		private readonly _publisherRootClasses: string[],
		private readonly _placement: EmoteAutocompletionPlacement | EmoteAutocompletionPlacementResolver,
	) {}

	public async resolve(input: HTMLElement): Promise<EmoteAutocompletionContext | null> {
		let publisherRoot: HTMLElement | undefined

		for (const className of this._publisherRootClasses) {
			const el = findDynamicClosest(input, className)

			if (el instanceof HTMLElement) {
				publisherRoot = el

				break
			}
		}

		if (!publisherRoot)
			return null

		const placement
			= typeof this._placement === 'function' ? this._placement(publisherRoot) ?? 'default' : this._placement

		return {
			publisherRoot,
			emoteContext: this._emoteContext,
			placement,
		}
	}
}
