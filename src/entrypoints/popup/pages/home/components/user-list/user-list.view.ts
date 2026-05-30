import type { User } from '@shared/models'
import { View } from '@shared/ui/view.ts'
import { renderUserCard } from './user-card.template.ts'
import styles from './user-list.module.css'

export interface UserListProps {
	onUserCardClick: (id: string) => void
	onUserRemoved: (id: string) => void
}

export interface UserListState {
	users: User[]
}

export class UserListView extends View<UserListProps> {
	constructor(props: UserListProps) {
		super('ul', props, styles.root)
	}

	public render({ users }: UserListState): void {
		this.$root.innerHTML = users.map(renderUserCard).join('\n')
	}

	public removeUserCard(id: string): void {
		const userCard = this.$root.querySelector(`[data-twitch-user-id="${id}"]`)

		if (userCard)
			userCard.remove()
	}

	protected override _bindEvents(): void {
		this.$root.addEventListener('click', this._onClick)
	}

	protected override _unbindEvents(): void {
		this.$root.removeEventListener('click', this._onClick)
	}

	private readonly _onClick = (evt: MouseEvent): void => {
		if (!(evt.target instanceof Element))
			return

		const deleteButton = evt.target.closest<HTMLButtonElement>('button[data-action="delete-user"]')

		if (deleteButton) {
			deleteButton.disabled = true

			const userCard = deleteButton.closest<HTMLDivElement>(`.${styles.userCard}`)
			const userId = userCard?.dataset.twitchUserId

			if (!userId) {
				deleteButton.disabled = false

				return
			}

			this._props.onUserRemoved(userId)

			return
		}

		const userCard = evt.target.closest<HTMLDivElement>(`.${styles.userCard}`)
		const userId = userCard?.dataset.twitchUserId

		if (userId)
			this._props.onUserCardClick(userId)
	}
}
