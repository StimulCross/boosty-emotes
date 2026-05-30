import type { FfzSetData } from './set/ffz-set-data.ts'

export interface FfzGlobalEmotesData {
	default_sets: number[]
	sets: Record<string, FfzSetData>
	users: Record<string, string[]>
}
