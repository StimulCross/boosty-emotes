import { type CaretPosition } from '@content/types';

export class RedactorsState {
	private readonly _redactors: WeakMap<Element, CaretPosition | null> = new WeakMap();

	public has(redactor: Element): boolean {
		return this._redactors.has(redactor);
	}

	public get(redactor: Element): CaretPosition | null {
		return this._redactors.get(redactor) ?? null;
	}

	public set(redactor: Element, caretPosition: CaretPosition | null): void {
		this._redactors.set(redactor, caretPosition);
	}
}
