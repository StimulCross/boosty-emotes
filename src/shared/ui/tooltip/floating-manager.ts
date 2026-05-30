import type { Placement } from '@floating-ui/dom'
import type { Logger } from '@stimulcross/logger'
import { computePosition, flip, offset, shift } from '@floating-ui/dom'

export abstract class FloatingManager {
	protected readonly _floatingNode: HTMLDivElement
	protected _isVisible = false

	protected abstract readonly _logger: Logger

	constructor() {
		this._floatingNode = document.createElement('div')

		this._floatingNode.style.position = 'absolute'
		this._floatingNode.style.top = '0'
		this._floatingNode.style.left = '0'
		this._floatingNode.style.zIndex = '1000'
		this._floatingNode.style.opacity = '0'
		this._floatingNode.style.pointerEvents = 'none'
		// this._floatingNode.style.transition = 'opacity 0.1s ease-in-out, backdrop-filter 0.1s ease-in-out';

		document.body.append(this._floatingNode)
	}

	public destroy(): void {
		this._floatingNode.remove()
	}

	protected async _updatePosition(target: HTMLElement, placement: Placement): Promise<void> {
		try {
			const { x, y } = await computePosition(target, this._floatingNode, {
				placement,
				strategy: 'absolute',
				middleware: [
					flip(),
					shift({ padding: 5 }),
					offset(8),
				],
			})

			Object.assign(this._floatingNode.style, {
				left: `${x}px`,
				top: `${y}px`,
			})
		}
		catch (err) {
			this._logger.error('Could not update floating position', err)
		}
	}

	protected _show(): void {
		this._isVisible = true
		this._floatingNode.style.opacity = '1'
	}

	protected _hide(): void {
		this._isVisible = false
		this._floatingNode.style.opacity = '0'
	}
}
