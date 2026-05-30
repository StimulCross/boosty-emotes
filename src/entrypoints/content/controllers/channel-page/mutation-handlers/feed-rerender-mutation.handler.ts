import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { findDynamicChildren, hasDynamicClass } from '../../../utils'

export class FeedRerenderMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _processPost: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (mutation.target as Element).id === 'column-1'
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (!(node instanceof HTMLElement) || !hasDynamicClass(node, BOOSTY_SELECTORS.posts.feed))
				continue

			this._logger.verbose('Feed updated. Processing posts...', node)

			const posts = findDynamicChildren(node, BOOSTY_SELECTORS.posts.feedItemWrap)

			for (const post of posts)
				this._processPost(post)
		}
	}
}
