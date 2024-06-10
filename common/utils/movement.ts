import {GameModel} from '../models/game-model'
import {CardT, GameState, PlayerState} from '../types/game-state'
import {CARDS} from '../cards'
import {BasicCardPos, CardPosModel, getCardPos} from '../models/card-pos-model'
import {equalCard} from './cards'
import {SlotPos} from '../types/cards'
import {getSlotPos} from './board'
import {CanAttachResult} from '../cards/base/card'

function discardAtPos(pos: CardPosModel) {
	const {player, row, slot} = pos

	if (slot.type === 'single_use') {
		player.board.singleUseCard = null
	}

	if (!row) return

	if (slot.type === 'hermit') {
		row.hermitCard = null
	}

	if (slot.type === 'effect') {
		row.effectCard = null
	}

	if (slot.type === 'item') {
		row.itemCards[slot.index] = null
	}
}

export function discardCard(
	game: GameModel,
	card: CardT | null,
	playerDiscard?: PlayerState | null
) {
	if (!card) return

	const pos = getCardPos(game, card.cardInstance)
	if (!pos) {
		const err = new Error()
		console.log('Cannot find card on board: ', card, err.stack)
		return
	}

	if (pos.row && pos.rowIndex && pos.slot.type !== 'single_use') {
		const slotPos = getSlotPos(pos.player, pos.rowIndex, pos.slot.type, pos.slot.index)

		const results = pos.player.hooks.onSlotChange.call(slotPos)
		if (results.includes(false)) return
	}

	// Call `onDetach`
	const cardInfo = CARDS[card.cardId]
	cardInfo.onDetach(game, card.cardInstance, pos)
	pos.player.hooks.onDetach.call(card.cardInstance)

	// Remove the card
	discardAtPos(pos)

	if (playerDiscard !== null) {
		const discardPlayer = playerDiscard ? playerDiscard : pos.player

		discardPlayer.discarded.push({
			cardId: card.cardId,
			cardInstance: card.cardInstance,
		})
	}
}

export function retrieveCard(game: GameModel, card: CardT | null) {
	if (!card) return
	for (const playerId in game.state.players) {
		const player = game.state.players[playerId]
		const discarded = player.discarded
		const index = discarded.findIndex((c) => equalCard(c, card))
		if (index !== -1) {
			const retrievedCard = discarded.splice(index, 1)[0]
			player.hand.push(retrievedCard)
			return
		}
	}
}

export function discardSingleUse(game: GameModel, playerState: PlayerState) {
	const suCard = playerState.board.singleUseCard
	const suUsed = playerState.board.singleUseCardUsed
	if (!suCard) return
	const pos = getCardPos(game, suCard.cardInstance)
	if (!pos) return

	// Water and Milk Buckets can be on this slot so we use CARDS to get the card info
	const cardInfo = CARDS[suCard.cardId]
	cardInfo.onDetach(game, suCard.cardInstance, pos)

	// Call onDetach hook
	playerState.hooks.onDetach.call(suCard.cardInstance)

	playerState.board.singleUseCardUsed = false
	playerState.board.singleUseCard = null

	if (suUsed) {
		playerState.discarded.push(suCard)
	} else {
		playerState.hand.push(suCard)
	}
}

export function discardFromHand(player: PlayerState, card: CardT | null) {
	if (!card) return

	player.hand = player.hand.filter((c) => !equalCard(c, card))

	player.discarded.push({
		cardId: card.cardId,
		cardInstance: card.cardInstance,
	})
}

export function drawCards(playerState: PlayerState, amount: number) {
	for (let i = 0; i < Math.min(playerState.pile.length, amount); i++) {
		const drawCard = playerState.pile.shift()
		if (drawCard) playerState.hand.push(drawCard)
	}
}

export function moveCardToHand(game: GameModel, card: CardT, playerDiscard?: PlayerState | null) {
	const cardPos = getCardPos(game, card.cardInstance)
	if (!cardPos) return

	const cardInfo = CARDS[card.cardId]
	cardInfo.onDetach(game, card.cardInstance, cardPos)

	cardPos.player.hooks.onDetach.call(card.cardInstance)

	if (cardPos.row && cardPos.slot.type === 'hermit') {
		cardPos.row.hermitCard = null
	} else if (cardPos.row && cardPos.slot.type === 'effect') {
		cardPos.row.effectCard = null
	} else if (cardPos.row && cardPos.slot.type === 'item') {
		cardPos.row.itemCards[cardPos.slot.index] = null
	} else if (cardPos.slot.type === 'single_use') {
		cardPos.player.board.singleUseCard = null
	}

	if (playerDiscard !== null) {
		const chosenPlayer = playerDiscard ? playerDiscard : cardPos.player
		chosenPlayer.hand.push(card)
	}
}

