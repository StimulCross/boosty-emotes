import type { EmoteContext } from '@shared/emote-context'
import type { EmoteAutocompletionContext, EmoteAutocompletionContextResolver } from '../../components'
import { BOOSTY_SELECTORS } from '../../constants.ts'
import { findDynamicClosest } from '../../utils'

export class PostEditorPageEmoteAutocompletionContextResolver implements EmoteAutocompletionContextResolver {
	constructor(private readonly _emoteContext: EmoteContext) {
	}

	public async resolve(input: HTMLElement): Promise<EmoteAutocompletionContext | null> {
		const publisherRoot = findDynamicClosest<HTMLElement>(input, BOOSTY_SELECTORS.posts.newPostEditor)
			?? findDynamicClosest <HTMLElement> (input, BOOSTY_SELECTORS.posts.miniRichEditor)

		if (!publisherRoot)
			return null

		return {
			publisherRoot,
			emoteContext: this._emoteContext,
			placement: 'default',
		}
	}
}
