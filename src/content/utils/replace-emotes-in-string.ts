import { type Emote } from '@shared/models';

export function replaceEmotesInString(str: string, emotesMaps: Array<Map<string, Emote>>): string {
	const words = str.split(/\s+/gu);
	const emotesToReplace = new Map<string, string>();

	for (const word of words) {
		for (const emotesMap of emotesMaps) {
			if (emotesMap.has(word)) {
				const emote = emotesMap.get(word)!;
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
