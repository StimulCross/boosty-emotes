import type { BoostyUser, TwitchUser, UserState } from '@shared/models'

export interface User {
	boostyProfile: BoostyUser
	twitchProfile: TwitchUser
	state: UserState
}
