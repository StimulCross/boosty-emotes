import { type EventEmitter } from '@shared/event-emitter';

export interface DomListenerOptions {
	emitter: EventEmitter;
	listeners?: string[];
}

export abstract class DomListener {
	protected readonly _emitter: EventEmitter;
	private readonly _listeners: string[] = [];

	protected constructor(
		protected readonly $root: HTMLElement,
		options: DomListenerOptions
	) {
		this._emitter = options.emitter;
		this._listeners = options.listeners ?? [];
	}

	public get root(): HTMLElement {
		return this.$root;
	}

	public initDomListeners(): void {
		this._listeners.forEach(listener => {
			const methodName = this._convertEventNameToMethodName(listener);

			if (!(methodName in this)) {
				throw new Error(`Method ${methodName} is not implemented`);
			}

			// @ts-ignore ...
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			this[methodName] = (this[methodName] as Function).bind(this);
			// @ts-ignore ...
			this.$root.addEventListener(listener, this[methodName]);
		});
	}

	public removeDomListeners(): void {
		this._listeners.forEach(listener => {
			const methodName = this._convertEventNameToMethodName(listener);

			if (!(methodName in this)) {
				throw new Error(`Method ${methodName} is not implemented`);
			}

			// @ts-ignore ...
			this.$root.removeEventListener(listener, this[methodName]);
		});
	}

	private _convertEventNameToMethodName(eventName: string): string {
		return `_on${this._capitalizeFirstLetter(eventName)}`;
	}

	private _capitalizeFirstLetter(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}
