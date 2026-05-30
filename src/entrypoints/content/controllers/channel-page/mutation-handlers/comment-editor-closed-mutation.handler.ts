import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class CommentEditorClosedMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _processor: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return (
			mutation.target instanceof HTMLDivElement
			&& mutation.addedNodes.length === 1
			&& hasDynamicClass(mutation.addedNodes[0], BOOSTY_SELECTORS.comments.commentRoot)
		)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing comment editor...', mutation)

		const commentRoot = mutation.addedNodes[0] as HTMLDivElement
		this._processor(commentRoot)
	}
}
