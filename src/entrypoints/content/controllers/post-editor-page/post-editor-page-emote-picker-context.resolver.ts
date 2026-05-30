import type { EmoteContext } from '@shared/emote-context'
import type { EmotePickerContext, EmotePickerContextResolver } from '../../components'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { findDynamicClosest } from '../../utils'

export class PostEditorPageEmotePickerContextResolver implements EmotePickerContextResolver {
	constructor(private readonly _emoteContext: EmoteContext) {
	}

	public async resolve(btn: HTMLButtonElement): Promise<EmotePickerContext | null> {
		const publisherRoot = findDynamicClosest<HTMLElement>(btn, BOOSTY_SELECTORS.posts.newPostEditor)
			?? findDynamicClosest <HTMLElement> (btn, BOOSTY_SELECTORS.posts.miniRichEditor)

		if (!publisherRoot)
			return null

		return {
			publisherRoot,
			emoteContext: this._emoteContext,
			placement: 'new-post',
		}
	}
}
