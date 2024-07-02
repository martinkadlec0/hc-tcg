import Card, {Hermit, hermit} from '../../base/card'

class MumboJumboCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'mumbojumbo_common',
		numericId: 80,
		name: 'Mumbo',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'redstone',
		health: 270,
		primary: {
			name: 'Chuffed to Bits',
			cost: ['redstone'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Spoon',
			cost: ['redstone', 'redstone'],
			damage: 80,
			power: null,
		},
	}
}

export default MumboJumboCommonHermitCard
