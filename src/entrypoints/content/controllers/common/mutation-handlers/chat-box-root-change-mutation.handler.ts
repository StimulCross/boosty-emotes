import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { findDynamicChildren, hasDynamicClass } from '../../../utils'

export class ChatBoxRootChangeMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target.parentElement, BOOSTY_SELECTORS.chat.chatBoxRoot)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			const messages = findDynamicChildren(node as Element, BOOSTY_SELECTORS.chat.text)

			if (messages.length === 0)
				return

			this._logger.verbose('Processing chat messages...', node)

			for (const message of messages)
				this._injector(message)
		}
	}
}
