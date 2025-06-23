import { boostyEmoteUrlsMap } from '@shared/models';
import {
	type BoostyEmoteSize,
	type BttvEmoteSize,
	type FfzEmoteSize,
	type SevenTvEmoteSize,
	type TwitchEmoteSize
} from '@shared/types';

export function getBoostyEmoteUrl(id: string, size: BoostyEmoteSize): string {
	return boostyEmoteUrlsMap.get(id)?.size[`x${size}`] ?? '';
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
