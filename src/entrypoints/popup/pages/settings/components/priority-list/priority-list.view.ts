import { View } from '@shared/ui/view.ts'
import styles from './priority-list.module.css'
import { renderPriorityList } from './priority-list.template.ts'

export interface PriorityListViewProps {
	providers: string[]
	onReorder: (fromIndex: number, toIndex: number) => void
}

export class PriorityListView extends View<PriorityListViewProps> {
	private _draggedItem: HTMLElement | null = null
	private _draggedStartIndex: number = -1

	constructor(props: PriorityListViewProps) {
		super('div', props, styles.root)
		this.render(props.providers)
	}

	public render(providers: string[]): void {
		this._props.providers = providers
		this.$root.innerHTML = renderPriorityList('priority-list', providers)
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._handleClick)
		this.$root.addEventListener('dragstart', this._handleDragStart)
		this.$root.addEventListener('dragover', this._handleDragOver)
		this.$root.addEventListener('drop', this._handleDrop)
		this.$root.addEventListener('dragend', this._handleDragEnd)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._handleClick)
		this.$root.removeEventListener('dragstart', this._handleDragStart)
		this.$root.removeEventListener('dragover', this._handleDragOver)
		this.$root.removeEventListener('drop', this._handleDrop)
		this.$root.removeEventListener('dragend', this._handleDragEnd)
	}

	private readonly _handleClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const target = evt.target

		const btnUp = target.closest<HTMLButtonElement>('[data-action="move-up"]')
		const btnDown = target.closest<HTMLButtonElement>('[data-action="move-down"]')

		if (!btnUp && !btnDown)
			return

		const indexNode = target.closest<HTMLElement>('[data-index]')
		const idx = Number.parseInt(indexNode?.dataset.index ?? '0', 10)

		if (btnUp)
			this._props.onReorder(idx, idx - 1)

		else if (btnDown)
			this._props.onReorder(idx, idx + 1)
	}

	private readonly _handleDragStart = (evt: DragEvent): void => {
		const target = evt.target as HTMLElement
		const item = target.closest<HTMLElement>('li[draggable=true]')

		if (!item)
			return

		this._draggedItem = item
		this._draggedStartIndex = Number.parseInt(item.dataset.index ?? '-1', 10)

		setTimeout(() => item.classList.add(styles.dragging), 0)

		if (evt.dataTransfer)
			evt.dataTransfer.effectAllowed = 'move'
	}

	private readonly _handleDragOver = (evt: DragEvent): void => {
		evt.preventDefault()

		if (!this._draggedItem)
			return

		const target = evt.target as HTMLElement
		const overItem = target.closest<HTMLElement>('li[draggable=true]')

		if (!overItem || this._draggedItem === overItem)
			return

		const list = overItem.parentElement

		if (!list)
			return

		const rect = overItem.getBoundingClientRect()
		const overHalf = rect.top + rect.height / 2
		const isAfter = evt.clientY > overHalf

		if (isAfter)
			list.insertBefore(this._draggedItem, overItem.nextSibling)

		else
			list.insertBefore(this._draggedItem, overItem)
	}

	private readonly _handleDrop = (evt: DragEvent): void => {
		evt.preventDefault()
	}

	private readonly _handleDragEnd = (): void => {
		if (!this._draggedItem)
			return

		this._draggedItem.classList.remove(styles.dragging)

		const listItems = [...this.$root.querySelectorAll('li[draggable="true"]')]
		const newIdx = listItems.indexOf(this._draggedItem)

		if (this._draggedStartIndex !== -1 && newIdx !== -1 && this._draggedStartIndex !== newIdx)
			this._props.onReorder(this._draggedStartIndex, newIdx)

		this._draggedItem = null
		this._draggedStartIndex = -1
	}
}
