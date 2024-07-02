import {TypeT} from '../../common/types/cards'

export const STRENGTHS: Record<TypeT, Array<TypeT>> = {
	balanced: [],
	builder: ['terraform'],
	explorer: ['builder'],
	farm: ['explorer'],
	miner: ['prankster', 'redstone'],
	prankster: ['pvp', 'builder'],
	pvp: ['speedrunner', 'farm'],
	redstone: ['pvp'],
	speedrunner: ['miner', 'prankster'],
	terraform: ['redstone'],
}
