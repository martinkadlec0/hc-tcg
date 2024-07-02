import Card, {Hermit, hermit} from '../../base/card'

class PoultrymanCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'poultryman_common',
		numericId: 136,
		name: 'Poultry Man',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'prankster',
		health: 260,
		primary: {
			name: 'Eggscuse Me',
			cost: ['prankster'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Eggsplosion',
			cost: ['prankster', 'prankster'],
			damage: 80,
			power: null,
		},
	}
}

export default PoultrymanCommonHermitCard
