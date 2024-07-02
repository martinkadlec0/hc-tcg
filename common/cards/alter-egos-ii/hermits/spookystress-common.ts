import Card, {hermit, Hermit} from '../../base/card'

class SpookyStressCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'spookystress_common',
		numericId: 238,
		name: 'Spooky Stress',
		shortName: 'S. Stress',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'pvp',
		health: 260,
		primary: {
			name: 'Giggle',
			cost: ['pvp'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Mingin',
			cost: ['pvp', 'pvp', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default SpookyStressCommonHermitCard
