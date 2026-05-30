const WHITE_SPACE_REGEX = /\s/u

export function isCharWhiteSpace(char?: string): boolean {
	return char ? WHITE_SPACE_REGEX.test(char) : false
}

export function startsWithWhiteSpace(str?: string): boolean {
	// eslint-disable-next-line ts/no-non-null-assertion
	return str ? WHITE_SPACE_REGEX.test(str.at(0)!) : false
}

export function endsWithWhiteSpace(str?: string): boolean {
	// eslint-disable-next-line ts/no-non-null-assertion
	return str ? WHITE_SPACE_REGEX.test(str.at(-1)!) : false
}
