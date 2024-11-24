import { type EmotePickerEmoteSets } from './emote-picker-emote-sets';

export class EmotePickerBody {
	constructor(
		private readonly $root: HTMLDivElement,
		private readonly _providerEmoteSets: EmotePickerEmoteSets[]
	) {
		this.$root.classList.add('BE-emote-picker__body');
		this._providerEmoteSets.forEach(set => this.$root.append(set.root));
	}

	public get root(): HTMLDivElement {
		return this.$root;
	}

	public init(): void {
		this._providerEmoteSets.forEach(set => set.init());
	}

	public destroy(): void {
		this._providerEmoteSets.forEach(set => set.destroy());
	}
}
