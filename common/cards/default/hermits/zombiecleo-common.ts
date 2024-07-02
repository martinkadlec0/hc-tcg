import Card, {Hermit, hermit} from '../../base/card'

class ZombieCleoCommonHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'zombiecleo_common',
		numericId: 115,
		name: 'Cleo',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'builder',
		health: 260,
		primary: {
			name: "It's Fine",
			cost: ['builder'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Revenge',
			cost: ['builder', 'builder'],
			damage: 80,
			power: null,
		},
	}
}

export default ZombieCleoCommonHermitCard
