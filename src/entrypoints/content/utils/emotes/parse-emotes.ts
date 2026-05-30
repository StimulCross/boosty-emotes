import type { EmoteContext } from '@shared/emote-context'
import type { ThirdPartyEmote } from '@shared/models'

const STRICT_WHITE_SPACE_REGEX = /^\s+$/u

const SPLIT_REGEX = /(\s+)/u

export type NodeType = 'text' | 'emote'

export interface TextNode {
	type: Extract<NodeType, 'text'>
	value: string
}

export interface EmoteNode {
	type: Extract<NodeType, 'emote'>
	emote: ThirdPartyEmote
	modifiers: ThirdPartyEmote[]
}

export type ParsedNode = TextNode | EmoteNode

export function parseEmotes(text: string, emoteContext: EmoteContext<ThirdPartyEmote>): ParsedNode[] {
	if (!text)
		return []

	const tokens = text.split(SPLIT_REGEX)
	const parsedNodes: ParsedNode[] = []
	let lastEmoteNode: EmoteNode | null = null

	for (const token of tokens) {
		if (!token)
			continue

		if (STRICT_WHITE_SPACE_REGEX.test(token)) {
			parsedNodes.push({ type: 'text', value: token })

			continue
		}

		const emote = emoteContext.findByName(token)

		if (!emote) {
			parsedNodes.push({ type: 'text', value: token })
			lastEmoteNode = null

			continue
		}

		if ((emote.type === 'overlay' || emote.type === 'modifier') && lastEmoteNode) {
			lastEmoteNode.modifiers.push(emote)

			const prevNode = parsedNodes.at(-1)

			if (prevNode?.type === 'text' && STRICT_WHITE_SPACE_REGEX.test(prevNode.value))
				parsedNodes.pop()
		}
		else {
			const emoteNode: EmoteNode = { type: 'emote', emote, modifiers: [] }

			parsedNodes.push(emoteNode)
			lastEmoteNode = emoteNode
		}
	}

	return parsedNodes
}
