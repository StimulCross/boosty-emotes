import type { Logger, LogLevel } from '@stimulcross/logger'
import { LOGGER_APPLICATION_NAME } from '@shared/constants'
import { createLogger } from '@stimulcross/logger'

export function createAppLogger(context: string, minLevel?: LogLevel): Logger {
	return createLogger({

		applicationName: LOGGER_APPLICATION_NAME,
		timestamps: true,
		colors: true,
		context,
		// eslint-disable-next-line ts/no-unsafe-assignment
		minLevel: (minLevel ?? import.meta.env.WXT_LOGGER_MIN_LEVEL) || undefined,
	})
}
