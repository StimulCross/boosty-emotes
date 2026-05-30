import type { Emote } from '@shared/models'
import type { CaretPos } from '../types'
import type { RedactorsService } from './redactors.service.ts'
import { createAppLogger } from '@shared/utils'
import { BOOSTY_SELECTORS } from '../constants.ts'
import { createBoostyNativeEmote } from '../templates/boosty-native-emote.ts'
import {
	endsWithWhiteSpace,
	getCaretPosition,
	isCharWhiteSpace,
	isElement,
	isTextNode,
	restoreCaretPosition,
	startsWithWhiteSpace,
} from '../utils'

const NBSP_CHAR = '\u00A0'

export class InputEmoteInjector {
	private readonly _logger = createAppLogger('InputEmoteInjector')

	constructor(private readonly _redactorsState: RedactorsService) {}

	public injectEmote(publisher: HTMLElement, emote: Emote, forceSpaceAfter = false): void {
		const redactor = this._getRedactor(publisher)
		const caretPosition = this._redactorsState.get(redactor)

		if (!caretPosition) {
			this._injectAtEnd(redactor, emote)

			return
		}

		this._injectAtCaretPosition(redactor, emote, caretPosition, forceSpaceAfter)
	}

	public replaceTextWithEmote(
		publisher: HTMLElement,
		emote: Emote,
		startOffset: number,
		endOffset: number,
		forceSpaceAfter = false,
	): void {
		const redactor = this._getRedactor(publisher)
		const caretPosition = this._redactorsState.get(redactor)

		if (!caretPosition)
			return

		const cdxBlock = this._getCdxBlock(redactor, caretPosition.blockIndex)

		if (!cdxBlock || cdxBlock.childNodes.length === 0)
			return

		const item = cdxBlock.childNodes[caretPosition.itemIndex] ?? cdxBlock.lastChild

		if (!isTextNode(item))
			return

		try {
			const range = document.createRange()
			range.setStart(item, startOffset)
			range.setEnd(item, endOffset)

			const selection = globalThis.getSelection()
			selection?.removeAllRanges()
			selection?.addRange(range)

			this._injectNodeIntoRange(range, emote, forceSpaceAfter)
			this._dispatchInputEvent(range.startContainer)

			const newCaretPos = getCaretPosition(cdxBlock)

			if (newCaretPos)
				this._redactorsState.set(redactor, newCaretPos)
		}
		catch (err) {
			this._logger.error('Failed to create range for token replacement', err)
		}
	}

	private _getRedactor($publisher: HTMLElement): HTMLElement {
		const redactor = $publisher.querySelector(`.${BOOSTY_SELECTORS.publisher.redactor}`)

		if (!(redactor instanceof HTMLElement))
			throw new TypeError('Redactor not found')

		return redactor
	}

	private _injectAtCaretPosition(
		redactor: HTMLElement,
		emote: Emote,
		caretPosition: CaretPos,
		forceSpaceAfter = false,
	): void {
		restoreCaretPosition(redactor, caretPosition)

		const selection = globalThis.getSelection()

		if (!selection || selection.rangeCount === 0) {
			this._logger.warn('No selection after restoreCaretPosition')

			return
		}

		const range = selection.getRangeAt(0)
		this._injectNodeIntoRange(range, emote, forceSpaceAfter)

		const cdxBlock = this._getCdxBlock(redactor, caretPosition.blockIndex)

		if (cdxBlock) {
			const newCaretPos = getCaretPosition(cdxBlock)

			if (newCaretPos)
				this._redactorsState.set(redactor, newCaretPos)
		}
	}

	private _injectAtEnd(redactor: HTMLElement, emote: Emote): void {
		const cdxBlock = redactor.querySelector(`.${BOOSTY_SELECTORS.publisher.cdxBlock}:last-of-type`)

		if (!cdxBlock)
			return

		const range = document.createRange()
		range.selectNodeContents(cdxBlock)
		range.collapse(false)

		const selection = globalThis.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)

