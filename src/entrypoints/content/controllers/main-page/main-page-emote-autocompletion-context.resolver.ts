import type { EmoteContext } from '@shared/emote-context'
import type {
	EmoteAutocompletionContext,
	EmoteAutocompletionContextResolver,
	EmoteAutocompletionPlacement,
	EmoteAutocompletionPlacementResolver,
} from '../../components'
import { findDynamicClosest } from '../../utils'

export class MainPageEmoteAutocompletionContextResolver implements EmoteAutocompletionContextResolver {
	constructor(
		private readonly _publisherRootClasses: string[],
		private readonly _placement: EmoteAutocompletionPlacement | EmoteAutocompletionPlacementResolver,
		private readonly _emoteContextResolver: (publisher: HTMLElement) => Promise<EmoteContext>,
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

		const emoteContext = await this._emoteContextResolver(publisherRoot)

		return {
			publisherRoot,
			emoteContext,
			placement,
		}
	}
}
