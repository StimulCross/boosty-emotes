import type { Placement, ReferenceElement } from '@floating-ui/dom'
import { computePosition, flip, offset, shift, size } from '@floating-ui/dom'

export interface PopupPositionOptions {
	placement?: Placement
	gap?: number
	leftOffset?: number
	maxHeight?: number
}

export async function positionPopupAtCaret(
	popup: HTMLElement,
	caretRect: DOMRect,
	options: PopupPositionOptions = {},
): Promise<void> {
	const { placement = 'top', gap = 8, leftOffset = 0 } = options

	const virtualRef: ReferenceElement = { getBoundingClientRect: () => caretRect }

	const { x, y } = await computePosition(virtualRef, popup, {
		placement,
		strategy: 'absolute',
		middleware: [
			offset({ mainAxis: gap, crossAxis: leftOffset }),
			flip(),
			shift({ padding: 8 }),
			size({
				apply({ availableHeight, elements }) {
					elements.floating.style.maxHeight = `${Math.max(Math.min(availableHeight, options.maxHeight ?? Infinity) - 16, 100)}px`
				},
				padding: 8,
			}),
		],
	})

	popup.style.left = `${x}px`
	popup.style.top = `${y}px`
}
