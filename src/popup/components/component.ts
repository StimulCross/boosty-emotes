import { DomListener, type DomListenerOptions } from '@shared/dom-listener';

export interface ComponentConstructor<T> {
	className: string;
	/* eslint-disable @typescript-eslint/no-explicit-any */
	new (...args: any[]): T;
}

export abstract class Component extends DomListener {
	protected constructor($root: HTMLElement, options: DomListenerOptions) {
		super($root, options);
		this.initDomListeners();
	}

	public init(): Promise<void> | void {
		return Promise.resolve();
	}

	public destroy(): Promise<void> | void {
		this.removeDomListeners();
		return Promise.resolve();
	}
}
