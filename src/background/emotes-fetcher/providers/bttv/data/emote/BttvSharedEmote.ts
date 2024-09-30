import type { BttvBaseEmoteData } from './BttvBaseEmote';
import type { BttvUserData } from '../common/BttvUser';

export interface BttvSharedEmoteData extends BttvBaseEmoteData {
	user: BttvUserData;
}
