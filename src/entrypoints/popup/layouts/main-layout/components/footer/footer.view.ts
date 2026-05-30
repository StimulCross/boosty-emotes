import { View } from '@shared/ui'
import styles from './footer.module.css'
import { renderFooter } from './footer.template.ts'

export class FooterView extends View {
	constructor() {
		super('div', {}, styles.root)
		this._initTemplate()
	}

	private _initTemplate(): void {
		this.$root.innerHTML = renderFooter()
	}
}
