// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EmitterListener = (...args: any[]) => void | Promise<void>;

export class EventEmitter {
	private readonly _listeners: Record<string, EmitterListener[]> = {};

	public emit(event: string, ...args: unknown[]): boolean {
		if (!Array.isArray(this._listeners[event])) {
			return false;
		}

		this._listeners[event].forEach(listener => void listener(...args));
		return true;
	}

	public on(event: string, callback: EmitterListener): () => void {
		this._listeners[event] = this._listeners[event] ?? [];
		this._listeners[event].push(callback);

		return (): void => {
			this._listeners[event] = this._listeners[event].filter(listener => listener !== callback);
		};
	}

	public off(event: string, callback: EmitterListener): void {
		if (Object.prototype.hasOwnProperty.call(this._listeners, event) && Array.isArray(this._listeners[event])) {
			this._listeners[event] = this._listeners[event].filter(listener => listener === callback);
		}
	}
}
