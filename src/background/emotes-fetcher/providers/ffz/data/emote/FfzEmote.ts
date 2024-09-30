import type { FfzOwnerData } from '../common/FfzOwner';
import type { FfzUrlsData } from '../common/FfzUrls';

export interface FfzEmoteData {
	id: number;
	name: string;
	height: number;
	width: number;
	public: boolean;
	hidden: boolean;
	modifier: boolean;
	modifier_flags: number;
	offset: string | null;
	margins: string | null;
	css: string | null;
	owner: FfzOwnerData | null;
	urls: FfzUrlsData;
	animated: FfzUrlsData | null;
	status: number;
	usage_count: number;
	created_at: string;
	last_updated: string;
}
