import Card, {Hermit, hermit} from '../../base/card'

class KeralisCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'keralis_common',
		numericId: 71,
		name: 'Keralis',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		type: 'builder',
		health: 270,
		primary: {
			name: 'Looky Looky',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'NoNoNoNo',
			cost: ['builder', 'builder', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default KeralisCommonHermitCard
