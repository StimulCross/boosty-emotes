import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class LayoutChangeMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _render: () => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.ui.layoutContent) && mutation.addedNodes.length > 0
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Handling layout change...', mutation.target)

		this._render()
	}
}
