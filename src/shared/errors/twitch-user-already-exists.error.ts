export class TwitchUserAlreadyExistsError extends Error {
	constructor(
		message: string,
		public readonly boostyUsername: string,
		public readonly twitchUsername: string
	) {
		super(message);
		Error.captureStackTrace(this, this.constructor);
	}
}
