import type { EmoteAutocompletionSettings } from '@shared/models'
import type { Theme } from '@shared/types'
import { View } from '@shared/ui/view.ts'
import animationStyles from '../../shared/styles/animations.module.css'
import scrollYStyles from '../../shared/styles/scroll-container-y.module.css'
import { PriorityListView } from './components/priority-list/priority-list.view.ts'
import styles from './settings.module.css'
import { renderSettings } from './settings.template.ts'

export type SettingsStateKeys = keyof SettingsState

export interface SettingsState extends EmoteAutocompletionSettings {
	theme: Theme
}

export interface SettingsViewProps {
	onChange: (key: SettingsStateKeys, value: string | boolean | number) => void
	onPriorityReorder: (fromIdx: number, toIdx: number) => void
}

export class SettingsView extends View<SettingsViewProps> {
	private _formElements: Array<HTMLInputElement | HTMLSelectElement> = []
	private _priorityContainer!: HTMLElement
	private _priorityListView!: PriorityListView

	constructor(props: SettingsViewProps) {
		super('div', props, [styles.root, scrollYStyles.scrollContainerY, animationStyles.contentFadeIn])

		this._initTemplate()
	}

	public render(state: SettingsState): void {
		for (const el of this._formElements) {
			const key = el.name as SettingsStateKeys
			const value = state[key] as (typeof state)[SettingsStateKeys] | undefined

			if (value === undefined)
				continue

			if (el instanceof HTMLInputElement && el.type === 'checkbox') {
				if (el.checked !== value)
					el.checked = value as boolean
			}
			else {
				const strValue = String(value)

				if (el.value !== strValue)
					el.value = strValue
			}
		}

		if (state.sortByPriority) {
			this._priorityListView.render(state.priority)
			this._priorityContainer.style.display = 'block'
		}
		else {
			this._priorityContainer.style.display = 'none'
		}
	}

	public override unmount(): void {
		this._priorityListView.unmount()
		super.unmount()
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('change', this._handleChange)
		this.$root.addEventListener('wheel', this._onWheel, { passive: false })
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('change', this._handleChange)
		this.$root.removeEventListener('wheel', this._onWheel)
	}

	private readonly _handleChange = (evt: Event): void => {
		const target = evt.target

		if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement) || !target.name)
			return

		let value: string | number | boolean = target.value

		if (target instanceof HTMLInputElement) {
			if (target.type === 'checkbox') {
				value = target.checked
			}
			else if (target.type === 'number') {
				value = Number.parseInt(target.value, 10)

				if (target.name === ('limit' satisfies SettingsStateKeys)) {
					if (Number.isNaN(value) || value < 1) {
						value = 1
					}
					else if (value > 25) {
						value = 25
						target.value = '25'
					}
				}
			}
		}

		this._props.onChange(target.name as SettingsStateKeys, value)

		if (target.name === 'sortByPriority' && value === true) {
			requestAnimationFrame(() => {
				this._priorityContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
			})
		}
	}

	private readonly _onWheel = (evt: WheelEvent): void => {
		const target = evt.target

		if (target instanceof HTMLInputElement && target.type === 'number') {
			evt.preventDefault()

			if (target.disabled || target.readOnly)
				return

			const step = target.step ? Number(target.step) : 1
			const min = target.min ? Number(target.min) : -Infinity
			const max = target.max ? Number(target.max) : Infinity

			const direction = evt.deltaY > 0 ? -1 : 1
			let newValue = Number(target.value) + step * direction

			if (newValue < min)
				newValue = min

			if (newValue > max)
				newValue = max

			target.value = String(newValue)
			target.dispatchEvent(new Event('change', { bubbles: true }))
		}
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderSettings()

		this._formElements = [...this.$root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]')]
		const priorityContainer = this.$root.querySelector<HTMLElement>('[data-slot="emote-priority-list"]')

		if (!priorityContainer)
			throw new Error('Priority container not found in settings template')

		this._priorityContainer = priorityContainer

		this._priorityListView = new PriorityListView({
			providers: [],
			onReorder: (from, to) => this._props.onPriorityReorder(from, to),
		})

		this._priorityListView.mount(this._priorityContainer)
	}
}
