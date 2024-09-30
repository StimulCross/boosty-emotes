import {
	type BoostyEmoteSize,
	type BttvEmoteSize,
	type FfzEmoteSize,
	type SevenTvEmoteSize,
	type TwitchEmoteSize
} from '@shared/types';

function mapBoostyEmoteSizeSize(size: BoostyEmoteSize): string {
	switch (size) {
		case 1:
			return 'small';

		case 2:
			return 'medium';

		case 3:
			return 'large';

		default:
			throw new Error(`Unknown Boosty emote size: ${size}`);
	}
}

export function getBoostyEmoteUrl(id: string, size: BoostyEmoteSize): string {
	return `https://images.boosty.to/smile/${id}/size/${mapBoostyEmoteSizeSize(size)}`;
}

export function getTwitchEmoteUrl(id: string, size: TwitchEmoteSize): string {
	return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/${size}.0`;
}

export function getSevenTvEmoteUrl(id: string, size: SevenTvEmoteSize): string {
	return `https://cdn.7tv.app/emote/${id}/${size}x.webp`;
}

export function getFfzEmoteUrl(id: string, size: FfzEmoteSize): string {
	return `https://cdn.frankerfacez.com/emoticon/${id}/${size}`;
}

export function getBttvEmoteUrl(id: string, size: BttvEmoteSize): string {
	return `https://cdn.betterttv.net/emote/${id}/${size}x.webp`;
}
