import Card, {hermit, Hermit} from '../../base/card'

class OriginalXbCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'originalxb_common',
		numericId: 234,
		name: 'Original xB',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 1,
		type: 'miner',
		health: 280,
		primary: {
			name: 'Hellooo?',
			cost: ['miner'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'So Good',
			cost: ['miner', 'miner', 'miner'],
			damage: 100,
			power: null,
		},
	}
}

export default OriginalXbCommonHermitCard
