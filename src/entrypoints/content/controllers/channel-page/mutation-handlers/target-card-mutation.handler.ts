import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { findDynamicChildren, hasDynamicClass } from '../../../utils'

export class TargetCardMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.targets.card) && mutation.addedNodes.length > 0
	}

	public handle(mutation: MutationRecord): void {
		if (!(mutation.target instanceof HTMLElement))
			return

		this._logger.verbose('Processing target card...', mutation.target)

		const targets = findDynamicChildren(mutation.target, BOOSTY_SELECTORS.targets.itemDescription)

		for (const target of targets)
			this._injector(target)
	}
}
