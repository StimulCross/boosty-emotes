import type { SevenTvEmoteHostFileFormat, SevenTvEmoteHostFileFormatType } from './seven-tv-emote-host-file-format.ts'
import type { SevenTvEmoteScale } from './seven-tv-emote-scale.ts'

export interface SevenTvEmoteHostFile {
	name: `${SevenTvEmoteScale}x.${SevenTvEmoteHostFileFormat}`
	static_name: `${SevenTvEmoteScale}x_static.${SevenTvEmoteHostFileFormat}`
	width: number
	height: number
	frame_count: number
	size: number
	format: SevenTvEmoteHostFileFormatType
}
