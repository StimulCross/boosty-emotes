import { type EventEmitter } from '@shared/event-emitter';
import { type User } from '@shared/models';
import { type ThirdPartyEmoteProvider } from '@shared/types';
import { Component } from '../component';

export class EmotesListComponent extends Component {
	public readonly name = EmotesListComponent.name;

	constructor(
		private readonly _components: Component[],
		emitter: EventEmitter
	) {
		super(document.createElement('div'), { emitter });

		this.$root.classList.add('emotes-list');
		this._components.forEach(component => this.$root.append(component.root));
	}

	public override async init(): Promise<void> {
		for (const component of this._components) {
			await component.init();
		}
	}

	public override async destroy(): Promise<void> {
		await super.destroy();

		for (const component of this._components) {
			await component.destroy();
		}

		this.$root.remove();
	}

	private _getUpdatedDateForSet(user: User, provider: ThirdPartyEmoteProvider): number {
		switch (provider) {
			case 'twitch':
				return user.state.twitchEmotesUpdatedAt;

			case '7tv':
				return user.state.sevenTvEmotesUpdatedAt;

			case 'ffz':
				return user.state.ffzEmotesUpdatedAt;

			case 'bttv':
				return user.state.bttvEmotesUpdatedAt;

			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}
}
