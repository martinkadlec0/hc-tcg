import Card, {hermit, Hermit} from '../../base/card'

class HorseHeadHypnoCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'horseheadhypno_common',
		numericId: 232,
		name: 'Horse Head Hypno',
		shortName: 'H. H. Hypno',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 1,
		type: 'farm',
		health: 260,
		primary: {
			name: 'I.O.U.',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Profit',
			cost: ['farm', 'farm', 'farm'],
			damage: 100,
			power: null,
		},
	}
}

export default HorseHeadHypnoCommonHermitCard
