import type { FfzRoomData } from './room/ffz-room-data.ts'
import type { FfzSetData } from './set/ffz-set-data.ts'

export interface FfzRoomWithSetsData {
	room: FfzRoomData
	sets: Record<string, FfzSetData>
}
