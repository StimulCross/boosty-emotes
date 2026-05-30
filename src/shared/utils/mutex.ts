export class Mutex {
	private _chain: Promise<void> = Promise.resolve()

	public async run<T>(fn: () => Promise<T>): Promise<T> {
		const result = this._chain.then(fn)
		this._chain = result.then(() => { /* no-op */ }, () => { /* no-op */ })

		return await result
	}
}
