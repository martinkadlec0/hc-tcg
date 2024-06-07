import {CARDS, ITEM_CARDS} from '../cards'
import {STATUS_EFFECT_CLASSES} from '../status-effects'
import {CardPosModel, getCardPos} from '../models/card-pos-model'
import {GameModel} from '../models/game-model'
import {BoardSlotTypeT, RowPos, SlotPos} from '../types/cards'
import {
	CardT,
	StatusEffectT,
	GenericActionResult,
	PlayerState,
	RowState,
	RowStateWithHermit,
} from '../types/game-state'
import {BattleLogFormatT} from '../models/battle-log-model'

export function getActiveRow(player: PlayerState) {
	if (player.board.activeRow === null) return null
	const row = player.board.rows[player.board.activeRow]
	if (!row.hermitCard) return null
	return row
}

export function getActiveRowPos(player: PlayerState): RowPos | null {
	const rowIndex = player.board.activeRow
	if (rowIndex === null) return null
	const row = player.board.rows[rowIndex]
	if (!row.hermitCard) return null
	return {
		player: player,
		rowIndex,
		row,
	}
}
export function getRowPos(cardPos: CardPosModel): RowPos | null {
	const rowIndex = cardPos.rowIndex
	if (rowIndex === null) return null
	const row = cardPos.row
	if (!row?.hermitCard) return null
	return {
		player: cardPos.player,
		rowIndex,
		row,
	}
}

export function getSlotPos(
	player: PlayerState,
	rowIndex: number,
	type: BoardSlotTypeT,
	index = 0
): SlotPos {
	return {
		player,
		rowIndex,
		row: player.board.rows[rowIndex],
		slot: {
			type,
			index,
		},
	}
}

export function rowHasItem(row: RowState): boolean {
	const itemCards = row.itemCards
	let total = 0
	for (const itemCard of itemCards) {
		if (!itemCard) continue
		const cardInfo = ITEM_CARDS[itemCard.cardId]
		// String
		if (!cardInfo) continue
		total += 1
	}

	return total > 0
}

export function rowHasEmptyItemSlot(row: RowStateWithHermit): boolean {
	return row.itemCards.filter((card) => !card).length > 0
}

export function isRowFull(row: RowStateWithHermit): boolean {
	return row.itemCards.filter((card) => !!card).length === 3
}

export function isRowEmpty(row: RowStateWithHermit): boolean {
	return row.itemCards.filter((card) => !!card).length === 0
}

// @NOTE - ignoreNegativeHealth should be true when being used in afterAttack,
// as health may be below 0 but hermits will not have been removed from the board yet
export function getNonEmptyRows(
	playerState: PlayerState,
	ignoreActive: boolean = false,
	ignoreNegativeHealth: boolean = false
): Array<RowPos> {
	const rows: Array<RowPos> = []
	const activeRowIndex = playerState.board.activeRow
	for (let i = 0; i < playerState.board.rows.length; i++) {
		const row = playerState.board.rows[i]
		if (i === activeRowIndex && ignoreActive) continue
		if ((!row.health || row.health < 0) && ignoreNegativeHealth) continue
		if (row.hermitCard) rows.push({player: playerState, rowIndex: i, row})
	}
	return rows
}

export function getRowsWithEmptyItemsSlots(
	playerState: PlayerState,
	ignoreActive: boolean = false
): RowStateWithHermit[] {
	const result: Array<RowStateWithHermit> = []
	const activeRow = playerState.board.activeRow
	const rows = playerState.board.rows
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]
		if (i === activeRow && ignoreActive) continue
		if (row.hermitCard && !isRowFull(row)) result.push(row)
	}
	return result
}

export function getAdjacentRows(playerState: PlayerState): Array<RowStateWithHermit[]> {
	const result: Array<RowStateWithHermit[]> = []
	const rows = playerState.board.rows
	for (let i = 1; i < rows.length + 1; i++) {
		const row = rows[i]
		const prevRow = rows[i - 1]
		if (row && prevRow && row.hermitCard && prevRow.hermitCard) result.push([prevRow, row])
	}
	return result
}

export function hasSingleUse(playerState: PlayerState, id: string, isUsed: boolean = false) {
	const suCard = playerState.board.singleUseCard
	const suUsed = playerState.board.singleUseCardUsed
	return suCard?.cardId === id && suUsed === isUsed
}

export function applySingleUse(
	game: GameModel,
	effectAction: BattleLogFormatT[]
): GenericActionResult {
	const {currentPlayer} = game

	const suCard = currentPlayer.board.singleUseCard
	if (!suCard) return 'FAILURE_NOT_APPLICABLE'
	const pos = getCardPos(game, suCard.cardInstance)
	if (!pos) return 'FAILURE_UNKNOWN_ERROR'

	const cardInstance = currentPlayer.board.singleUseCard?.cardInstance
	if (!cardInstance) return 'FAILURE_NOT_APPLICABLE'

	currentPlayer.hooks.beforeApply.call()

	currentPlayer.board.singleUseCardUsed = true

	game.battleLog.addApplyEffectEntry(effectAction)
	currentPlayer.hooks.onApply.call()

	// This can only be done once per turn
	game.addCompletedActions('PLAY_SINGLE_USE_CARD')

	currentPlayer.hooks.afterApply.call()

	return 'SUCCESS'
}

/**
 * Apply an statusEffect to a card instance. statusEffectId must be a status effect id, and targetInstance must be card
 * instance.
 */
export function applyStatusEffect(
	game: GameModel,
	statusEffectId: string,
	targetInstance: string | undefined,
	customStatusEffectInstance?: string,
	customDuration?: number
): GenericActionResult {
	if (!targetInstance) return 'FAILURE_INVALID_DATA'

	const pos = getCardPos(game, targetInstance)

	if (!pos) return 'FAILURE_INVALID_DATA'

	const statusEffect = STATUS_EFFECT_CLASSES[statusEffectId]
	let statusEffectInstance = Math.random().toString()
	if (customStatusEffectInstance) {
		statusEffectInstance = customStatusEffectInstance
	}

	const statusEffectInfo: StatusEffectT = {
		statusEffectId: statusEffectId,
		statusEffectInstance: statusEffectInstance,
		targetInstance: targetInstance,
		damageEffect: statusEffect.damageEffect,
		duration: customDuration,
	}

	statusEffect.onApply(game, statusEffectInfo, pos)

	if (statusEffect.duration > 0 || statusEffect.counter)
		statusEffectInfo.duration = statusEffect.duration

	return 'SUCCESS'
}

/**
 * Remove an statusEffect from the game.
 */
export function removeStatusEffect(
	game: GameModel,
	pos: CardPosModel,
	statusEffectInstance: string
): GenericActionResult {
	const statusEffects = game.state.statusEffects.filter(
		(a) => a.statusEffectInstance === statusEffectInstance
	)
	if (statusEffects.length === 0) return 'FAILURE_NOT_APPLICABLE'

	const statusEffectObject = STATUS_EFFECT_CLASSES[statusEffects[0].statusEffectId]
	statusEffectObject.onRemoval(game, statusEffects[0], pos)
	game.state.statusEffects = game.state.statusEffects.filter((a) => !statusEffects.includes(a))

	return 'SUCCESS'
}
