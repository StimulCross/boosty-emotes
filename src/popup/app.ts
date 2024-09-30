import { EventEmitter } from '@shared/event-emitter';
import { type Component, type ComponentConstructor } from './components';

export class App {
	private readonly $root: HTMLElement;
	private readonly _components: Array<ComponentConstructor<Component>>;
	private readonly _emitter = new EventEmitter();

	constructor(components: Array<ComponentConstructor<Component>>) {
		const $root = document.createElement('div');
		$root.id = 'app';
		this.$root = $root;
		this._components = components;
	}

	public async getRoot(): Promise<HTMLElement> {
		for (const componentConstructor of this._components) {
			const $el = document.createElement('div');
			$el.classList.add(componentConstructor.className);
			const component = new componentConstructor($el, this._emitter);
			await component.init();
			this.$root.append($el);
		}

		return this.$root;
	}
}
