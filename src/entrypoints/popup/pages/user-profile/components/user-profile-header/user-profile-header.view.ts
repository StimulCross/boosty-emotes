import type { User } from '@shared/models'
import { View } from '@shared/ui'
import styles from './user-profile-header.module.css'
import { renderUserProfileHeader } from './user-profile-header.template.ts'

export class UserProfileHeaderView extends View {
	constructor() {
		super('div', {}, styles.root)
	}

	public render(user: User): void {
		this.$root.innerHTML = renderUserProfileHeader(user)
	}
}
