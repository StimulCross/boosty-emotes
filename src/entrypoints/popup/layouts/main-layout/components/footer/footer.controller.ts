import { FooterView } from './footer.view.ts'

export class FooterController {
	private readonly _view: FooterView

	constructor() {
		this._view = new FooterView()
	}

	public mount(container: HTMLElement): void {
		this._view.mount(container)
	}

	public unmount(): void {
		this._view.unmount()
	}
}
