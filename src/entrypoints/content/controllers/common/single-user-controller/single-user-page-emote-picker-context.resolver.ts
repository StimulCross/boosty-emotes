import type { EmoteContext } from '@shared/emote-context'
import type { EmotePickerContext, EmotePickerContextResolver, EmotePickerPlacement, EmotePickerPlacementResolver } from '../../../components'

export class SingleUserPageEmotePickerContextResolver implements EmotePickerContextResolver {
	constructor(
		private readonly _emoteContext: EmoteContext,
		private readonly _publisherRootClasses: string[],
		private readonly _placement: EmotePickerPlacement | EmotePickerPlacementResolver,
	) {}

	public async resolve(button: HTMLButtonElement): Promise<EmotePickerContext | null> {
		let publisherRoot: HTMLElement | undefined

		for (const className of this._publisherRootClasses) {
			const el = button.closest(`[class*="${className}"]`)

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
