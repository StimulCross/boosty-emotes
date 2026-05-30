import type { Theme } from '@shared/types'
import type { EmotesPriority } from '@shared/types/emotes-priority.ts'
import type { Controller } from '@shared/ui'
import type { SettingsState, SettingsStateKeys } from './settings.view.ts'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { setTheme } from '../../shared/utils/set-theme.ts'
import { SettingsView } from './settings.view.ts'

export class SettingsController implements Controller {
	private readonly _logger = createAppLogger('SettingsController')
	private readonly _view: SettingsView
	private _currentState: SettingsState | null = null
	private _isMounted = false

	constructor() {
		this._view = new SettingsView({
			onChange: (key, value) => void this._handleChange(key, value as SettingsState[keyof SettingsState]),
			onPriorityReorder: (idx, direction) => void this._handlePriorityReorder(idx, direction),
		})
	}

	public async init(): Promise<void> {
		await this._refresh()
	}

	public mount(container: HTMLElement): void {
		if (this._isMounted)
			return

		this._view.mount(container)
		this._isMounted = true
	}

	public unmount(): void {
		if (!this._isMounted)
			return

		this._view.unmount()
		this._isMounted = false
	}

	private async _refresh(): Promise<void> {
		const [theme, autocompletionSettings] = await Promise.all([
			storage.settings.getTheme(),
			storage.settings.getAutocompletionSettings(),
		])

		this._currentState = { theme, ...autocompletionSettings }
		this._view.render(this._currentState)
	}

	private async _handleChange(key: SettingsStateKeys, value: SettingsState[keyof SettingsState]): Promise<void> {
		if (!this._currentState)
			return

		// @ts-expect-error Types 🤷‍♂️
		this._currentState[key] = value
		this._view.render(this._currentState)

		try {
			if (key === 'theme') {
				await storage.settings.setTheme(value as Theme)
				setTheme(value as Theme)
			}
			else {
				await storage.settings.updateAutocompletionSettings({ [key]: value })
			}

			this._logger.debug(`Setting "${key}" updated to "${String(value)}"`)
		}
		catch (err) {
			this._logger.error(`Failed to update setting "${key}"`, err)
			this._view.render(this._currentState)

			await this._refresh()
		}
	}

	private async _handlePriorityReorder(fromIdx: number, toIdx: number): Promise<void> {
		if (!this._currentState)
			return

		const priority = [...this._currentState.priority] as EmotesPriority

		if (fromIdx < 0 || fromIdx >= priority.length || toIdx < 0 || toIdx >= priority.length || fromIdx === toIdx)
			return

		const [movedItem] = priority.splice(fromIdx, 1)

		priority.splice(toIdx, 0, movedItem)

		this._currentState.priority = priority
		this._view.render(this._currentState)

		try {
			await storage.settings.updateAutocompletionSettings({ priority })
			this._logger.debug('Priority updated', priority)
		}
		catch (err) {
			this._logger.error('Failed to update priority', err)
		}
	}
}
