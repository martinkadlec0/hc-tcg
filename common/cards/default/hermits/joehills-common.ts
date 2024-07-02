import Card, {Hermit, hermit} from '../../base/card'

class JoeHillsCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'joehills_common',
		numericId: 69,
		name: 'Joe',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'explorer',
		health: 270,
		primary: {
			name: 'Howdy',
			cost: ['any'],
			damage: 30,
			power: null,
		},
		secondary: {
			name: 'Haiku',
			cost: ['explorer', 'explorer', 'any'],
			damage: 90,
			power: null,
		},
	}
}

export default JoeHillsCommonHermitCard
