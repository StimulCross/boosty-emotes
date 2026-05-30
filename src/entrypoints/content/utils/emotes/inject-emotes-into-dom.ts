import type { EmoteContext } from '@shared/emote-context'
import type { ThirdPartyEmote } from '@shared/models'
import { emoteToViewModel } from '@shared/models'
import { renderEmoteButton } from '../../templates'
import { parseEmotes } from './parse-emotes.ts'

const DEFAULT_ALLOWED_TAGS: ReadonlySet<string> = new Set<keyof HTMLElementTagNameMap>([
	'div',
	'span',
	'b',
	'strong',
	'i',
	'u',
	'article',
])

export function injectEmotesIntoDom(node: Node,	context: EmoteContext<ThirdPartyEmote>,	shouldProcessNode?: (node: Node) => boolean,	allowedTags: ReadonlySet<string> = DEFAULT_ALLOWED_TAGS): void {
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
		acceptNode(currentNode: Node): number {
			if (currentNode.nodeType === Node.ELEMENT_NODE) {
				const element = currentNode as Element

				if (shouldProcessNode && !shouldProcessNode(element))
					return NodeFilter.FILTER_REJECT

				if (!allowedTags.has(element.tagName.toLowerCase()))
					return NodeFilter.FILTER_REJECT

				return NodeFilter.FILTER_SKIP
			}

			if (currentNode.nodeType === Node.TEXT_NODE) {
				const textContent = currentNode.textContent

				if (!textContent?.trim())
					return NodeFilter.FILTER_REJECT

				return NodeFilter.FILTER_ACCEPT
			}

			return NodeFilter.FILTER_REJECT
		},
	})

	const textNodes: Text[] = []
	let currentNode: Node | null

	// eslint-disable-next-line no-cond-assign
	while (currentNode = walker.nextNode())
		textNodes.push(currentNode as Text)

	for (const textNode of textNodes) {
		const content = textNode.textContent

		if (!content)
			continue

		const parsedNodes = parseEmotes(content, context)
		const replacement = parsedNodes
			.map(parsedNode => {
				if (parsedNode.type === 'text')
					return parsedNode.value

				return renderEmoteButton(
					emoteToViewModel(parsedNode.emote, context.favorites.isFavorite(parsedNode.emote)),
					parsedNode.modifiers.map(emote => {
						const isFavorite = context.favorites.isFavorite(emote)

						return emoteToViewModel(emote, isFavorite)
					}),
				)
			})
			.join('')

		if (replacement !== content) {
			const span = document.createElement('span')

			span.innerHTML = replacement
			textNode.replaceWith(span)
		}
	}
}
