import {GameModel} from 'common/models/game-model'
import {equalCard} from 'common/utils/cards'
import {PlayCardActionData} from 'common/types/action-data'
import {CardPosModel} from 'common/models/card-pos-model'
import {ActionResult, CardInstance} from 'common/types/game-state'
import {DEBUG_CONFIG} from 'common/config'
import {SlotInfo} from 'common/types/cards'
import {Attach, HasHealth, Item, SingleUse} from 'common/cards/base/card'

function* playCardSaga(
	game: GameModel,
	turnAction: PlayCardActionData
): Generator<any, ActionResult> {
	// Make sure data sent from client is correct
	const pickInfo = turnAction?.payload?.pickInfo
	const localCard = turnAction?.payload?.card
	if (!pickInfo || !localCard || !pickInfo.playerId || !pickInfo) {
		return 'FAILURE_INVALID_DATA'
	}

	const card = CardInstance.fromLocalCardInstance(localCard)

	const {currentPlayer} = game

	const {playerId, rowIndex: pickedIndex, type, index} = pickInfo

	// opponentPlayerId is relative to where the card is being placed
	const opponentPlayerId = playerId === currentPlayer.id ? game.opponentPlayerId : currentPlayer.id

	// Card must be in hand to play it
	if (!currentPlayer.hand.find((handCard) => equalCard(handCard, card))) {
		return 'FAILURE_INVALID_DATA'
	}

	const player = game.state.players[playerId]
	if (!player) {
		return 'FAILURE_INVALID_DATA'
	}

	// Can't attach to hand or health slot
	if (type === 'health' || type === 'hand') {
		return 'FAILURE_INVALID_SLOT'
	}

	const row = pickedIndex !== null ? player.board.rows[pickedIndex] : null
	const rowIndex = pickedIndex === null ? null : pickedIndex
	const opponentPlayer = game.state.players[opponentPlayerId]

	// Do we meet requirements to place the card
	const canAttach = card.card.props.attachCondition(game, {
		player: player,
		opponentPlayer: opponentPlayer,
		type: pickInfo.type,
		rowIndex: pickInfo.rowIndex !== undefined ? pickInfo.rowIndex : null,
		row: row,
		index: pickInfo.index,
		card: pickInfo.card ? CardInstance.fromLocalCardInstance(pickInfo.card) : null,
	})

	// It's the wrong kind of slot or does not satisfy the condition
	if (!canAttach) return 'FAILURE_INVALID_SLOT'

	// Finally, execute depending on where we tried to place
	// And set the action result to be sent to the client

	// Single use slot
	if (type === 'single_use') {
		player.board.singleUseCard = card as CardInstance<SingleUse>
	} else {
		// All other positions requires us to have selected a valid row
		if (!row || rowIndex === null) return 'FAILURE_CANNOT_COMPLETE'

		switch (type) {
			case 'hermit': {
				player.hasPlacedHermit = true
				if (!card.card.isHealth()) return 'FAILURE_INVALID_DATA'

				row.hermitCard = card as CardInstance<HasHealth>

				// If the card is not a hermit card it will have to set the row health itself
				row.health = row.hermitCard.card.props.health

				if (player.board.activeRow === null) {
					game.changeActiveRow(player, rowIndex)
				}

				break
			}
			case 'item': {
				if (index === null) break
				if (!card.card.isItem()) return 'FAILURE_INVALID_DATA'
				row.itemCards[index] = card as CardInstance<Item>
				break
			}
			case 'attach': {
				if (!card.card.isAttach()) return 'FAILURE_INVALID_DATA'
				row.effectCard = card as CardInstance<Attach>
				break
			}
			default:
				throw new Error('Unknown slot type when trying to play a card: ' + pickInfo.type)
		}
	}

	const slotInfo: SlotInfo = {
		player,
		opponentPlayer,
		row,
		rowIndex,
		type,
		index,
		card,
	}
	const pos = new CardPosModel(game, slotInfo, card.instance)

	// Remove the card from the hand
	if (!DEBUG_CONFIG.unlimitedCards) {
		currentPlayer.hand = currentPlayer.hand.filter((handCard) => !equalCard(handCard, card))
	}

	// Add entry to battle log, unless it is played in a single use slot
	if (pickInfo.type !== 'single_use') {
		game.battleLog.addPlayCardEntry(card.card, pos, currentPlayer.coinFlips, undefined)
	}

	card.card.onAttach(game, card.instance, pos)

	// Call onAttach hook
	currentPlayer.hooks.onAttach.call(card.instance)

	return 'SUCCESS'
}

export default playCardSaga
