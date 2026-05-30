import { MessageDispatcher, MessageReceiver } from '@shared/messaging'
import { storage } from '@shared/storage'
import { createAppLogger } from '@shared/utils'
import { AppRouter } from './app.router.ts'
import { Formatter } from './shared/utils/formatter.ts'
import { setTheme } from './shared/utils/set-theme.ts'
import 'core-js/features/iterator'
import './styles/common.css'
import './styles/reset.css'
import './styles/app.css'

async function main(): Promise<void> {
	const logger = createAppLogger('Popup')

	logger.debug('Starting...')

	const theme = await storage.settings.getTheme()

	if (theme !== 'auto')
		setTheme(theme)

	await Formatter.init()

	const root = document.createElement('div')

	root.id = 'app'

	document.body.append(root)

	const messageDispatcher = new MessageDispatcher()
	const messageReceiver = new MessageReceiver()

	const app = new AppRouter({ container: root, messageReceiver, messageDispatcher })

	await app.init()

	logger.success('Started')
}

void main()
