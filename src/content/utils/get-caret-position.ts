import type { CaretPosition } from '@content/types/caret-position.interface';
import { checkIsLineBreak } from '@shared/utils/check-is-line-break';

export function getCaretPosition(element: Element): CaretPosition | null {
	const selection = window.getSelection();

	if (!selection || selection.rangeCount === 0) {
		return null;
	}

	const range = selection.getRangeAt(0);
	const preCaretRange = range.cloneRange();

	preCaretRange.selectNodeContents(element);
	preCaretRange.setEnd(range.endContainer, range.endOffset);

	const itemIndex =
		preCaretRange.cloneContents().childNodes.length === 0 ? 0 : preCaretRange.cloneContents().childNodes.length - 1;
	const offset = range.endOffset;

	const redactor = element.closest('.codex-editor__redactor');
	const currentBlock = element.closest('.ce-block');

	if (!redactor || !currentBlock) {
		return null;
	}

	const blockIndex = Array.from(redactor.children).indexOf(currentBlock);
	let breakItems = 0;
	const blocks = Array.from(redactor.children).slice(0, blockIndex);

	for (const block of blocks) {
		breakItems += Array.from(block.children[0].children[0].childNodes).filter(
			(item, index, list) => !checkIsLineBreak(item) || !checkIsLineBreak(list[index - 1])
		).length;
	}

	return {
		itemIndex,
		offset,
		breakItems,
		blockIndex
	};
}
