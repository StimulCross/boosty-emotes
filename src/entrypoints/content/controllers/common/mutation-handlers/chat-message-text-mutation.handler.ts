import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class ChatMessageTextMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.chat.text) && mutation.addedNodes.length > 0
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing chat message...', mutation.target)
		this._injector(mutation.target as Element)
	}
}
