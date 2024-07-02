import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applyStatusEffect} from '../../../utils/board'
import HermitCard from '../../base/hermit-card'

class Biffa2001RareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'biffa2001_rare',
			numericId: 206,
			name: 'Biffa',
			rarity: 'rare',
			type: 'miner',
			health: 290,
			primary: {
				name: 'O.H.O',
				cost: ['miner'],
				damage: 40,
				power: null,
			},
			secondary: {
				name: "Biffa's Museum",
				cost: ['miner', 'any'],
				damage: 70,
				power: 'For each card you played or used this turn, this attack does 20 more damage.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		applyStatusEffect(game, 'museum-collection', instance)

		player.hooks.onTurnStart.add(instance, () => {
			applyStatusEffect(game, 'museum-collection', instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onTurnStart.remove(instance)
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override getPalette() {
		return 'advent_of_tcg'
	}

	override getBackground() {
		return 'advent_of_tcg'
	}
}

export default Biffa2001RareHermitCard
