import { BaseError } from '@shared/errors'

export class HttpStatusCodeError extends BaseError {
	constructor(
		public readonly statusCode: number,
		public readonly statusText: string,
		public readonly url: string,
	) {
		super(`Encountered HTTP status code ${statusCode}: ${statusText}\n\nURL: ${url}`)
	}
}
