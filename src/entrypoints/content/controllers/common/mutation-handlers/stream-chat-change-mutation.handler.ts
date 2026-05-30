import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { createEmotePickerButton } from '../../../templates'
import { findDynamicChild, hasDynamicClass } from '../../../utils'

export class StreamChatChangeMutationHandler implements MutationHandler {
	constructor(private readonly _logger: Logger) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.stream.streamChat)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (node instanceof HTMLDivElement && hasDynamicClass(node, BOOSTY_SELECTORS.chat.chat)) {
				const smileBtn = findDynamicChild(node, BOOSTY_SELECTORS.ui.smileButton)

				if (smileBtn) {
					this._logger.verbose('Replacing smile button...', smileBtn)

					smileBtn.replaceWith(createEmotePickerButton())
				}
			}
		}
	}
}
