import Card, {hermit, Hermit} from '../../base/card'

class SteampunkTangoCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'steampunktango_common',
		numericId: 239,
		name: 'Steampunk Tango',
		shortName: 'S. Tango',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		type: 'speedrunner',
		health: 250,
		primary: {
			name: 'Create',
			cost: ['speedrunner'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Automate',
			cost: ['speedrunner', 'any'],
			damage: 70,
			power: null,
		},
	}
}

export default SteampunkTangoCommonHermitCard
