import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {getActiveRow, getNonEmptyRows} from '../../../utils/board'
import HermitCard from '../../base/hermit-card'

class LDShadowLadyRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'ldshadowlady_rare',
			numericId: 211,
			name: 'Lizzie',
			rarity: 'rare',
			hermitType: 'terraform',
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

			const opponentOccupiedRows = getNonEmptyRows(opponentPlayer, false, true)

			if (opponentOccupiedRows.length === opponentPlayer.board.rows.length) return
			if (opponentPlayer.board.activeRow === null) return

			// Make sure opponent Hermit isn't dead
			if (getActiveRow(opponentPlayer)?.health === 0) return

			// Add a new pick request to the opponent player
			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: "Move your opponent's active Hermit to a new slot.",
				onResult(pickResult) {
					// Validation
					if (pickResult.playerId !== opponentPlayer.id) return 'FAILURE_INVALID_PLAYER'
					if (pickResult.rowIndex === undefined) return 'FAILURE_INVALID_SLOT'
					if (pickResult.slot.type !== 'hermit') return 'FAILURE_INVALID_SLOT'
					if (pickResult.card !== null) return 'FAILURE_INVALID_SLOT'
					if (pickResult.rowIndex === opponentPlayer.board.activeRow) return 'FAILURE_WRONG_PICK'
					if (opponentPlayer.board.activeRow === null) return 'FAILURE_INVALID_DATA'

					game.swapRows(opponentPlayer, opponentPlayer.board.activeRow, pickResult.rowIndex)

					return 'SUCCESS'
				},
				onTimeout() {
					if (opponentPlayer.board.activeRow === null) return

					const filledRowNumbers = getNonEmptyRows(opponentPlayer).map((r) => r.rowIndex)
					const emptyRows = [0, 1, 2, 3, 4].filter((n) => !filledRowNumbers.includes(n))

					if (emptyRows.length === 0) return

					const pickedRowIndex = emptyRows[Math.floor(Math.random() * emptyRows.length)]

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
