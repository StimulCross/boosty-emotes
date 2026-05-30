import type { EmoteContext } from '@shared/emote-context'

export type EmotePickerPlacement = 'default' | 'stream-chat' | 'channel-stream-chat' | 'messages' | 'new-post'

export type EmotePickerPlacementResolver = (publisher: HTMLElement) => EmotePickerPlacement | null

export interface EmotePickerContext {
	publisherRoot: HTMLElement
	emoteContext: EmoteContext
	placement?: EmotePickerPlacement
}

export interface EmotePickerContextResolver {
	init?: () => Promise<void>
	resolve: (button: HTMLButtonElement) => Promise<EmotePickerContext | null>
}
