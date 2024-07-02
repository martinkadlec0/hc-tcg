import Card, {Hermit, hermit} from '../../base/card'

class TangoTekCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'tangotek_common',
		numericId: 94,
		name: 'Tango',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'redstone',
		health: 300,
		primary: {
			name: 'Thing-ificator',
			cost: ['redstone'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Hat Trick',
			cost: ['redstone', 'any'],
			damage: 70,
			power: null,
		},
	}
}

export default TangoTekCommonHermitCard
