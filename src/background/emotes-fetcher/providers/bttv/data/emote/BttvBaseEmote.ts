export type BttvEmoteImageType = 'png' | 'gif';

export interface BttvBaseEmoteData {
	id: string;
	code: string;
	imageType: BttvEmoteImageType;
}
