import type { SevenTvEmoteHost } from './seven-tv-emote-host.ts'
import type { SevenTvEmoteOwner } from './seven-tv-emote-owner.ts'
import type { SevenTvEmoteState } from './seven-tv-emote-state.ts'

export interface SevenTvEmoteDataData {
	id: string
	name: string
	flags: number
	lifecycle: number
	state: SevenTvEmoteState[]
	listed: boolean
	animated: boolean
	owner?: SevenTvEmoteOwner
	host: SevenTvEmoteHost
}
