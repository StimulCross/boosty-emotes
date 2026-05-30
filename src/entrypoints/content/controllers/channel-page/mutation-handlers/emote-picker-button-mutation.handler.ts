import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { createEmotePickerButton } from '../../../templates'
import { findDynamicChild, hasDynamicClass } from '../../../utils'

export class EmotePickerButtonMutationHandler implements MutationHandler {
	constructor(private readonly _logger: Logger) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.stream.chatToggler)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (!(node instanceof HTMLElement) || !hasDynamicClass(node, BOOSTY_SELECTORS.stream.streamChat))
				continue

			this._logger.verbose('Processing chat button...', node)

			const emoteButton = findDynamicChild(node, BOOSTY_SELECTORS.ui.smileButton)

			if (emoteButton)
				emoteButton.replaceWith(createEmotePickerButton())
		}
	}
}
