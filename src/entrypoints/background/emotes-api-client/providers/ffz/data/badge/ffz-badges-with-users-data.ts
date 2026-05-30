import type { FfzBadgeData } from './ffz-badge-data.ts'

export interface FfzBadgesWithUsersData<T> {
	badges: FfzBadgeData[]
	users: Record<PropertyKey, T>
}
