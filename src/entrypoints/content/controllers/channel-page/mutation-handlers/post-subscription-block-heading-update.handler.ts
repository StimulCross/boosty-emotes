import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class PostSubscriptionBlockHeadingUpdateHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			mutation.addedNodes.length > 0
			&& hasDynamicClass(mutation.target, BOOSTY_SELECTORS.posts.postSubscriptionBlockHeading)
		)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing post subscription block heading...', mutation)

		for (const node of mutation.addedNodes)
			this._injector(node as Element)
	}
}
