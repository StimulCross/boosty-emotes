import type { FfzUrlsData } from '../common/ffz-urls-data.ts'

export interface FfzBadgeData {
	id: number
	name: string
	title: string
	slot: number
	replaces: string | null
	color: string | null
	image: string
	urls: Required<FfzUrlsData>
	css: string | null
}