		this._injectNodeIntoRange(range, emote)

		const newCaretPos = getCaretPosition(cdxBlock)

		if (newCaretPos)
			this._redactorsState.set(redactor, newCaretPos)
	}

	private _injectNodeIntoRange(range: Range, emote: Emote, forceSpaceAfter = false): void {
		const node = emote.provider === 'boosty' ? createBoostyNativeEmote(emote) : emote.name
		const spacing = typeof node === 'string' ? this._checkSpacing(range) : null

		range.deleteContents()

		if (typeof node === 'string') {
			const needsBefore = spacing?.needsBefore ?? false
			const needsAfter = forceSpaceAfter || (spacing?.needsAfter ?? false)
			const text = `${needsBefore ? NBSP_CHAR : ''}${node}${needsAfter ? NBSP_CHAR : ''}`
			const textNode = document.createTextNode(text)
			range.insertNode(textNode)
			range.setStartAfter(textNode)
		}
		else {
			range.insertNode(node)
			const spaceNode = document.createTextNode(NBSP_CHAR)
			node.after(spaceNode)
			range.setStartAfter(spaceNode)
		}

		range.collapse(true)

		const selection = globalThis.getSelection()
		selection?.removeAllRanges()
		selection?.addRange(range)
	}

	private _checkSpacing(range: Range): { needsBefore: boolean, needsAfter: boolean } {
		const container = range.startContainer
		const offset = range.startOffset

		let needsBefore = true
		let needsAfter = true

		if (isTextNode(container)) {
			const text = container.textContent
			const charBefore = text[offset - 1] as string | undefined
			const charAfter = text[offset] as string | undefined

			if (charBefore === undefined) {
				const prevSibling = container.previousSibling

				if (!prevSibling)
					needsBefore = false

				else if (isTextNode(prevSibling))
					needsBefore = !endsWithWhiteSpace(prevSibling.textContent)

				else
					needsBefore = true
			}
			else if (isCharWhiteSpace(charBefore)) {
				needsBefore = false
			}

			if (charAfter === undefined) {
				const nextSibling = container.nextSibling

				if (!nextSibling)
					needsAfter = false

				else if (isTextNode(nextSibling))
					needsAfter = !startsWithWhiteSpace(nextSibling.textContent)

				else
					needsAfter = true
			}
			else if (isCharWhiteSpace(charAfter)) {
				needsAfter = false
			}
		}
		else {
			const nodeBefore = container.childNodes[offset - 1] as Node | undefined
			const nodeAfter = container.childNodes[offset] as Node | undefined

			if (nodeBefore) {
				if (isTextNode(nodeBefore)) {
					const text = nodeBefore.textContent

					if (endsWithWhiteSpace(text))
						needsBefore = false
				}
				else {
					needsBefore = true
				}
			}
			else {
				needsBefore = false
			}

			if (nodeAfter) {
				if (isTextNode(nodeAfter)) {
					const text = nodeAfter.textContent

					if (startsWithWhiteSpace(text))
						needsAfter = false
				}
				else {
					needsAfter = true
				}
			}
			else {
				needsAfter = false
			}
		}

		return { needsBefore, needsAfter }
	}

	private _getCdxBlock(redactor: HTMLElement, blockIndex: number): HTMLElement | null {
		const block = redactor.children[blockIndex]

		if (!(block instanceof HTMLElement))
			return null

		const cdxBlock = block.querySelector(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`)

		return cdxBlock instanceof HTMLElement ? cdxBlock : null
	}

	private _dispatchInputEvent(node: Node): void {
		const cdxBlock = isElement(node)
			? node.closest(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`)
			: node.parentElement?.closest(`.${BOOSTY_SELECTORS.publisher.cdxBlock}`)

		if (cdxBlock) {
			cdxBlock.dispatchEvent(
				new InputEvent('input', {
					bubbles: true,
					cancelable: true,
					inputType: 'insertText',
				}),
			)
		}
	}
}
