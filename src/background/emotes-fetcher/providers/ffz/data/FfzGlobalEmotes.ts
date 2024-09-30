import type { FfzSetData } from './set/FfzSet';

export interface FfzGlobalEmotesData {
	default_sets: number[];
	sets: Record<string, FfzSetData>;
	users: Record<string, string[]>;
}
