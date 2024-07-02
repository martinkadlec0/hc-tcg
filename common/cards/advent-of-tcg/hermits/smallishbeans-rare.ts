import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {getActiveRowPos} from '../../../utils/board'
import HermitCard from '../../base/hermit-card'

class SmallishbeansRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'smallishbeans_rare',
			numericId: 219,
			name: 'Joel',
			rarity: 'rare',
			type: 'pvp',
			health: 280,
			primary: {
				name: '11ft',
				cost: ['pvp', 'any'],
				damage: 70,
				power: null,
			},
			secondary: {
				name: 'Lore',
				cost: ['pvp', 'pvp', 'any'],
				damage: 30,
				power: 'Deal 20 extra damage for each item attached. Double items count twice.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, row} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			if (attack.id !== attackId || attack.type !== 'secondary') return

			const activeRow = getActiveRowPos(player)
			if (!activeRow) return

			let partialSum = 0

			activeRow.row.itemCards.forEach((item) => {
				if (!item || !item.cardId.includes('item')) return
				if (item.cardId.includes('rare')) partialSum += 1
				partialSum += 1
			})

			attack.addDamage(this.id, partialSum * 20)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
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

export default SmallishbeansRareHermitCard
