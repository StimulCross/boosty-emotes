import { BaseError } from '@shared/errors/base-error.ts'

export class BoostyUserAlreadyExistsError extends BaseError {
	constructor(
		message: string,
		public readonly boostyUsername: string,
		public readonly twitchUsername: string,
	) {
		super(message)
	}
}
