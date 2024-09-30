import { type EmotesListSetComponent } from '@/popup/components/emotes-list/emotes-list-set.component';
import { type EventEmitter } from '@shared/event-emitter';
import { Component } from '../component';

export class EmotesListBodyComponent extends Component {
	public readonly name = EmotesListBodyComponent.name;

	constructor(
		emitter: EventEmitter,
		private readonly _emoteSets: EmotesListSetComponent[]
	) {
		super(document.createElement('div'), { emitter });

		this.$root.classList.add('emotes-list__body');
		this._emoteSets.forEach(set => this.$root.append(set.root));
	}

	public async init(): Promise<void> {
		for (const set of this._emoteSets) {
			await set.init();
		}
	}

	public async destroy(): Promise<void> {
		await super.destroy();

		for (const set of this._emoteSets) {
			await set.destroy();
		}
	}
}
