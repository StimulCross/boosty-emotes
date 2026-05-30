import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class DialogMessageAddedMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _processor: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			mutation.addedNodes.length === 1
			&& hasDynamicClass(mutation.target, BOOSTY_SELECTORS.messages.dialogMessageGroup)
			&& mutation.addedNodes[0] instanceof HTMLDivElement
		)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing added message...', mutation)

		this._processor(mutation.addedNodes[0] as HTMLElement)
	}
}
