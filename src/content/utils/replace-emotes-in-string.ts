import { type EmotesSet } from '@shared/types';

export function replaceEmotesInString(str: string, emotesSets: EmotesSet[]): string {
	const words = str.split(/\s+/gu);
	const emotesToReplace = new Map<string, string>();

	for (const word of words) {
		for (const emotesSet of emotesSets) {
			if (emotesSet.has(word)) {
				const emote = emotesSet.get(word)!;
				emotesToReplace.set(word, emote.toHtml());
			}
		}
	}

	let result = str;

	emotesToReplace.forEach((html, code) => {
		result = result.replaceAll(code, html);
	});

	return result;
}
