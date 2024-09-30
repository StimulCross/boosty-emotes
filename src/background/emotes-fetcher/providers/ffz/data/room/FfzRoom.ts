import type { FfzUrlsData } from '../common/FfzUrls';

export interface FfzRoomData {
	_id: number;
	twitch_id: number;
	youtube_id: string | null;
	id: string;
	is_group: boolean;
	display_name: string | null;
	set: number;
	moderator_badge: string | null;
	vip_badge: FfzUrlsData | null;
	mod_urls: FfzUrlsData | null;
	user_badges: Record<string, string[]>;
	user_badge_ids: Record<string, number[]>;
	css: string | null;
}
