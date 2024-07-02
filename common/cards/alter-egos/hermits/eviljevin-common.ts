import Card, {Hermit, hermit} from '../../base/card'

class EvilJevinCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'eviljevin_common',
		numericId: 127,
		name: 'Evil Jevin',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'miner',
		health: 260,
		primary: {
			name: 'Pickle',
			cost: ['miner'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Slime',
			cost: ['miner', 'miner', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default EvilJevinCommonHermitCard
