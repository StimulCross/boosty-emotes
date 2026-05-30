import type { CaretPos } from '../../types'
import { BOOSTY_SELECTORS } from '../../constants.ts'

export function getCaretPosition(element: Element): CaretPos | null {
	const selection = globalThis.getSelection()

	if (!selection || selection.rangeCount === 0)
		return null

	const range = selection.getRangeAt(0)

	const redactor = element.closest(`.${BOOSTY_SELECTORS.publisher.redactor}`)
	const currentBlock = element.closest(`.${BOOSTY_SELECTORS.publisher.ceBlock}`)

	if (!redactor || !currentBlock)
		return null

	const blockIndex = Array.prototype.indexOf.call(redactor.children, currentBlock)

	const cdxBlock = currentBlock.querySelector(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`)

	if (!cdxBlock)
		return null

	let itemIndex = 0
	let offset = range.startOffset

	if (range.startContainer === cdxBlock) {
		itemIndex = range.startOffset
		offset = 0
	}
	else {
		for (let i = 0; i < cdxBlock.childNodes.length; i++) {
			if (
				cdxBlock.childNodes[i] === range.startContainer
				|| cdxBlock.childNodes[i].contains(range.startContainer)
			) {
				itemIndex = i

				break
			}
		}
	}

	return { blockIndex, itemIndex, offset }
}
