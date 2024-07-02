import {call} from 'typed-redux-saga'
import {AttackModel} from 'common/models/attack-model'
import {GameModel} from 'common/models/game-model'
import {DEBUG_CONFIG} from 'common/config'
import {HermitAttackType} from 'common/types/attack'
import {GenericActionResult} from 'common/types/game-state'
import {CardPosModel, getCardPos} from 'common/models/card-pos-model'
import {AttackActionData, attackActionToAttack} from 'common/types/action-data'
import {getActiveRow} from 'common/utils/board'
import {executeAttacks} from 'common/utils/attacks'

function getAttack(
	game: GameModel,
	attackPos: CardPosModel,
	hermitAttackType: HermitAttackType
): Array<AttackModel> {
	const {currentPlayer} = game
	const attacks: Array<AttackModel> = []

	if (!attackPos.row || !attackPos.row.hermitCard) return []

	// hermit attacks
	const hermitCard = attackPos.row.hermitCard
	if (!hermitCard.card.isHermit()) return []

	const nextAttack = hermitCard.card.getAttack(
		game,
		attackPos.row.hermitCard.instance,
		attackPos,
		hermitAttackType
	)

	if (nextAttack) attacks.push(nextAttack)

	// all other attacks
	const otherAttacks = currentPlayer.hooks.getAttack.call()
	otherAttacks.forEach((otherAttack) => {
		if (otherAttack) attacks.push(otherAttack)
	})

	if (DEBUG_CONFIG.oneShotMode) {
		for (let i = 0; i < attacks.length; i++) {
			attacks[i].addDamage('debug', 1001)
		}
	}

	return attacks
}

function* attackSaga(
	game: GameModel,
	turnAction: AttackActionData,
	checkForRequests = true
): Generator<any, GenericActionResult> {
	if (!turnAction?.type) {
		return 'FAILURE_INVALID_DATA'
	}

	const hermitAttackType = attackActionToAttack[turnAction.type]
	const {currentPlayer, opponentPlayer, state} = game
	const activeInstance = getActiveRow(currentPlayer)?.hermitCard?.instance
	if (!activeInstance) return 'FAILURE_CANNOT_COMPLETE'

	if (checkForRequests) {
		// First allow cards to add attack requests
		currentPlayer.hooks.getAttackRequests.call(activeInstance, hermitAttackType)

		if (game.hasActiveRequests()) {
			// We have some pick/modal requests that we want to execute before the attack
			// The code for picking new actions will automatically send the right action back to client
			state.turn.currentAttack = hermitAttackType

			return 'SUCCESS'
		}
	}

	// Attacker
	const playerBoard = currentPlayer.board
	const attackIndex = playerBoard.activeRow
	if (attackIndex === null) return 'FAILURE_CANNOT_COMPLETE'

	const attackRow = playerBoard.rows[attackIndex]
	if (!attackRow.hermitCard) return 'FAILURE_CANNOT_COMPLETE'
	const attackPos = getCardPos(game, attackRow.hermitCard.instance)
	if (!attackPos) return 'FAILURE_UNKNOWN_ERROR'

	// Defender
	const opponentBoard = opponentPlayer.board
	const defenceIndex = opponentBoard.activeRow
	if (defenceIndex === null) return 'FAILURE_CANNOT_COMPLETE'

	const defenceRow = opponentBoard.rows[defenceIndex]
	if (!defenceRow.hermitCard) return 'FAILURE_CANNOT_COMPLETE'

	// Get initial attacks
	let attacks: Array<AttackModel> = getAttack(game, attackPos, hermitAttackType)

	const thisAttackSU = game.currentPlayer.board.singleUseCard

	// Run all the code stuff
	executeAttacks(game, attacks)

	attacks.forEach((attack) => {
		game.battleLog.addAttackEntry(attack, game.currentPlayer.coinFlips, thisAttackSU)
	})

	game.battleLog.opponentCoinFlipEntry(currentPlayer.coinFlips)

	if (currentPlayer.coinFlips.length === 0) {
		game.battleLog.sendLogs()
	}

	return 'SUCCESS'
}

export default attackSaga
