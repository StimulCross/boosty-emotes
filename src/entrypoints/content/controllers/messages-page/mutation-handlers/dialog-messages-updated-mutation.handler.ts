import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class DialogMessagesUpdatedMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _processor: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			mutation.addedNodes.length === 1
			&& hasDynamicClass(mutation.target, BOOSTY_SELECTORS.messages.dialogChatWrapper)
			&& hasDynamicClass(mutation.addedNodes[0], BOOSTY_SELECTORS.messages.dialogMessagesRoot)
		)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing dialog messages...', mutation)

		const messagesRoot = mutation.addedNodes[0] as HTMLElement
		this._processor(messagesRoot)
	}
}
