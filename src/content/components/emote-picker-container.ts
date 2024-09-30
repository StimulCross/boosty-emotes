import { EmotePicker, type RedactorsState } from '@content/components';
import { createEmotePickerOverlay } from '@content/templates';
import { type EventEmitter } from '@shared/event-emitter';
import { type Emote } from '@shared/models';
import { Store } from '@shared/store';
import { type EmoteProvider } from '@shared/types';

export interface EmotePickerStyleOptions {
	zIndex?: number;
	bottomOffset?: number;
}

export class EmotePickerContainer {
	private _currentEmotePickerActiveButton: HTMLElement | null = null;
	private _emotePicker: EmotePicker | null = null;
	private _emotePickerOverlay: HTMLElement | null = null;

	constructor(
		private readonly $root: HTMLElement,
		private readonly _publisherRootClassNames: string[],
		private readonly _emitter: EventEmitter,
		private readonly _redactorsState: RedactorsState,
		private readonly _styleOptions?: EmotePickerStyleOptions
	) {}

	public get isShown(): boolean {
		return this._currentEmotePickerActiveButton !== null || this._emotePicker !== null;
	}

	public async show(
		button: HTMLElement,
		globalEmotesByProvider: Map<EmoteProvider, Map<string, Emote>>,
		channelEmotesByProvider: Map<EmoteProvider, Map<string, Emote>>
	): Promise<void> {
		let publisherRoot: Node | null = null;

		for (const className of this._publisherRootClassNames) {
			const el = button.closest(`[class*="${className}"]`);

			if (el) {
				publisherRoot = el;
				break;
			}
		}

		if (!(publisherRoot instanceof HTMLElement)) {
			this.hide();
			return;
		}

		this._currentEmotePickerActiveButton = button;
		this._currentEmotePickerActiveButton.classList.add('BE-emote-picker__button--active');

		const emotePickerState = await Store.getEmotePickerState();
		this._emotePicker = new EmotePicker(
			document.createElement('div'),
			this._emitter,
			publisherRoot,
			this._redactorsState,
			emotePickerState,
			globalEmotesByProvider,
			channelEmotesByProvider,
			this._styleOptions?.bottomOffset
		);
		this._emotePickerOverlay = createEmotePickerOverlay(this._styleOptions?.zIndex);
		this.$root.append(this._emotePickerOverlay);
	}

	public hide(): void {
		if (this._emotePicker) {
			this._emotePicker.destroy();
			this._emotePicker = null;
		}

		if (this._currentEmotePickerActiveButton) {
			this._currentEmotePickerActiveButton.classList.remove('BE-emote-picker__button--active');
			this._currentEmotePickerActiveButton = null;
		}

		if (this._emotePickerOverlay) {
			this._emotePickerOverlay.remove();
			this._emotePickerOverlay = null;
		}
	}
}
