import { type EmoteProvider, type EmoteScope } from '@shared/types';

export type EmoteSelectorSetCollapsedState = Record<EmoteScope, boolean>;

export interface EmoteSelectorSetState {
	collapsed: EmoteSelectorSetCollapsedState;
}

export interface EmotePickerState {
	activeTab: EmoteProvider;
	sets: Record<EmoteProvider, EmoteSelectorSetState>;
}
