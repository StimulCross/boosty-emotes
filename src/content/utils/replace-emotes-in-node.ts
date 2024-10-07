import { replaceEmotesInString } from '@content/utils';
import { type EmotesSet } from '@shared/types';

export function replaceEmotesInNode(
	node: Node,
	emoteSets: EmotesSet[],
	tags: Set<string>,
	childPredicate?: (child: Node) => boolean
): void {
	if (node.nodeType === Node.TEXT_NODE) {
		if (node.textContent) {
			const el = document.createElement('span');
			el.innerHTML = replaceEmotesInString(node.textContent, emoteSets);

			(node as Text).replaceWith(el);
		}
	} else if (node instanceof Element && tags.has(node.tagName.toLowerCase())) {
		if (node.childNodes.length > 0) {
			for (const child of node.childNodes) {
				if (childPredicate) {
					if (childPredicate(child)) {
						replaceEmotesInNode(child, emoteSets, tags, childPredicate);
					}
				} else {
					replaceEmotesInNode(child, emoteSets, tags);
				}
			}
		}
	}
}