/**Returns whether the slot is empty or not. */
export function isSlotEmpty(slotPos: SlotPos): boolean {
	const {row, slot} = slotPos
	const {index, type} = slot
	if (type === 'hermit') {
		if (!row.hermitCard) return true
	} else if (type === 'effect') {
		if (!row.effectCard) return true
	} else if (type === 'item') {
		if (!row.itemCards[index]) return true
	}

	return false
}

/**Returns a `CardT` of the card in the slot, or `null` if it's empty. */
export function getSlotCard(slotPos: SlotPos): CardT | null {
	const {row, slot} = slotPos
	const {index, type} = slot

	if (type === 'hermit') {
		return row.hermitCard
	} else if (type === 'effect') {
		return row.effectCard
	}

	return row.itemCards[index]
}

/** Filters a `CanAttachResult` to remove all `'INVALID_PLAYER'` problems for movement checks */
function exceptInvalidPlayer(
	result: CanAttachResult[number]
): result is Exclude<typeof result, 'INVALID_PLAYER'> {
	return result !== 'INVALID_PLAYER'
}

export function canAttachToSlot(
	game: GameModel,
	slotPos: SlotPos,
	card: CardT,
	excludeInvalidPlayer = false
): CanAttachResult {
	const {player, rowIndex, row, slot} = slotPos
	const opponentPlayerId = game.getPlayerIds().find((id) => id !== slotPos.player.id)
	if (!opponentPlayerId) return ['UNKNOWN_ERROR']

	const basicPos: BasicCardPos = {
		player,
		opponentPlayer: game.state.players[opponentPlayerId],
		rowIndex,
		row,
		slot,
	}

	// Create a fake card pos model
	const pos = new CardPosModel(game, basicPos, card.cardInstance, true)

	const cardInfo = CARDS[card.cardId]
	const canAttach = cardInfo.canAttach(game, pos)
	player.hooks.canAttach.call(canAttach, pos)

	if (excludeInvalidPlayer) {
		return canAttach.filter(exceptInvalidPlayer)
	}
	return canAttach
}

/** Swaps the positions of two cards on the board. Returns whether or not the swap was successful. */
export function swapSlots(
	game: GameModel,
	slotAPos: SlotPos,
	slotBPos: SlotPos,
	withoutDetach: boolean = false
): boolean {
	const {slot: slotA, row: rowA} = slotAPos
	const {slot: slotB, row: rowB} = slotBPos
	if (slotA.type !== slotB.type) return false

	// Info about non-empty slots
	const cardsInfo: any = []

	// Make sure each card can be placed in the other slot
	const cardA = getSlotCard(slotAPos)
	const cardB = getSlotCard(slotBPos)
	if (cardB) {
		// Return false if we can't attach for any reason other than wrong player
		const canAttachResult = canAttachToSlot(game, slotAPos, cardB, true)
		if (canAttachResult.length > 0) return false
	}
	if (cardA) {
		// Return false if we can't attach for any reason other than wrong player
		const canAttachResult = canAttachToSlot(game, slotBPos, cardA, true)
		if (canAttachResult.length > 0) return false
	}

	// make checks for each slot and then detach
	const slots = [slotAPos, slotBPos]
	for (let i = 0; i < slots.length; i++) {
		const slot = slots[i]

		if (isSlotEmpty(slot)) continue

		const card = getSlotCard(slot)
		if (!card) continue

		const cardPos = getCardPos(game, card.cardInstance)
		if (!cardPos) continue

		const results = cardPos.player.hooks.onSlotChange.call(slot)
		if (results.includes(false)) return false

		const cardInfo = CARDS[card.cardId]

		if (!withoutDetach) {
			cardInfo.onDetach(game, card.cardInstance, cardPos)

			cardPos.player.hooks.onDetach.call(card.cardInstance)
		}

		cardsInfo.push({cardInfo, card})
	}

	// Swap
	if (slotA.type === 'hermit') {
		const tempCard = rowA.hermitCard
		rowA.hermitCard = rowB.hermitCard
		rowB.hermitCard = tempCard
	} else if (slotA.type === 'effect') {
		const tempCard = rowA.effectCard
		rowA.effectCard = rowB.effectCard
		rowB.effectCard = tempCard
	} else if (slotA.type === 'item') {
		const tempCard = rowA.itemCards[slotA.index]
		rowA.itemCards[slotA.index] = rowB.itemCards[slotB.index]
		rowB.itemCards[slotB.index] = tempCard
	}

	if (!withoutDetach) {
		// onAttach
		for (const {cardInfo, card} of cardsInfo) {
			// New card position after swap
			const cardPos = getCardPos(game, card.cardInstance)
			if (!cardPos) continue

			cardInfo.onAttach(game, card.cardInstance, cardPos)

			cardPos.player.hooks.onAttach.call(card.cardInstance)
		}
	}

	return true
}
