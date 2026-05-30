export const isTextNode = (node?: unknown): node is Text => node instanceof Node && node.nodeType === Node.TEXT_NODE

export function isElement(node?: unknown): node is Element {
	return node instanceof Node && node.nodeType === Node.ELEMENT_NODE
}

export function hasDynamicClass(node: unknown, classNamePrefix: string): boolean {
	if (!(node instanceof Element))
		return false

	return node.classList.value.includes(classNamePrefix)
}

export function findDynamicChild<T extends Element = Element>(parent: Element, classNamePrefix: string): T | null {
	return parent.querySelector<T>(`[class*="${classNamePrefix}"]`)
}

export function findDynamicChildren(node: Element, classNamePrefix: string): NodeListOf<Element> {
	return node.querySelectorAll(`[class*="${classNamePrefix}"]`)
}

export function findDynamicClosest<T extends Element = Element>(node: Element, classNamePrefix: string): T | null {
	return node.closest<T>(`[class*="${classNamePrefix}"]`)
}
