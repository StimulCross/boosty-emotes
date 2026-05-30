export class BaseError extends Error {
	constructor(message: string) {
		super(message)

		this.name = this.constructor.name
		Object.setPrototypeOf(this, new.target.prototype)

		// eslint-disable-next-line ts/no-unnecessary-condition
		if (Error.captureStackTrace)
			Error.captureStackTrace(this, this.constructor)
	}
}
