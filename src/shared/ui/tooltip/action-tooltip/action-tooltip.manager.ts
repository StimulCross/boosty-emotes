import { FloatingManager } from '@shared/ui/tooltip/floating-manager.ts'
import { createAppLogger } from '@shared/utils'
import { renderActionTooltip } from './action-tooltip.template.ts'

export class ActionTooltipManager extends FloatingManager {
	protected override readonly _logger = createAppLogger('ActionTooltipManager')
	private _hideTimeout: ReturnType<typeof setTimeout> | null = null

	public async show(target: HTMLElement, text: string, durationMs = 1000): Promise<void> {
		try {
			this._clearHideTimeout()

			this._floatingNode.innerHTML = renderActionTooltip(text)

			await this._updatePosition(target, 'bottom')
			this._show()

			this._hideTimeout = setTimeout(() => {
				this._hide()
			}, durationMs)
		}
		catch (err) {
			this._logger.error('Failed to show action tooltip', err)
		}
	}

	public override destroy(): void {
		this._clearHideTimeout()

		super.destroy()
	}

	private _clearHideTimeout(): void {
		if (this._hideTimeout) {
			clearTimeout(this._hideTimeout)
			this._hideTimeout = null
		}
	}
}
