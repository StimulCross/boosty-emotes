export interface Controller {
	mount: (container: HTMLElement) => void
	unmount: () => void
	init?: () => Promise<void>
}
