import Card, {hermit, Hermit} from '../../base/card'

class DwarfImpulseCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'dwarfimpulse_common',
		numericId: 229,
		name: 'Dwarf Impulse',
		shortName: 'D. Impulse',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'farm',
		health: 250,
		primary: {
			name: 'Beard Bash',
			cost: ['farm'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Diggy Diggy',
			cost: ['farm', 'any'],
			damage: 70,
			power: null,
		},
	}
}

export default DwarfImpulseCommonHermitCard
