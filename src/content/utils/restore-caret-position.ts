import type { CaretPosition } from '@content/types/caret-position.interface';
import { checkIsTextNode } from '@shared/utils/check-is-text-node';

export function restoreCaretPosition(redactor: HTMLElement, caretPosition: CaretPosition): void {
	const { itemIndex, offset, blockIndex } = caretPosition;
	const range = document.createRange();
	const selection = window.getSelection();

	if (!selection) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const targetIndex = redactor.children[blockIndex] ? blockIndex : redactor.children.length - 1;
	const activeElement = redactor.children[targetIndex].querySelector('.cdx-block') as unknown as HTMLElement;
	const node = activeElement.childNodes.item(itemIndex);

	if (checkIsTextNode(node)) {
		range.setStart(node, offset);
		range.setEnd(node, offset);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	} else if (node) {
		range.setEndAfter(node);
		range.setStartAfter(node);
	} else {
		range.selectNodeContents(activeElement);
	}

	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
	activeElement.focus();
}
