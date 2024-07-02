import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import HermitCard from '../../base/hermit-card'

class LDShadowLadyRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'ldshadowlady_rare',
			numericId: 211,
			name: 'Lizzie',
			rarity: 'rare',
			type: 'terraform',
			health: 290,
			primary: {
				name: 'Fairy Fort',
				cost: ['terraform'],
				damage: 50,
				power: null,
			},
			secondary: {
				name: 'Evict',
				cost: ['terraform', 'terraform', 'any'],
				damage: 90,
				power:
					"Move your opponent's active Hermit and any attached cards to an open slot on their board, if one is available.",
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			if (
				attack.id !== this.getInstanceKey(instance) ||
				attack.type !== 'secondary' ||
				!attack.getTarget()
			)
				return

			if (!game.someSlotFulfills(slot.every(slot.opponent, slot.hermitSlot, slot.activeRow))) return

			const pickCondition = slot.every(
				slot.empty,
				slot.hermitSlot,
				slot.opponent,
				slot.not(slot.activeRow)
			)

			if (!game.someSlotFulfills(pickCondition)) return

			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: "Move your opponent's active Hermit to a new slot.",
				canPick: pickCondition,
				onResult(pickedSlot) {
					if (pickedSlot.rowIndex === null) return
					if (opponentPlayer.board.activeRow === null) return

					game.swapRows(opponentPlayer, opponentPlayer.board.activeRow, pickedSlot.rowIndex)
				},
				onTimeout() {
					if (opponentPlayer.board.activeRow === null) return

					const emptyHermitSlots = game.filterSlots(pickCondition)

					const pickedRowIndex =
						emptyHermitSlots[Math.floor(Math.random() * emptyHermitSlots.length)].rowIndex

					if (!pickedRowIndex) return

					game.swapRows(opponentPlayer, opponentPlayer.board.activeRow, pickedRowIndex)
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.afterAttack.remove(instance)
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

export default LDShadowLadyRareHermitCard
