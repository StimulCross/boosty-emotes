import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class SubscriptionDescriptionMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			hasDynamicClass(mutation.target.parentElement, BOOSTY_SELECTORS.ui.scrollableComponent)
			&& mutation.addedNodes.length > 0
		)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (!(node instanceof HTMLElement))
				continue

			this._logger.verbose('Processing subscription description block...', node)

			this._injector(node)
		}
	}
}
