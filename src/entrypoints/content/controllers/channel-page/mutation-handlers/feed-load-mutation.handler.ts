import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class FeedLoadMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _processPost: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.posts.feed)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			this._logger.verbose('Processing post...', node)

			if (!(node instanceof HTMLElement))
				return

			this._processPost(node)
		}
	}
}
