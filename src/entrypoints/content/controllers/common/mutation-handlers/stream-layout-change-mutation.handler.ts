import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { createEmotePickerButton } from '../../../templates'
import { findDynamicChild, hasDynamicClass } from '../../../utils'

export class StreamLayoutChangeMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _descriptionInjector: (el: Element) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass((mutation.target as HTMLElement).parentElement, BOOSTY_SELECTORS.stream.chatLayout)
	}

	public handle(mutation: MutationRecord): void {
		for (const node of mutation.addedNodes) {
			if (!(node instanceof HTMLElement) || !hasDynamicClass(node, BOOSTY_SELECTORS.stream.page))
				continue

			this._logger.verbose('Processing page update...', node)

			const smileBtn = findDynamicChild(node, BOOSTY_SELECTORS.ui.smileButton)

			if (smileBtn)
				smileBtn.replaceWith(createEmotePickerButton())

			const description = findDynamicChild(node, BOOSTY_SELECTORS.stream.description)

			if (description)
				this._descriptionInjector(description)
		}
	}
}
