export function checkIsLineBreak(node: Node): boolean {
	return node instanceof HTMLElement && node.tagName === 'BR';
}
