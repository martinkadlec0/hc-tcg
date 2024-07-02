import Card, {hermit, Hermit} from '../../base/card'

class WormManCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'wormman_common',
		numericId: 240,
		name: 'Worm Man',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'terraform',
		health: 290,
		primary: {
			name: 'Justice!',
			cost: ['terraform'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Away!',
			cost: ['terraform', 'terraform', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default WormManCommonHermitCard
