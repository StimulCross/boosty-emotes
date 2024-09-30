import { BoostyEmote } from '@shared/models/emotes';

export const boostyEmotes: BoostyEmote[] = [
	{
		id: '05df7389-a9e9-4a51-aefc-96c9c374175c',
		name: 'Heart'
	},
	{
		id: '7b3fda0d-5ea9-4e66-a8bd-a19c590c8cef',
		name: 'ClappingHands'
	},
	{
		id: 'bb6e8aaf-4ac6-4f71-b8a5-b9307f86071b',
		name: 'HighVoltage'
	},
	{
		id: '3f26b442-06b1-4b94-b9bd-3a1af887057e',
		name: 'BeamingFace'
	},
	{
		id: '2f73c11d-ed75-4638-bb2c-4d6911d95e63',
		name: 'PartyPopper'
	},
	{
		id: '67198e42-128a-4a41-bf7a-94d7c98bb44f',
		name: 'Star'
	},
	{
		id: '5781617f-106b-4c05-bec0-f55d3904307a',
		name: 'Gemstone'
	},
	{
		id: '1ad0dde5-846e-4c54-a20f-2d54a8ab1b85',
		name: 'Gaspar'
	},
	{
		id: '84149636-8701-4d5b-a92d-445ebc49d39c',
		name: 'Hurt'
	},
	{
		id: '3a7d0922-8dc1-4175-90bc-561d3d2bda7d',
		name: 'MoneyFace'
	},
	{
		id: 'da0661bb-aae6-4e54-87fa-0c4065ec435b',
		name: 'Rocket'
	},
	{
		id: '9db7bb0d-1148-4686-9d0c-643d2c94837b',
		name: 'ExplodingHead'
	},
	{
		id: '37a6e1ec-f63a-416f-88d4-63e48a68c71b',
		name: 'ThinkingFace'
	},
	{
		id: 'bc1334a6-af7e-4618-b37e-2be63bf8a112',
		name: 'CheckMark'
	},
	{
		id: '663cbbdf-639e-4dac-8912-6a580d3ef3e6',
		name: 'CallMe'
	},
	{
		id: '517b1805-13dd-43ed-ac65-bfa0fd0d16b8',
		name: 'Burn'
	},
	{
		id: '4cd3b821-ec9c-4d35-827e-30be025c3ca0',
		name: 'FaceScreaming'
	},
	{
		id: '6d674dd1-789c-408f-9ab4-912e9a8d2539',
		name: 'LoudlyFace'
	},
	{
		id: 'f3a31f3c-24b4-4760-a577-10fb0cce8605',
		name: 'NauseatedFace'
	},
	{
		id: 'eb55272b-0724-4854-ad44-899ad286a992',
		name: 'Eggplant'
	},
	{
		id: 'c00141f1-7f23-4841-b8c1-e3cd85f8f5bb',
		name: 'Apple'
	},
	{
		id: '0b02f581-876f-4b38-823e-00d8c026dc39',
		name: 'Peach'
	},
	{
		id: 'deb46686-294c-49ae-b987-6df4d41e2b9d',
		name: 'Hamburger'
	},
	{
		id: '5969bcfa-3dc5-4e1b-95dd-b7a1567220fb',
		name: 'Pizza'
	},
	{
		id: '04541c27-5491-49f6-b70d-aefbdff0884c',
		name: 'Banana'
	},
	{
		id: '90ccef34-14cf-4528-8763-0d993d892dfe',
		name: 'Moon'
	},
	{
		id: '76119773-3a29-4548-b4c8-811f7fdc2936',
		name: 'Sun'
	},
	{
		id: '58b34b35-4d64-45d1-852e-274206dd90b7',
		name: 'ColdFace'
	},
	{
		id: 'fd3780a9-05f7-46fe-92ec-c5f6f2ef5aa3',
		name: 'Devil'
	},
	{
		id: '97cb65d2-15b7-42d2-9d44-6165f16f3e6e',
		name: 'Shield'
	},
	{
		id: 'fedfd339-daaf-4bff-857f-4d68ae9e5727',
		name: 'SweatDroplets'
	},
	{
		id: '58852139-f95e-4238-9c1c-871fa6d0889a',
		name: 'Beach'
	},
	{
		id: '10f3bc42-fc33-437b-a452-de97c748ca22',
		name: 'Ball'
	},
	{
		id: '5388e3ce-e4d5-4b0c-ba4c-5b58d8d35db9',
		name: 'Gift'
	},
	{
		id: '9c3d8ff6-bf13-4255-b8ff-30b9c9c98162',
		name: 'MyPressF'
	},
	{
		id: '97101bae-9beb-47b0-bfe2-70ac24bce094',
		name: 'MyIlluminati'
	}
].map(
	emote =>
		new BoostyEmote({
			scope: 'global',
			id: emote.id,
			name: emote.name
		})
);

export const boostyEmotesMap = new Map(boostyEmotes.map(emote => [emote.id, emote]));
