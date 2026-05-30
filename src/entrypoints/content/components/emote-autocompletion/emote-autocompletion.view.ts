import type { EmoteViewModel } from '@shared/models'
import type { EmoteProvider, EmoteScope } from '@shared/types'
import { View } from '@shared/ui'
import scrollYStyles from '../../styles/scroll-container-y.module.css'
import { renderEmoteAutocompletionMatch } from './emote-autocompletion-match.template.ts'
import styles from './emote-autocompletion.module.css'
import { renderEmoteAutocompletion } from './emote-autocompletion.template.ts'

export interface EmoteAutocompletionViewState {
	matches: EmoteViewModel[]
	activeIndex: number
	query: string
}

export interface EmoteAutocompletionViewProps {
	onEmoteClick: (provider: EmoteProvider, id: string, scope: EmoteScope) => void
}

export class EmoteAutocompletionView extends View<EmoteAutocompletionViewProps> {
	private _matchesContainer!: HTMLElement
	private _matchNodes: HTMLButtonElement[] = []

	constructor(props: EmoteAutocompletionViewProps) {
		super('div', props, [styles.root, scrollYStyles.scrollContainerY])

		this._initTemplate()
	}

	public render(state: EmoteAutocompletionViewState): void {
		this._matchesContainer.innerHTML = state.matches
			.map(emote => renderEmoteAutocompletionMatch(emote, state.query))
			.join('')

		this._matchNodes = [...this._matchesContainer.querySelectorAll<HTMLButtonElement>(`.${styles.match}`)]

		this.updateActiveIndex(state.activeIndex)
	}

	public updateActiveIndex(activeIndex: number): void {
		if (this._matchNodes.length === 0)
			return

		const prevActiveNode = this.$root.querySelector(`.${styles.active}`)

		if (prevActiveNode)
			prevActiveNode.classList.remove(styles.active)

		const activeNode = this._matchNodes[activeIndex] as HTMLElement | undefined

		if (!activeNode)
			return

		activeNode.classList.add(styles.active)

		// activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
		//
		// This was my pain in the ass 💩
		// scrollIntoView scrolls to the top of the page because @floating-ui computePosition is async
		// this is a workaround
		const scrollContainer = this.$root
		const nodeTop = activeNode.offsetTop
		const nodeBottom = nodeTop + activeNode.offsetHeight
		const containerScrollTop = scrollContainer.scrollTop
		const containerHeight = scrollContainer.clientHeight

		if (nodeTop < containerScrollTop) {
			scrollContainer.scrollTop = nodeTop
		}
		else if (nodeBottom > containerScrollTop + containerHeight) {
			scrollContainer.scrollTop = nodeBottom - containerHeight
		}
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._onClick)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._onClick)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderEmoteAutocompletion()
		const matchersContainer = this.$root.querySelector<HTMLElement>(`.${styles.matches}`)

		if (!matchersContainer)
			throw new Error('Emote autocompletion container not found')

		this._matchesContainer = matchersContainer
	}

	private readonly _onClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const matchNode = evt.target.closest<HTMLElement>('li[data-item-type="emote-autocompletion-match"]')

		if (matchNode) {
			const provider = matchNode.dataset.provider as EmoteProvider
			const id = matchNode.dataset.id ?? ''
			const scope = matchNode.dataset.scope as EmoteScope

			this._props.onEmoteClick(provider, id, scope)
		}
	}
}
