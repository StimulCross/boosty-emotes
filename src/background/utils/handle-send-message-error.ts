import { type Logger } from '@stimulcross/logger';

export function handleSendMessageError(e: unknown, logger: Logger): void {
	if (!(e instanceof Error) || !e.message.includes('Receiving end does not exist')) {
		logger.warn(e);
	}
}
