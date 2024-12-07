import { type TokenWithIndices } from '@content/types/token-with-indices';

const whiteSpaceRegex = /\s/u;

export function splitTextIntoWordsWithIndices(text: string): TokenWithIndices[] {
	const words: TokenWithIndices[] = [];

	let currentWord = '';
	let currentWordStartIndex = 0;

	for (let i = 0; i < text.length; i++) {
		if (whiteSpaceRegex.test(text[i])) {
			if (currentWord !== '') {
				words.push({ value: currentWord, start: currentWordStartIndex, end: i });
				currentWord = '';
			}
		} else {
			if (currentWord === '') {
				currentWordStartIndex = i;
			}

			currentWord += text[i];
		}
	}

	if (currentWord !== '') {
		words.push({ value: currentWord, start: currentWordStartIndex, end: text.length });
		currentWord = '';
	}

	return words;
}
