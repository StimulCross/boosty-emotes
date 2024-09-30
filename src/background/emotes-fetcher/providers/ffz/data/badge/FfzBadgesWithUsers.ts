import type { FfzBadgeData } from './FfzBadge';

export interface FfzBadgesWithUsersData<T> {
	badges: FfzBadgeData[];
	users: Record<PropertyKey, T>;
}
