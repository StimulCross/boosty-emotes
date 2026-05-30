import type { EmoteViewModel } from '@shared/models'
import type { EmoteProvider, EmoteScope } from '@shared/types'
import type { EmotePickerTab } from './constants.ts'
import { View } from '@shared/ui'
import { html } from 'code-tag'
import { Formatter } from '../../../popup/shared/utils/formatter.ts'
import { EMOTE_PICKER_TABS } from './constants.ts'
import { renderEmoteSet } from './emote-picker-emote-set.template.ts'
import { renderEmotePickerTab } from './emote-picker-tabs.template.ts'
import styles from './emote-picker.module.css'
import { renderEmotePicker } from './emote-picker.template.ts'

export interface EmotePickerViewState {
	searchQuery: string
	activeTab: EmotePickerTab
	visibleTabs: EmotePickerTab[]
	emotes: Record<EmoteScope, EmoteViewModel[]>
	isChannelCollapsed: boolean
	isGlobalCollapsed: boolean
}

export interface EmotePickerViewProps {
	onSearch: (query: string) => void
	onTabSelect: (tab: EmotePickerTab) => void
	onScopeToggle: (scope: EmoteScope, isCollapsed: boolean) => void
	onEmoteClick: (
		provider: EmoteProvider,
		id: string,
		scope: EmoteScope,
		isCtrl: boolean,
		btn: HTMLButtonElement,
	) => Promise<void>
}

export class EmotePickerView extends View<EmotePickerViewProps> {
	private _searchInput!: HTMLInputElement
	private _tabsContainer!: HTMLElement
	private _bodyContainer!: HTMLElement
	private readonly _tabs: Map<EmotePickerTab, HTMLElement> = new Map()

	constructor(props: EmotePickerViewProps) {
		super('div', props, styles.root)
		this._initTemplate()
	}

	public render(state: EmotePickerViewState): void {
		if (this._searchInput.value !== state.searchQuery)
			this._searchInput.value = state.searchQuery

		let currentTab: EmotePickerTab | undefined

		for (const [tabName, node] of this._tabs.entries()) {
			if (node.classList.contains(styles.tabActive)) {
				currentTab = tabName

				break
			}
		}

		this.renderTabs(state.visibleTabs, state.activeTab)

		if (currentTab !== state.activeTab || this._bodyContainer.childElementCount === 0) {
			let bodyHtml = ''

			if (state.emotes.channel.length > 0) {
				const title = browser.i18n.getMessage('emote_channel_set_title')

				bodyHtml += renderEmoteSet(
					state.activeTab,
					'channel',
					title,
					state.emotes.channel,
					state.isChannelCollapsed,
				)
			}

			if (state.emotes.global.length > 0) {
				const title = browser.i18n.getMessage('emote_global_set_title')

				bodyHtml += renderEmoteSet(
					state.activeTab,
					'global',
					title,
					state.emotes.global,
					state.isGlobalCollapsed,
				)
			}

			this._bodyContainer.innerHTML = bodyHtml || html`<div>${browser.i18n.getMessage('emote_set_empty')}</div>`
		}

		this.filterEmotes(state.searchQuery)
	}

	public renderTabs(visibleTabs: EmotePickerTab[], activeTab: EmotePickerTab): void {
		for (const [tabName, node] of this._tabs.entries()) {
			const isVisible = visibleTabs.includes(tabName)
			const isActive = tabName === activeTab

			node.classList.toggle(styles.tabHidden, !isVisible)
			node.classList.toggle(styles.tabActive, isActive)
		}
	}

	public filterEmotes(query: string): void {
		const lowerQuery = query.toLowerCase()
		const emoteSets = this._bodyContainer.querySelectorAll<HTMLElement>(`.${styles.emoteSet}`)

		for (const emoteSet of emoteSets) {
			const items = emoteSet.querySelectorAll<HTMLLIElement>(`.${styles.emoteItem}`)
			let visibleCount = 0

			for (const item of items) {
				const name = item.dataset.name

				if (!lowerQuery || name?.includes(lowerQuery)) {
					item.classList.remove(styles.emoteItemHidden)
					visibleCount += 1
				}
				else {
					item.classList.add(styles.emoteItemHidden)
				}
			}

			const countSlot = emoteSet.querySelector<HTMLElement>(`[data-slot="emote-set-count"]`)

			if (countSlot)
				countSlot.textContent = Formatter.formatNumber(visibleCount)

			emoteSet.classList.toggle(styles.emoteSetHidden, visibleCount === 0)
		}
	}

