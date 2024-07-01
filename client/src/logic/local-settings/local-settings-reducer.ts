import {AnyAction} from 'redux'

type LocalSettings = Record<string, any>

const getSettings = (): LocalSettings => {
	const storage = Object.entries(localStorage)
	const settings = storage.filter(([key]) => {
		return key.startsWith('settings:')
	})
	return settings.reduce((map, entry) => {
		const key = entry[0].replace(/^settings:/, '') as string
		const value = JSON.parse(entry[1])
		map[key] = value
		return map
	}, {} as LocalSettings)
}

const defaultState: LocalSettings = {
	soundVolume: '100',
	musicVolume: '75',
	voiceVolume: '75',
	profanityFilter: 'on',
	disableChat: 'off',
	confirmationDialogs: 'on',
	showChat: 'off',
	showBattleLogs: 'off',
	showAdvancedTooltips: 'on',
	chatPosition: {x: 0, y: 0},
	chatSize: {w: 0, h: 0},
	panoramaEnabled: true,
	panorama: 'hermit-hill',
	gameSide: 'Left',
	minecraftName: 'alex',
	...getSettings(),
}

const localSettingsReducer = (state = defaultState, action: AnyAction): LocalSettings => {
	switch (action.type) {
		case 'SET_SETTING':
			return {...state, [action.payload.key]: action.payload.value}
		case 'RESET_SETTING':
			return {...state, [action.payload]: defaultState[action.payload]}
		default:
			return state
	}
}

export default localSettingsReducer
