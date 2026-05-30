import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class MiniRichEditorUpdateMutationHandler implements MutationHandler {
	constructor(private readonly _logger: Logger, private readonly _processor: (el: Element) => void) {
	}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.posts.miniRichEditor)
			&& mutation.addedNodes.length === 1
			&& mutation.addedNodes[0] instanceof HTMLDivElement
			&& hasDynamicClass(mutation.addedNodes[0], BOOSTY_SELECTORS.publisher.editor)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing mini rich editor change...', mutation)

		this._processor((mutation.target as HTMLElement))
	}
}
