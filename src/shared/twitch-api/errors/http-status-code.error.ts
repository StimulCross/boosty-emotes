export class HttpStatusCodeError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly statusText: string,
		public readonly url: string
	) {
		super(`Encountered HTTP status code ${statusCode}: ${statusText}\n\nURL: ${url}`);
		Error.captureStackTrace(this, HttpStatusCodeError);
	}
}
