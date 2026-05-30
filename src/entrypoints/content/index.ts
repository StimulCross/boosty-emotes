import { BOOSTY_MATCH_URL } from '@shared/constants.ts'
import { main } from './main.ts'

export default defineContentScript({
	matches: [BOOSTY_MATCH_URL],
	runAt: 'document_start',
	cssInjectionMode: 'manifest',
	world: 'ISOLATED',
	main,
})
