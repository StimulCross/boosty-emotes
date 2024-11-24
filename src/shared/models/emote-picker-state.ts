import type { EmotePickerTab, EmoteScope } from '@shared/types';

export type EmotePickerEmotesSetCollapsedState = Record<EmoteScope, boolean>;

export interface EmotePickerEmotesSetState {
	collapsed: EmotePickerEmotesSetCollapsedState;
}

export interface EmotePickerState {
	activeTab: EmotePickerTab;
	sets: Record<EmotePickerTab, EmotePickerEmotesSetState>;
}
