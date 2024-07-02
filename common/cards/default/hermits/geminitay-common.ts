import Card, {Hermit, hermit} from '../../base/card'

class GeminiTayCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'geminitay_common',
		numericId: 27,
		name: 'Gem',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		type: 'builder',
		health: 300,
		primary: {
			name: 'Cottagecore',
			cost: ['builder'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Be Great',
			cost: ['builder', 'builder', 'builder'],
			damage: 100,
			power: null,
		},
	}
}

export default GeminiTayCommonHermitCard
