import { BoostyEmote, BttvEmote, type Emote, type EmoteData, FfzEmote, StvEmote, TwitchEmote } from '@shared/models';

export function mapEmote(data: EmoteData): Emote {
	switch (data.provider) {
		case '7tv': {
			return new StvEmote(data);
		}

		case 'twitch': {
			return new TwitchEmote(data);
		}

		case 'ffz': {
			return new FfzEmote(data);
		}

		case 'bttv': {
			return new BttvEmote(data);
		}

		case 'boosty': {
			return new BoostyEmote(data);
		}

		default:
			throw new Error(`Unknown emote type: ${JSON.stringify(data, null, 2)}`);
	}
}

export function mapEmotes(data: EmoteData[]): Emote[] {
	return data.map(emote => mapEmote(emote));
}
