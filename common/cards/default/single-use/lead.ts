import {CARDS} from '../..'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {
	applySingleUse,
	getActiveRow,
	getActiveRowPos,
	getRowsWithEmptyItemsSlots,
	getSlotPos,
	rowHasItem,
} from '../../../utils/board'
import {swapSlots} from '../../../utils/movement'
import SingleUseCard from '../../base/single-use-card'

// @NOWTODO
class LeadSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'lead',
			numericId: 75,
			name: 'Lead',
			rarity: 'common',
			description:
				"Move 1 of your opponent's active Hermit item cards to any of their AFK Hermits.\n\nReceiving Hermit must have open item card slot.",
		})
	}

	override canAttach(game: GameModel, pos: CardPosModel) {
		const canAttach = super.canAttach(game, pos)
		if (canAttach !== 'YES') return canAttach

		const {opponentPlayer} = pos

		const activeRow = getActiveRow(opponentPlayer)
		if (!activeRow || !rowHasItem(activeRow)) return 'NO'
		const rowsWithEmptySlots = getRowsWithEmptyItemsSlots(opponentPlayer, true)
		if (rowsWithEmptySlots.length === 0) return 'NO'

		//@NOWTODO check canAttachToSlot

		return 'NO'
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const itemIndexKey = this.getInstanceKey(instance, 'itemIndex')

		game.addPickRequest({
			playerId: player.id,
			id: this.id,
			message: "Pick an item card attached to your opponent's active Hermit",
			onResult(pickResult) {
				if (pickResult.playerId !== opponentPlayer.id) return 'FAILURE_INVALID_PLAYER'

				const rowIndex = pickResult.rowIndex
				if (rowIndex === undefined) return 'FAILURE_INVALID_SLOT'
				if (rowIndex !== opponentPlayer.board.activeRow) return 'FAILURE_INVALID_SLOT'

				if (pickResult.slot.type !== 'item') return 'FAILURE_INVALID_SLOT'
				if (!pickResult.card) return 'FAILURE_INVALID_SLOT'

				// Store the index of the chosen item
				player.custom[itemIndexKey] = pickResult.slot.index

				return 'SUCCESS'
			},
		})
		game.addPickRequest({
			playerId: player.id,
			id: this.id,
			message: "Pick an empty item slot on one of your opponent's AFK Hermits",
			onResult(pickResult) {
				if (pickResult.playerId !== opponentPlayer.id) return 'FAILURE_INVALID_PLAYER'

				const rowIndex = pickResult.rowIndex
				if (rowIndex === undefined) return 'FAILURE_INVALID_SLOT'
				if (rowIndex === opponentPlayer.board.activeRow) return 'FAILURE_INVALID_SLOT'
				const row = opponentPlayer.board.rows[rowIndex]
				if (!row) return 'FAILURE_INVALID_SLOT'

				if (pickResult.slot.type !== 'item') return 'FAILURE_INVALID_SLOT'
				// Slot must be empty
				if (pickResult.card) return 'FAILURE_INVALID_SLOT'

				// Get the index of the chosen item
				const itemIndex: number | undefined = player.custom[itemIndexKey]

				const opponentActivePos = getActiveRowPos(opponentPlayer)

				if (itemIndex === undefined || !opponentActivePos) {
					// Something went wrong, just return success
					// To clarify, the problem here is that if itemIndex is null this pick request will never be able to succeed if we don't do this
					// @TODO is a better failsafe mechanism needed for 2 picks in a row?
					return 'SUCCESS'
				}

				// Make sure we can attach the item
				// @NOWTODO need to call canAttachToSlot
				const itemCard = opponentActivePos.row.itemCards[itemIndex]

				// Move the item
				const itemPos = getSlotPos(opponentPlayer, opponentActivePos.rowIndex, 'item', itemIndex)
				const targetPos = getSlotPos(opponentPlayer, rowIndex, 'item', pickResult.slot.index)
				swapSlots(game, itemPos, targetPos)

				const cardInfo = CARDS[itemCard!.cardId]
				applySingleUse(game, [
					[`to move `, 'plain'],
					[
						`${cardInfo.name}${
							cardInfo.type === 'item' ? (cardInfo.rarity === 'rare' ? ' item x2' : ' item') : ''
						} `,
						'opponent',
					],
				])
				delete player.custom[itemIndexKey]

				return 'SUCCESS'
			},
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const itemIndexKey = this.getInstanceKey(instance, 'itemIndex')
		delete player.custom[itemIndexKey]
	}
}

export default LeadSingleUseCard
