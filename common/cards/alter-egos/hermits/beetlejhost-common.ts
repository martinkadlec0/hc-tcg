import Card, {Hermit, hermit} from '../../base/card'

class BeetlejhostCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'beetlejhost_common',
		numericId: 126,
		name: 'Beetlejhost',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'common',
		tokens: 1,
		type: 'speedrunner',
		health: 290,
		primary: {
			name: 'Expand',
			cost: ['speedrunner'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Chroma',
			cost: ['speedrunner', 'speedrunner', 'speedrunner'],
			damage: 100,
			power: null,
		},
	}
}

export default BeetlejhostCommonHermitCard
