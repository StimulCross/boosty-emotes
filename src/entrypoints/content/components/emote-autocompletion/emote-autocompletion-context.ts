import type { EmoteContext } from '@shared/emote-context'

export type EmoteAutocompletionPlacement = 'default' | 'stream-chat'

export type EmoteAutocompletionPlacementResolver = (publisher: HTMLElement) => EmoteAutocompletionPlacement | null

export interface EmoteAutocompletionContext {
	publisherRoot: HTMLElement
	emoteContext: EmoteContext
	placement?: EmoteAutocompletionPlacement
}

export interface EmoteAutocompletionContextResolver {
	init?: () => Promise<void>
	resolve: (inputElement: HTMLElement) => Promise<EmoteAutocompletionContext | null>
}
