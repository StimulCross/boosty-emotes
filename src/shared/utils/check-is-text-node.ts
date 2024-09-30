export function checkIsTextNode(node?: unknown): node is Text {
	return node instanceof Node && node.nodeType === Node.TEXT_NODE;
}
