import type { BttvUserData } from '../common/bttv-user-data.ts'
import type { BttvBaseEmoteData } from './bttv-base-emote-data.ts'

export interface BttvSharedEmoteData extends BttvBaseEmoteData {
	user: BttvUserData
}
