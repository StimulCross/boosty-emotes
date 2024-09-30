import { createLogger } from '@stimulcross/logger';
import { EventEmitter } from '@shared/event-emitter';
import { type Emote, type GlobalEmotesState } from '@shared/models';
import type { ThirdPartyEmoteProvider } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmotesListBodyComponent } from './emotes-list-body.component';
import { EmotesListProvidersComponent } from './emotes-list-providers.component';
import { EmotesListSearchComponent } from './emotes-list-search.component';
import { EmotesListSetComponent } from './emotes-list-set.component';
import { EmotesListComponent } from './emotes-list.component';

function getUpdatedDateForSet(globalEmotesState: GlobalEmotesState, provider: ThirdPartyEmoteProvider): number {
	switch (provider) {
		case 'twitch':
			return globalEmotesState.twitchGlobalEmotesUpdatedAt;

		case '7tv':
			return globalEmotesState.sevenTvGlobalEmotesUpdatedAt;

		case 'ffz':
			return globalEmotesState.ffzGlobalEmotesUpdatedAt;

		case 'bttv':
			return globalEmotesState.bttvGlobalEmotesUpdatedAt;

		default:
			throw new Error(`Unknown provider: ${provider}`);
	}
}

export function createGlobalEmotesListComponent(
	globalEmotesState: GlobalEmotesState,
	emoteSetsByProvider: Map<ThirdPartyEmoteProvider, Map<string, Emote>>
): EmotesListComponent {
	const emitter = new EventEmitter();
	const logger = createLogger(createLoggerOptions(EmotesListComponent.name));

	let activeProvider: ThirdPartyEmoteProvider = 'twitch';

	for (const [provider, set] of emoteSetsByProvider.entries()) {
		if (set.size > 0) {
			activeProvider = provider;
			break;
		}
	}

	return new EmotesListComponent(
		[
			new EmotesListProvidersComponent(emitter, logger, activeProvider),
			new EmotesListSearchComponent(emitter, logger),
			new EmotesListBodyComponent(
				emitter,
				[...emoteSetsByProvider].map(
					([provider, set]) =>
						new EmotesListSetComponent(
							emitter,
							logger,
							provider,
							activeProvider,
							set,
							getUpdatedDateForSet(globalEmotesState, provider)
						)
				)
			)
		],
		emitter
	);
}
