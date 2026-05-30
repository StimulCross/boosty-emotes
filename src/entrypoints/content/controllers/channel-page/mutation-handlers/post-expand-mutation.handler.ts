import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class PostExpandMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.posts.content) && mutation.addedNodes.length > 0
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			this._logger.verbose('Processing expanded post block...', node)

			this._injector(node as HTMLElement)
		}
	}
}
