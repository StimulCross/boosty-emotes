import type { EmoteContext } from '@shared/emote-context'
import type {
	EmotePickerContext,
	EmotePickerContextResolver,
	EmotePickerPlacement,
	EmotePickerPlacementResolver,
} from '../../components'
import { findDynamicClosest } from '../../utils'

export class MainPageEmotePickerContextResolver implements EmotePickerContextResolver {
	constructor(
		private readonly _publisherRootClasses: string[],
		private readonly _placement: EmotePickerPlacement | EmotePickerPlacementResolver,
		private readonly _emoteContextResolver: (publisher: HTMLElement) => Promise<EmoteContext>,
	) {}

	public async resolve(button: HTMLButtonElement): Promise<EmotePickerContext | null> {
		let publisherRoot: HTMLElement | undefined

		for (const className of this._publisherRootClasses) {
			const el = findDynamicClosest(button, className)

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
