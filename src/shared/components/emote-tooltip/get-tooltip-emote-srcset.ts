import {
	type BoostyEmoteSize,
	type BttvEmoteSize,
	type EmoteProvider,
	type FfzEmoteSize,
	type SevenTvEmoteSize,
	type TwitchEmoteSize
} from '@shared/types';
import {
	getBoostyEmoteUrl,
	getBttvEmoteUrl,
	getFfzEmoteUrl,
	getSevenTvEmoteUrl,
	getTwitchEmoteUrl
} from '@shared/utils/get-emote-url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const layout: Record<EmoteProvider, { getUrlFn: (id: string, size: any) => string; sizes: number[] }> = {
	boosty: {
		getUrlFn: getBoostyEmoteUrl,
		sizes: [1, 2, 3] satisfies BoostyEmoteSize[]
	},
	twitch: {
		getUrlFn: getTwitchEmoteUrl,
		sizes: [1, 2, 3] satisfies TwitchEmoteSize[]
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention
	'7tv': {
		getUrlFn: getSevenTvEmoteUrl,
		sizes: [1, 2, 3, 4] satisfies SevenTvEmoteSize[]
	},
	ffz: {
		getUrlFn: getFfzEmoteUrl,
		sizes: [1, 2, 4] satisfies FfzEmoteSize[]
	},
	bttv: {
		getUrlFn: getBttvEmoteUrl,
		sizes: [1, 2, 3] satisfies BttvEmoteSize[]
	}
};

export function getTooltipEmoteSrcset(provider: EmoteProvider, id: string, width: number, height: number): string {
	return layout[provider].sizes
		.map(size => `${layout[provider].getUrlFn.call(null, id, size)} ${width * size}w ${height * size}h`)
		.join(', ');
}
