import type { FfzRoomData } from './room/FfzRoom';
import type { FfzSetData } from './set/FfzSet';

export interface FfzRoomWithSetsData {
	room: FfzRoomData;
	sets: Record<string, FfzSetData>;
}
