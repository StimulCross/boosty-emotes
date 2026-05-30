export function getCaretRect(): DOMRect | null {
	const sel = globalThis.getSelection()

	if (!sel || sel.rangeCount === 0)
		return null

	const range = sel.getRangeAt(0).cloneRange()
	range.collapse(true)

	return range.getBoundingClientRect()
}
