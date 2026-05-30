import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class BlogPostChangeUpdateMutationHandler implements MutationHandler {
	constructor(private readonly _logger: Logger, private readonly _processor: (el: Element) => void) {
	}

	public match(mutation: MutationRecord): boolean {
		return mutation.type === 'childList'
			&& mutation.addedNodes.length === 1
			&& mutation.addedNodes[0] instanceof HTMLDivElement
			&& hasDynamicClass(mutation.addedNodes[0].firstElementChild, BOOSTY_SELECTORS.posts.blogPostChangeRoot)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing blog post change...', mutation)

		this._processor((mutation.addedNodes[0] as HTMLDivElement).firstElementChild as HTMLElement)
	}
}
