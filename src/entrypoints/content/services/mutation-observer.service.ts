export interface MutationHandler {
	match: (mutation: MutationRecord) => boolean
	handle: (mutation: MutationRecord) => void
}

export type MutationFilter = (mutation: MutationRecord) => boolean

export class MutationObserverService {
	private readonly _observer: MutationObserver
	private readonly _handlers: MutationHandler[] = []
	private readonly _filters: MutationFilter[] = []

	constructor(private readonly $root: HTMLElement) {
		this._observer = new MutationObserver(this._handleMutations.bind(this))
	}

	public registerFilter(...filters: MutationFilter[]): void {
		this._filters.push(...filters)
	}

	public register(...handlers: MutationHandler[]): void {
		this._handlers.push(...handlers)
	}

	public start(): void {
		this._observer.observe(this.$root, { childList: true, subtree: true })
	}

	public stop(): void {
		this._observer.disconnect()
	}

	private _handleMutations(mutations: MutationRecord[]): void {
		for (const mutation of mutations) {
			if (this._filters.some(filter => !filter(mutation)))
				continue

			for (const handler of this._handlers) {
				if (handler.match(mutation)) {
					handler.handle(mutation)

					break
				}
			}
		}
	}
}
