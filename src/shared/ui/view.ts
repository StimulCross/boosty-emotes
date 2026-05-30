export abstract class View<Props extends object = object> {
	public readonly $root: HTMLElement
	protected readonly _props: Props

	protected constructor(tagName: keyof HTMLElementTagNameMap, props: Props, className?: string | string[]) {
		this.$root = document.createElement(tagName)

		if (className) {
			const cls = Array.isArray(className) ? className : [className]
			this.$root.classList.add(...cls)
		}

		this._props = props
	}

	public mount(container: HTMLElement): void {
		container.append(this.$root)
		this._bindEvents()
	}

	public unmount(): void {
		this._unbindEvents()
		this.$root.remove()
	}

	protected _bindEvents(): void {
		// no-op
	}

	protected _unbindEvents(): void {
		// no-op
	}
}
