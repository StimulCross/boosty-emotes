import type { CaretPos } from '../../types'
import { BOOSTY_SELECTORS } from '../../constants.ts'

export function restoreCaretPosition(redactor: HTMLElement, caretPosition: CaretPos): void {
	const { blockIndex, itemIndex, offset } = caretPosition

	const block = redactor.children[blockIndex] as Element | undefined

	if (!block)
		return

	const cdxBlock = block.querySelector(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`) as HTMLElement | undefined

	if (!cdxBlock)
		return

	const targetNode = cdxBlock.childNodes[itemIndex] as Node | undefined
	const range = document.createRange()
	const selection = globalThis.getSelection()

	try {
		if (!targetNode) {
			range.selectNodeContents(cdxBlock)
			range.collapse(false)
		}
		else if (targetNode.nodeType === Node.TEXT_NODE) {
			const safeOffset = Math.min(offset, targetNode.textContent?.length ?? 0)

			range.setStart(targetNode, safeOffset)
			range.collapse(true)
		}
		else {
			range.setStart(cdxBlock, itemIndex + 1)
			range.collapse(true)
		}

		selection?.removeAllRanges()
		selection?.addRange(range)
		cdxBlock.focus()
	}
	catch {
		cdxBlock.focus()
	}
}