	public toggleFavorite(provider: string, id: string, isFavorite: boolean): void {
		const btn = this._bodyContainer.querySelector<HTMLButtonElement>(
			`button[data-id="${id}"][data-provider="${provider}"]`,
		)

		if (!btn)
			return

		if (isFavorite)
			btn.classList.add(styles.favoriteEmote)

		else
			btn.classList.remove(styles.favoriteEmote)
	}

	public removeEmoteNode(id: string, provider: string): void {
		const btns = this._bodyContainer.querySelectorAll(`button[data-id="${id}"][data-provider="${provider}"]`)

		for (const btn of btns)
			btn.parentElement?.remove()
	}

	protected override _bindEvents(): void {
		this._searchInput.addEventListener('input', this._onInput)
		this._tabsContainer.addEventListener('click', this._onTabClick)
		this._bodyContainer.addEventListener('click', this._onBodyClick)
	}

	protected override _unbindEvents(): void {
		this._searchInput.removeEventListener('input', this._onInput)
		this._tabsContainer.removeEventListener('click', this._onTabClick)
		this._bodyContainer.removeEventListener('click', this._onBodyClick)
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderEmotePicker()

		const tabsSlot = this.$root.querySelector<HTMLElement>('[data-slot="tabs"]')
		const bodySlot = this.$root.querySelector<HTMLElement>('[data-slot="body"]')
		const searchInput = this.$root.querySelector<HTMLInputElement>(`.${styles.searchInput}`)

		if (!tabsSlot || !bodySlot || !searchInput)
			throw new Error('Emote picker slots not found in template: tabs, body, searchInput')

		this._tabsContainer = tabsSlot
		this._tabsContainer.innerHTML = EMOTE_PICKER_TABS.map(tab => renderEmotePickerTab(tab, false, false)).join('')

		for (const tab of EMOTE_PICKER_TABS) {
			const node = this._tabsContainer.querySelector<HTMLElement>(`[data-tab="${tab}"]`)

			if (node)
				this._tabs.set(tab, node)
		}

		this._bodyContainer = bodySlot
		this._searchInput = searchInput
	}

	private readonly _onInput = (evt: Event): void => {
		if (!(evt.target instanceof HTMLInputElement))
			return

		const query = evt.target.value.replaceAll(/\s+/gu, '')

		this._props.onSearch(query)
	}

	private readonly _onTabClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const tab = evt.target.closest<HTMLElement>(`.${styles.tab}`)

		if (tab)
			this._props.onTabSelect(tab.dataset.tab as EmotePickerTab)
	}

	private readonly _onBodyClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const emoteBtn = evt.target.closest<HTMLButtonElement>('button[data-action="picker-emote-click"]')

		if (emoteBtn) {
			const provider = emoteBtn.dataset.provider as EmoteProvider
			const id = emoteBtn.dataset.id ?? ''
			const scope = emoteBtn.dataset.scope as EmoteScope
			const isCtrl = evt.ctrlKey || evt.altKey

			void this._props.onEmoteClick(provider, id, scope, isCtrl, emoteBtn)

			return
		}

		const emoteSetHeader = evt.target.closest<HTMLButtonElement>(`.${styles.emoteSetHeader}`)

		if (emoteSetHeader) {
			const set = emoteSetHeader.closest<HTMLElement>(`.${styles.emoteSet}`)

			if (!set)
				throw new Error('Emote set not found')

			const scope = set.dataset.scope as EmoteScope

			set.classList.toggle(styles.emoteSetCollapsed)
			const isCollapsed = set.classList.contains(styles.emoteSetCollapsed)

			this._props.onScopeToggle(scope, isCollapsed)
		}
	}
}
