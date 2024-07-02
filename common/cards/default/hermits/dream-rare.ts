import Card, {Hermit, hermit} from '../../base/card'

class DreamRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'dream_rare',
		numericId: 117,
		name: 'Dream',
		expansion: 'dream',
		rarity: 'rare',
		tokens: 0,
		type: 'speedrunner',
		health: 290,
		primary: {
			name: "C'mere",
			cost: ['speedrunner', 'any'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Transition',
			cost: ['speedrunner', 'speedrunner', 'any'],
			damage: 90,
			power: 'Flip a Coin.\nIf heads, HP is set randomly between 10-290.',
		},
	}
}

export default DreamRareHermitCard
