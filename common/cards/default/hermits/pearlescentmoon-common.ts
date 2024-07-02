import Card, {Hermit, hermit} from '../../base/card'

class PearlescentMoonCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'pearlescentmoon_common',
		numericId: 84,
		name: 'Pearl',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'builder',
		health: 270,
		primary: {
			name: '5 AM',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: "What's This?",
			cost: ['builder', 'builder', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default PearlescentMoonCommonHermitCard
