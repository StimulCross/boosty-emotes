import { html } from 'code-tag'
import styles from './action-tooltip.module.css'

export const renderActionTooltip = (text: string): string => html`<div class="${styles.root}">${text}</div>`
