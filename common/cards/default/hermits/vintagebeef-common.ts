import Card, {Hermit, hermit} from '../../base/card'

class VintageBeefCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'vintagebeef_common',
		numericId: 102,
		name: 'Beef',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'balanced',
		health: 250,
		primary: {
			name: 'Hey Guys!',
			cost: ['any'],
			damage: 30,
			power: null,
		},
		secondary: {
			name: 'Mindcrack',
			cost: ['balanced', 'balanced'],
			damage: 80,
			power: null,
		},
	}
}

export default VintageBeefCommonHermitCard
