import { createGlobalEmotesListComponent } from '@popup/components/emotes-list/create-global-emotes-list';
import type { EmotesListComponent } from '@popup/components/emotes-list/emotes-list.component';
import { EVENTS } from '@popup/constants';
import { EmoteTooltip } from '@shared/components/emote-tooltip';
import type { EventEmitter } from '@shared/event-emitter';
import { type GlobalEmotesState } from '@shared/models';
import { Store } from '@shared/store';
import { Component } from './component';

export class GlobalEmotesComponent extends Component {
	public static readonly className = 'global-emotes';
	public readonly name = GlobalEmotesComponent.name;
	private _globalEmotesState: GlobalEmotesState | null = null;
	private readonly _tooltip: EmoteTooltip | null = null;
	private _emotesList: EmotesListComponent | null = null;

	constructor($root: HTMLElement, emitter: EventEmitter) {
		super($root, { emitter });

		this._tooltip = new EmoteTooltip(this.$root);

		this._emitter.on(EVENTS.GLOBAL_EMOTES_OPEN, async () => {
			this._globalEmotesState = await Store.getGlobalEmotesState();

			if (this._globalEmotesState) {
				const emotesByProvider = await Store.getGlobalEmotesByProvider();
				this._emotesList = createGlobalEmotesListComponent(this._globalEmotesState, emotesByProvider);
				await this._emotesList.init();
				this.$root.append(this._emotesList.root);
			}

			this._show();
		});

		this._emitter.on(EVENTS.LOGOUT, async () => {
			await this._hide();
		});

		this._emitter.on(EVENTS.BACK_BUTTON_CLICK, async () => {
			await this._hide();
		});
	}

	public override async destroy(): Promise<void> {
		await super.destroy();
		this._tooltip?.destroy();
	}

	private async _reset(): Promise<void> {
		await this._emotesList?.destroy();
		this._emotesList = null;
	}

	private _show(): void {
		this.$root.classList.add('global-emotes--show');
	}

	private async _hide(): Promise<void> {
		this.$root.classList.remove('global-emotes--show');
		await this._reset();
	}
}
