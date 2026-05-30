import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { findDynamicChild, hasDynamicClass } from '../../../utils'

export class ChatMessageMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			hasDynamicClass((mutation.target as Element).parentElement, BOOSTY_SELECTORS.chat.chatBoxList)
			&& mutation.addedNodes.length > 0
		)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (
				!(node instanceof HTMLDivElement)
				|| !(node.firstChild instanceof HTMLDivElement)
				|| !hasDynamicClass(node.firstChild, BOOSTY_SELECTORS.chat.messageContainer)
			) {
				continue
			}

			const messageContainer = node.firstChild

			if (
				messageContainer.firstChild instanceof HTMLDivElement
				&& hasDynamicClass(messageContainer.firstChild, BOOSTY_SELECTORS.chat.systemMessage)
			) {
				continue
			}

			this._logger.verbose('Processing chat message...', node)

			const message = findDynamicChild(messageContainer, BOOSTY_SELECTORS.chat.text)

			if (message)
				this._injector(message)
		}
	}
}
