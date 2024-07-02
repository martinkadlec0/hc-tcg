import {STATUS_EFFECT_CLASSES} from '../status-effects'
import {CardPosModel, getCardPos} from '../models/card-pos-model'
import {GameModel} from '../models/game-model'
import {RowPos, SlotInfo} from '../types/cards'
import {
	StatusEffectT,
	GenericActionResult,
	PlayerState,
	RowStateWithHermit,
} from '../types/game-state'

export function getActiveRow(player: PlayerState): RowStateWithHermit | null {
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

export function applySingleUse(game: GameModel, slotInfo?: SlotInfo): GenericActionResult {
	const {currentPlayer} = game

	const suCard = currentPlayer.board.singleUseCard
	if (!suCard) return 'FAILURE_NOT_APPLICABLE'
	const pos = getCardPos(game, suCard.instance)
	if (!pos) return 'FAILURE_UNKNOWN_ERROR'

	const cardInstance = currentPlayer.board.singleUseCard?.instance
	if (!cardInstance) return 'FAILURE_NOT_APPLICABLE'

	currentPlayer.hooks.beforeApply.call()

	currentPlayer.board.singleUseCardUsed = true

	currentPlayer.hooks.onApply.call()

	// This can only be done once per turn
	game.addCompletedActions('PLAY_SINGLE_USE_CARD')

	// Create the logs
	game.battleLog.addPlayCardEntry(suCard.card, pos, currentPlayer.coinFlips, slotInfo)

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
	targetInstance: string | undefined
): GenericActionResult {
	if (!targetInstance) return 'FAILURE_INVALID_DATA'

	const pos = getCardPos(game, targetInstance)

	if (!pos) return 'FAILURE_INVALID_DATA'

	const statusEffect = STATUS_EFFECT_CLASSES[statusEffectId]
	const statusEffectInstance = Math.random().toString()

	const statusEffectInfo: StatusEffectT = {
		statusEffectId: statusEffectId,
		statusEffectInstance: statusEffectInstance,
		targetInstance: targetInstance,
		damageEffect: statusEffect.damageEffect,
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
	game.battleLog.addRemoveStatusEffectEntry(statusEffectObject)
	game.state.statusEffects = game.state.statusEffects.filter((a) => !statusEffects.includes(a))

	return 'SUCCESS'
}
