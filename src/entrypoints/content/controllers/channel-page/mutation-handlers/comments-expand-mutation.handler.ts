import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { findDynamicChild, hasDynamicClass } from '../../../utils'

export class CommentsExpandMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		const target = mutation.target as HTMLElement

		return target.parentElement?.id === 'comments' && !hasDynamicClass(target, BOOSTY_SELECTORS.comments.publisher)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (
				!(node instanceof HTMLElement)
				|| hasDynamicClass(node, BOOSTY_SELECTORS.ui.showMore)
				|| hasDynamicClass(node, BOOSTY_SELECTORS.ui.spinner)
			) {
				continue
			}

			this._logger.verbose('Processing loaded comment...', node)

			const commentContent = findDynamicChild(node, BOOSTY_SELECTORS.comments.content)

			if (commentContent)
				this._injector(commentContent)
		}
	}
}
