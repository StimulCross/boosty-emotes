import { WHITE_SPACE_REGEX } from '@shared/constants';

export function startsWithWhiteSpace(str?: string): boolean {
	return str && str.length > 0 ? WHITE_SPACE_REGEX.test(str.at(0)!) : false;
}

export function endsWithWhiteSpace(str?: string): boolean {
	return str ? WHITE_SPACE_REGEX.test(str.at(-1)!) : false;
}
