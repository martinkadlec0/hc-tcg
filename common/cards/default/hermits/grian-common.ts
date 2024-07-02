import Card, {Hermit, hermit} from '../../base/card'

class GrianCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'grian_common',
		numericId: 34,
		name: 'Grian',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'builder',
		health: 300,
		primary: {
			name: 'Copper Golem',
			cost: ['builder'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Waffle',
			cost: ['builder', 'any'],
			damage: 70,
			power: null,
		},
	}
}

export default GrianCommonHermitCard
