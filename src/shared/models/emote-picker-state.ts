import type { EmoteProvider, EmoteScope } from '@shared/types';

export type EmotePickerEmotesSetCollapsedState = Record<EmoteScope, boolean>;

export interface EmotePickerEmotesSetState {
	collapsed: EmotePickerEmotesSetCollapsedState;
}

export interface EmotePickerState {
	activeTab: EmoteProvider;
	sets: Record<EmoteProvider, EmotePickerEmotesSetState>;
}
