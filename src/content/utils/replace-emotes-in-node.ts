import { replaceEmotesInString } from '@content/utils';
import { type Emote } from '@shared/models';

export function replaceEmotesInNode(
	node: Node,
	emoteMaps: Array<Map<string, Emote>>,
	tags: Set<string>,
	childPredicate?: (child: Node) => boolean
): void {
	if (node.nodeType === Node.TEXT_NODE) {
		if (node.textContent) {
			const el = document.createElement('span');
			el.innerHTML = replaceEmotesInString(node.textContent, emoteMaps);

			(node as Text).replaceWith(el);
		}
	} else if (node instanceof Element && tags.has(node.tagName.toLowerCase())) {
		if (node.childNodes.length > 0) {
			for (const child of node.childNodes) {
				if (childPredicate) {
					if (childPredicate(child)) {
						replaceEmotesInNode(child, emoteMaps, tags, childPredicate);
					}
				} else {
					replaceEmotesInNode(child, emoteMaps, tags);
				}
			}
		}
	}
}
