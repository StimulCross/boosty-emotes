import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class AboutSectionMutationHandler implements MutationHandler {
	constructor(
		private readonly _logger: Logger,
		private readonly _injector: (el: Node) => void,
	) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.about.content)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Processing about section...', mutation)

		for (const node of mutation.addedNodes)
			this._injector(node)
	}
}
