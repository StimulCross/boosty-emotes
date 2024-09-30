import { type LoggerOptions, LogLevel } from '@stimulcross/logger';
import { LOGGER_APPLICATION_NAME } from '@shared/constants';

export function createLoggerOptions(context: string, minLevel: LogLevel = LogLevel.DEBUG): LoggerOptions {
	return {
		applicationName: LOGGER_APPLICATION_NAME,
		timestamps: true,
		colors: true,
		timeDiff: true,
		context,
		minLevel
	};
}
