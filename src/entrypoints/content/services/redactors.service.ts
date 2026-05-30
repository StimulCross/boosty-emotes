import type { CaretPos } from '../types'

export class RedactorsService {
	private readonly _redactors: WeakMap<Element, CaretPos | null> = new WeakMap()

	public get(redactor: Element): CaretPos | null {
		return this._redactors.get(redactor) ?? null
	}

	public set(redactor: Element, caretPosition: CaretPos | null): void {
		this._redactors.set(redactor, caretPosition)
	}
}
