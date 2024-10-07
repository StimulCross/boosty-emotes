import { createLogger } from '@stimulcross/logger';
import { EventEmitter } from '@shared/event-emitter';
import { type User } from '@shared/models';
import type { ThirdPartyEmoteProvider, ThirdPartyProviderEmotesSets } from '@shared/types';
import { createLoggerOptions } from '@shared/utils/create-logger-options';
import { EmotesListBodyComponent } from './emotes-list-body.component';
import { EmotesListProvidersComponent } from './emotes-list-providers.component';
import { EmotesListSearchComponent } from './emotes-list-search.component';
import { EmotesListSetComponent } from './emotes-list-set.component';
import { EmotesListComponent } from './emotes-list.component';

function getUpdatedDateForSet(user: User, provider: ThirdPartyEmoteProvider): number {
	switch (provider) {
		case 'twitch':
			return user.state.twitchEmotesUpdatedAt;

		case '7tv':
			return user.state.sevenTvEmotesUpdatedAt;

		case 'ffz':
			return user.state.ffzEmotesUpdatedAt;

		case 'bttv':
			return user.state.bttvEmotesUpdatedAt;

		default:
			throw new Error(`Unknown provider: ${provider}`);
	}
}

export function createUserEmotesListComponent(
	user: User,
	emoteSetsByProvider: ThirdPartyProviderEmotesSets
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
							getUpdatedDateForSet(user, provider)
						)
				)
			)
		],
		emitter
	);
}
