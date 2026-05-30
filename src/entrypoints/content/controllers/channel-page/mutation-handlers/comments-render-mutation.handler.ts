import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class CommentsRenderMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: HTMLElement) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.comments.content)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing comment...', mutation.target)

		this._injector(mutation.target as HTMLElement)
	}
}
