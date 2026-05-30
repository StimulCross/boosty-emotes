import type { CommandMessage, EventMessage, Message } from '@shared/messaging'
import { createAppLogger } from '@shared/utils'

export type CommandHandler<T extends CommandMessage = CommandMessage, R = unknown> = (
	message: T,
	sender: Browser.runtime.MessageSender,
) => Promise<R> | R

export type EventHandler<T extends EventMessage = EventMessage> = (
	message: T,
	sender: Browser.runtime.MessageSender,
) => Promise<void> | void

export class MessageReceiver {
	private readonly _logger = createAppLogger('MessageReceiver')

	private readonly _commandHandlers = new Map<string, CommandHandler<never>>()
	private readonly _eventHandlers = new Map<string, Set<EventHandler<never>>>()

	public init(): void {
		// eslint-disable-next-line ts/no-misused-promises
		browser.runtime.onMessage.addListener(async (msg, sender) => {
			const message = msg as Message | undefined

			if (!message?.type) {
				this._logger.warn('Received invalid message format', msg)

				return
			}

			const commandHandler = this._commandHandlers.get(message.type)

			if (commandHandler) {
				this._logger.debug(`Executing command: [${message.type}]`)

				return await Promise
					.resolve(commandHandler(message as never, sender))
					.catch(err => {
						this._logger.error(`Error executing command [${message.type}]:`, err)
						throw err
					})
			}

			const eventHandlers = this._eventHandlers.get(message.type)

			if (eventHandlers && eventHandlers.size > 0) {
				this._logger.debug(`Processing event: [${message.type}]`)

				for (const handler of eventHandlers) {
					Promise
						.resolve(handler(message as never, sender))
						.catch(err =>
							this._logger.error(`Error processing event [${message.type}]:`, err),
						)
				}

				return
			}
		})

		this._logger.info('Initialized')
	}

	public registerCommand<T extends CommandMessage, R = unknown>(
		type: T['type'],
		handler: CommandHandler<T, R>,
	): void {
		if (this._commandHandlers.has(type))
			this._logger.warn(`Command [${type}] already has a handler. Overwriting.`)

		this._commandHandlers.set(type, handler)

		this._logger.debug(`Registered command handler: [${type}]`)
	}

	public unregisterCommand<T extends CommandMessage>(type: T['type']): void {
		this._commandHandlers.delete(type)

		this._logger.debug(`Unregistered command handler: [${type}]`)
	}

	public registerEvent<T extends EventMessage>(type: T['type'], handler: EventHandler<T>): void {
		let handlers = this._eventHandlers.get(type)

		if (!handlers) {
			handlers = new Set()
			this._eventHandlers.set(type, handlers)
		}

		handlers.add(handler)

		this._logger.debug(`Registered event handler: [${type}]`)
	}

	public unregisterEvent<T extends EventMessage>(type: T['type'], handler: EventHandler<T>): void {
		const handlers = this._eventHandlers.get(type)

		if (handlers) {
			handlers.delete(handler)

			if (handlers.size === 0)
				this._eventHandlers.delete(type)

			this._logger.debug(`Unregistered event handler: [${type}]`)
		}
	}
}
