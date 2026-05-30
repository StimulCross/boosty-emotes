import { View } from '@shared/ui/view.ts'
import styles from './main-layout.module.css'
import { renderMainLayout } from './main-layout.template.ts'

export class MainLayoutView extends View {
	private _header!: HTMLElement
	private _content!: HTMLElement
	private _footer!: HTMLElement

	constructor() {
		super('div', {}, styles.main)
		this._initTemplate()
	}

	public get headerSlot(): HTMLElement {
		return this._header
	}

	public get contentSlot(): HTMLElement {
		return this._content
	}

	public get footerSlot(): HTMLElement {
		return this._footer
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderMainLayout()

		const header = this.$root.querySelector<HTMLDivElement>('[data-slot=header]')
		const content = this.$root.querySelector<HTMLDivElement>('[data-slot=content]')
		const footer = this.$root.querySelector<HTMLDivElement>('[data-slot=footer]')

		if (!header || !content || !footer) {
			throw new Error('Main layout template is invalid')
		}

		this._header = header
		this._content = content
		this._footer = footer
	}
}
