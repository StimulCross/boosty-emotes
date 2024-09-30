import { type UserIdentity } from '@shared/models/user-identity';
import { type UserState } from '@shared/models/user-state';

export interface User {
	boostyUsername: string;
	twitchProfile: UserIdentity;
	state: UserState;
}
