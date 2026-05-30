import type { Logger } from '@stimulcross/logger'
import type { MutationHandler } from '../../../services'
import { BOOSTY_SELECTORS } from '../../../constants.ts'
import { hasDynamicClass } from '../../../utils'

export class ChatTooltipMutationHandler implements MutationHandler {
	constructor(private readonly _logger: Logger) {}

	public match(mutation: MutationRecord): boolean {
		return hasDynamicClass(mutation.target, BOOSTY_SELECTORS.chat.tooltip)
	}

	public handle(mutation: MutationRecord): void {
		this._logger.verbose('Hiding original tooltip...', mutation.target);

		(mutation.target as HTMLElement).style.display = 'none'
	}
}
