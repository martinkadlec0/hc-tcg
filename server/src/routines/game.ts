import {all, take, fork, cancel, race, delay, call, actionChannel} from 'typed-redux-saga'
import {getEmptyRow, getLocalGameState} from '../utils/state-gen'
import attackSaga from './turn-actions/attack'
import playCardSaga from './turn-actions/play-card'
import changeActiveHermitSaga from './turn-actions/change-active-hermit'
import applyEffectSaga from './turn-actions/apply-effect'
import removeEffectSaga from './turn-actions/remove-effect'
import chatSaga from './background/chat'
import connectionStatusSaga from './background/connection-status'
import {CONFIG, DEBUG_CONFIG} from 'common/config'
import pickRequestSaga from './turn-actions/pick-request'
import modalRequestSaga from './turn-actions/modal-request'
import {
	TurnActions,
	CardInstance,
	PlayerState,
	ActionResult,
	TurnAction,
} from 'common/types/game-state'
import {GameModel} from 'common/models/game-model'
import {EnergyT} from 'common/types/cards'
import {hasEnoughEnergy} from 'common/utils/attacks'
import {discardCard, discardSingleUse} from 'common/utils/movement'
import {getCardPos} from 'common/models/card-pos-model'
import {printHooksState} from '../utils'
import {buffers} from 'redux-saga'
import {AttackActionData, PickCardActionData, attackToAttackAction} from 'common/types/action-data'
import {PickInfo} from 'common/types/server-requests'

////////////////////////////////////////
// @TODO sort this whole thing out properly
/////////////////////////////////////////

export const getTimerForSeconds = (seconds: number): number => {
	const maxTime = CONFIG.limits.maxTurnTime * 1000
	return Date.now() - maxTime + seconds * 1000
}

function getAvailableEnergy(game: GameModel) {
	const {currentPlayer, activeRow} = game

	let availableEnergy: Array<EnergyT> = []

	if (activeRow) {
		// Get energy from each item card
		for (let i = 0; i < activeRow.itemCards.length; i++) {
			const card = activeRow.itemCards[i]
			if (!card) continue
			const pos = getCardPos(game, card.instance)
			if (!pos) continue

			availableEnergy.push(...card.card.getEnergy(game, card.instance, pos))
		}

		// Modify available energy
		availableEnergy = currentPlayer.hooks.availableEnergy.call(availableEnergy)
	}

	return availableEnergy
}

/**Returns if an action is currently available for the player to execute.
 * To be available, an action must be in `state.turn.availableActions`, and not in `state.turn.blockedActions` or
 * `state.turn.completedActions`.
 */
function getAvailableActions(game: GameModel, availableEnergy: Array<EnergyT>): TurnActions {
	const {turn: turnState, pickRequests, modalRequests} = game.state
	const {currentPlayer} = game
	const {activeRow, rows, singleUseCard: su, singleUseCardUsed: suUsed} = currentPlayer.board
	const actions: TurnActions = []

	// Custom modals
	if (modalRequests.length > 0) {
		const request = modalRequests[0]
		if (request.playerId === currentPlayer.id) {
			return ['MODAL_REQUEST']
		} else {
			// Activate opponent action timer
			if (game.state.timer.opponentActionStartTime === null) {
				game.state.timer.turnStartTime = Date.now()
				game.state.timer.opponentActionStartTime = Date.now()
			}
			return ['WAIT_FOR_OPPONENT_ACTION']
		}
	}

	// Pick requests
	if (pickRequests.length > 0) {
		const request = pickRequests[0]
		if (request.playerId === currentPlayer.id) {
			let pickActions: TurnActions = ['PICK_REQUEST']
			if (su && !suUsed) {
				pickActions.push('REMOVE_EFFECT')
			}
			return pickActions
		} else {
			// Activate opponent action timer
			if (game.state.timer.opponentActionStartTime === null) {
				game.state.timer.turnStartTime = Date.now()
				game.state.timer.opponentActionStartTime = Date.now()
			}
			return ['WAIT_FOR_OPPONENT_ACTION']
		}
	}

	// There is no action currently active for the opponent, clear the time
	game.state.timer.opponentActionStartTime = null
	const hasOtherHermit = rows.some((row, index) => {
		return !!row.hermitCard && index !== activeRow
	})

	// Actions that require us to have an active row
	if (activeRow !== null) {
		// Change active hermit
		if (hasOtherHermit) {
			actions.push('CHANGE_ACTIVE_HERMIT')
		}

		// Su actions
		if (su && !suUsed) {
			actions.push('REMOVE_EFFECT')
			actions.push('APPLY_EFFECT')
		}

		// Attack actions
		if (activeRow !== null && turnState.turnNumber > 1) {
			const hermitCard = rows[activeRow]?.hermitCard

			// only add attack options if not sleeping
			if (hermitCard && hermitCard.card.isHermit()) {
				if (hasEnoughEnergy(availableEnergy, hermitCard.card.props.primary.cost)) {
					actions.push('PRIMARY_ATTACK')
				}
				if (hasEnoughEnergy(availableEnergy, hermitCard.card.props.secondary.cost)) {
					actions.push('SECONDARY_ATTACK')
				}
				if (su && !suUsed) {
					if (su && su.card.props.hasAttack) {
						actions.push('SINGLE_USE_ATTACK')
					}
				}
			}
		}

		// End turn action
		actions.push('END_TURN')
	}

	// Play card actions require an active row unless it's the players first turn
	if (activeRow !== null || turnState.turnNumber <= 2) {
		// Temporarily add these to see if any slots are available
		game.state.turn.availableActions.push(
			'PLAY_HERMIT_CARD',
			'PLAY_EFFECT_CARD',
			'PLAY_ITEM_CARD',
			'PLAY_SINGLE_USE_CARD'
		)
		const desiredActions = currentPlayer.hand.reduce(
			(reducer: TurnActions, card: CardInstance): TurnActions => {
				const pickableSlots = game.filterSlots(card.card.props.attachCondition)

				if (pickableSlots.length === 0) return reducer

				if (card.card.props.category === 'hermit' && !reducer.includes('PLAY_HERMIT_CARD')) {
					return [...reducer, 'PLAY_HERMIT_CARD']
				}
				if (card.card.props.category === 'attach' && !reducer.includes('PLAY_EFFECT_CARD')) {
					return [...reducer, 'PLAY_EFFECT_CARD']
				}
				if (card.card.props.category === 'item' && !reducer.includes('PLAY_ITEM_CARD')) {
					return [...reducer, 'PLAY_ITEM_CARD']
				}
				if (
					card.card.props.category === 'single_use' &&
					!reducer.includes('PLAY_SINGLE_USE_CARD')
				) {
					return [...reducer, 'PLAY_SINGLE_USE_CARD']
				}
				return reducer
			},
			[] as TurnActions
		)
		game.state.turn.availableActions = []
		actions.push(...desiredActions)
	}

	// Filter out actions that have already been completed - once an action is completed it cannot be used again for the turn
	// Also filter out blocked actions
	const blockedActions = game.getAllBlockedActions()
	let filteredActions = actions.filter((action) => {
		return !turnState.completedActions.includes(action) && !blockedActions.includes(action)
	})

	// Force add change active hermit if the active row is null
	if (activeRow === null && hasOtherHermit) {
		filteredActions.push('CHANGE_ACTIVE_HERMIT')
	}

	return filteredActions
}

function playerAction(actionType: string, playerId: string) {
	return (action: any) => action.type === actionType && action.playerId === playerId
}

// return false in case one player is dead
// @TODO completely redo how we calculate if a hermit is dead etc
function* checkHermitHealth(game: GameModel) {
	const playerStates: Array<PlayerState> = Object.values(game.state.players)
	const deadPlayerIds: Array<string> = []
	for (let playerState of playerStates) {
		// Players are not allowed to die before they place their first hermit to prevent bugs
		if (!playerState.hasPlacedHermit) {
			continue
		}

		const playerRows = playerState.board.rows
		const activeRow = playerState.board.activeRow
		for (let rowIndex in playerRows) {
			const row = playerRows[rowIndex]
			if (row.hermitCard && row.health <= 0) {
				const cardType = row.hermitCard.card.props.category

				// Add battle log entry. Non Hermit cards can create their detach message themselves.
				if (cardType === 'hermit') {
					game.battleLog.addDeathEntry(playerState, row)
				}

				discardCard(game, row.hermitCard)
				discardCard(game, row.effectCard)

				row.itemCards.forEach((itemCard) => itemCard && discardCard(game, itemCard))
				playerRows[rowIndex] = getEmptyRow()
				if (Number(rowIndex) === activeRow) {
					game.changeActiveRow(playerState, null)
					playerState.hooks.onActiveRowChange.call(activeRow, null)
				}

				// Only hermit cards give points
				if (cardType === 'hermit') {
					playerState.lives -= 1

					// reward card
					const opponentState = playerStates.find((s) => s.id !== playerState.id)
					if (!opponentState) continue
					const rewardCard = playerState.pile.shift()
					if (rewardCard) opponentState.hand.push(rewardCard)
				}
			}
		}

		const isDead = playerState.lives <= 0
		const firstPlayerTurn =
			playerState.lives >= 3 &&
			game.state.turn.turnNumber <= game.getPlayerIds().findIndex((id) => id === playerState.id) + 1

		const noHermitsLeft = !firstPlayerTurn && playerState.board.rows.every((row) => !row.hermitCard)
		if (isDead || noHermitsLeft) {
			deadPlayerIds.push(playerState.id)
		}
	}

	return deadPlayerIds
}

function* sendGameState(game: GameModel) {
	game.getPlayers().forEach((player) => {
		const localGameState = getLocalGameState(game, player)

		player.socket.emit('GAME_STATE', {
			type: 'GAME_STATE',
			payload: {
				localGameState,
			},
		})
	})
}

function* turnActionSaga(game: GameModel, turnAction: any) {
	const {currentPlayerId} = game
	const actionType = turnAction.type as TurnAction

	const availableActions =
		turnAction.playerId === currentPlayerId
			? game.state.turn.availableActions
			: game.state.turn.opponentAvailableActions

	if (!availableActions.includes(actionType)) {
		game.setLastActionResult(actionType, 'FAILURE_ACTION_NOT_AVAILABLE')
		return
	}

	let endTurn = false

	let result: ActionResult = 'FAILURE_UNKNOWN_ERROR'
	switch (actionType) {
		case 'PLAY_HERMIT_CARD':
		case 'PLAY_ITEM_CARD':
		case 'PLAY_EFFECT_CARD':
		case 'PLAY_SINGLE_USE_CARD':
			result = yield* call(playCardSaga, game, turnAction)
			break
		case 'SINGLE_USE_ATTACK':
		case 'PRIMARY_ATTACK':
		case 'SECONDARY_ATTACK':
			result = yield* call(attackSaga, game, turnAction)
			break
		case 'CHANGE_ACTIVE_HERMIT':
			result = yield* call(changeActiveHermitSaga, game, turnAction)
			break
		case 'APPLY_EFFECT':
			result = yield* call(applyEffectSaga, game, turnAction)
			break
		case 'REMOVE_EFFECT':
			result = yield* call(removeEffectSaga, game)
			break
		case 'PICK_REQUEST':
			result = yield* call(
				pickRequestSaga,
				game,
				(turnAction as PickCardActionData)?.payload?.pickResult
			)
			break
		case 'MODAL_REQUEST':
			result = yield* call(modalRequestSaga, game, turnAction?.payload?.modalResult)
			break
		case 'END_TURN':
			endTurn = true
			result = 'SUCCESS'
			break
		default:
			// Unknown action type, ignore it completely
			game.setLastActionResult(actionType, 'FAILURE_ACTION_NOT_AVAILABLE')
			return
	}

	// Set action result to be sent back to client
	game.setLastActionResult(actionType, result)

	const deadPlayerIds = yield* call(checkHermitHealth, game)
	if (deadPlayerIds.length) endTurn = true

	if (endTurn) {
		return 'END_TURN'
	}
}

function* turnActionsSaga(game: GameModel) {
	const {opponentPlayer, opponentPlayerId, currentPlayer, currentPlayerId} = game

	const turnActionChannel = yield* actionChannel(
		[
			...['PICK_REQUEST', 'MODAL_REQUEST'].map((type) => playerAction(type, opponentPlayerId)),
			...[
				'PLAY_HERMIT_CARD',
				'PLAY_ITEM_CARD',
				'PLAY_EFFECT_CARD',
				'PLAY_SINGLE_USE_CARD',
				'PICK_REQUEST',
				'MODAL_REQUEST',
				'CHANGE_ACTIVE_HERMIT',
				'APPLY_EFFECT',
				'REMOVE_EFFECT',
				'SINGLE_USE_ATTACK',
				'PRIMARY_ATTACK',
				'SECONDARY_ATTACK',
				'END_TURN',
			].map((type) => playerAction(type, currentPlayerId)),
		],
		buffers.dropping(10)
	)

	try {
		while (true) {
			if (DEBUG_CONFIG.showHooksState.enabled) printHooksState(game)

			// Available actions code
			const availableEnergy = getAvailableEnergy(game)
			let blockedActions: Array<TurnAction> = []
			let availableActions = getAvailableActions(game, availableEnergy)

			// Get blocked actions from hooks
			// @TODO this should also not really be a hook anymore
			// @TODO not only that but the blocked actions implementation needs improving, another card needs to be unable to remove another's block
			currentPlayer.hooks.blockedActions.call(blockedActions)

			blockedActions.push(...DEBUG_CONFIG.blockedActions)

			// Block SINGLE_USE_ATTACK if PRIMARY_ATTACK or SECONDARY_ATTACK aren't blocked
			if (
				(availableActions.includes('PRIMARY_ATTACK') ||
					availableActions.includes('SECONDARY_ATTACK')) &&
				(!blockedActions.includes('PRIMARY_ATTACK') || !blockedActions.includes('SECONDARY_ATTACK'))
			) {
				blockedActions.push('SINGLE_USE_ATTACK')
			}

			// Remove blocked actions from the availableActions
			availableActions = availableActions.filter((action) => !blockedActions.includes(action))

			availableActions.push(...DEBUG_CONFIG.availableActions)

			// Set final actions in state
			let opponentAction: TurnAction = 'WAIT_FOR_TURN'
			if (game.state.pickRequests[0]?.playerId === opponentPlayerId) {
				opponentAction = 'PICK_REQUEST'
			} else if (game.state.modalRequests[0]?.playerId === opponentPlayerId) {
				opponentAction = 'MODAL_REQUEST'
			}
			game.state.turn.opponentAvailableActions = [opponentAction]
			game.state.turn.availableActions = availableActions

			if (
				DEBUG_CONFIG.autoEndTurn &&
				availableActions.includes('END_TURN') &&
				availableActions.length === 1
			) {
				break
			}

			// End of available actions code

			game.updateCardsCanBePlacedIn()

			// Timer calculation
			game.state.timer.turnStartTime = game.state.timer.turnStartTime || Date.now()
			let maxTime = CONFIG.limits.maxTurnTime * 1000
			let remainingTime = game.state.timer.turnStartTime + maxTime - Date.now()

			if (availableActions.includes('WAIT_FOR_OPPONENT_ACTION')) {
				game.state.timer.opponentActionStartTime =
					game.state.timer.opponentActionStartTime || Date.now()
				maxTime = CONFIG.limits.extraActionTime * 1000
				remainingTime = game.state.timer.opponentActionStartTime + maxTime - Date.now()
			}

			const graceTime = 1000
			game.state.timer.turnRemaining = Math.floor((remainingTime + graceTime) / 1000)

			yield* call(sendGameState, game)
			game.battleLog.sendLogs()

			const raceResult = yield* race({
				turnAction: take(turnActionChannel),
				timeout: delay(remainingTime + graceTime),
			}) as any // @NOTE - need to type as any due to typed-redux-saga inferring the wrong return type for action channel

			// Reset coin flips
			currentPlayer.coinFlips = []
			opponentPlayer.coinFlips = []

			// Handle timeout
			if (raceResult.timeout) {
				// @TODO this works, but could be cleaned
				const currentAttack = game.state.turn.currentAttack
				let reset = false

				// First check to see if the opponent had a pick request active
				const currentPickRequest = game.state.pickRequests[0]
				if (currentPickRequest) {
					if (currentPickRequest.playerId === currentPlayerId) {
						if (!!currentAttack) {
							reset = true
						}
					} else {
						reset = true
					}
				}

				// Check to see if the opponent had a modal request active
				const currentModalRequest = game.state.modalRequests[0]
				if (currentModalRequest) {
					if (currentModalRequest.playerId === currentPlayerId) {
						if (!!currentAttack) {
							reset = true
						}
					} else {
						reset = true
					}
				}

				if (reset) {
					// Timeout current request and remove it
					if (currentPickRequest) {
						game.removePickRequest()
					} else {
						game.removeModalRequest()
					}

					// Reset timer to max time
					game.state.timer.turnStartTime = Date.now()
					game.state.timer.turnRemaining = CONFIG.limits.maxTurnTime

					// Execute attack now if there's a current attack
					if (!game.hasActiveRequests() && !!currentAttack) {
						// There are no active requests left, and we're in the middle of an attack. Execute it now.
						const turnAction: AttackActionData = {
							type: attackToAttackAction[currentAttack],
							payload: {
								playerId: game.currentPlayerId,
							},
						}
						yield* call(attackSaga, game, turnAction, false)
					}

					continue
				}

				const hasActiveHermit = currentPlayer.board.activeRow !== null
				if (hasActiveHermit) {
					break
				}

				game.endInfo.reason = 'time'
				game.endInfo.deadPlayerIds = [currentPlayer.id]
				return 'GAME_END'
			}

			// Run action logic
			const result = yield* call(turnActionSaga, game, raceResult.turnAction)

			if (result === 'END_TURN') {
				break
			}
		}
	} finally {
		turnActionChannel.close()
	}
}

function* turnSaga(game: GameModel) {
	const {currentPlayerId, currentPlayer} = game

	// Reset turn state
	game.state.turn.availableActions = []
	game.state.turn.currentPlayerId = currentPlayerId
	game.state.turn.completedActions = []
	game.state.turn.blockedActions = {}
	game.state.turn.currentAttack = null

	game.state.timer.turnStartTime = Date.now()
	game.state.timer.turnRemaining = CONFIG.limits.maxTurnTime

	// Call turn start hooks

	currentPlayer.hooks.onTurnStart.call()

	// Check for dead hermits on turn start
	if (game.state.turn.turnNumber > 2) {
		const turnStartDeadPlayerIds = yield* call(checkHermitHealth, game)
		if (turnStartDeadPlayerIds.length) {
			game.endInfo.reason =
				game.state.players[turnStartDeadPlayerIds[0]].lives <= 0 ? 'lives' : 'hermits'
			game.endInfo.deadPlayerIds = turnStartDeadPlayerIds
			return 'GAME_END'
		}
	}

	const result = yield* call(turnActionsSaga, game)
	if (result === 'GAME_END') return 'GAME_END'

	// Create card draw array
	const drawCards: Array<CardInstance | null> = []

	// Call turn end hooks
	currentPlayer.hooks.onTurnEnd.call(drawCards)

	// Timeout and clear pick requests
	const pickRequests = game.state.pickRequests
	for (let i = 0; i < pickRequests.length; i++) {
		pickRequests[i].onTimeout?.()
	}
	game.state.pickRequests = []

	// Timeout and clear modal requests
	const modalRequests = game.state.modalRequests
	for (let i = 0; i < modalRequests.length; i++) {
		modalRequests[i].onTimeout()
	}
	game.state.modalRequests = []

	const deadPlayerIds = yield* call(checkHermitHealth, game)
	if (deadPlayerIds.length) {
		game.endInfo.reason = game.state.players[deadPlayerIds[0]].lives <= 0 ? 'lives' : 'hermits'
		game.endInfo.deadPlayerIds = deadPlayerIds
		return 'GAME_END'
	}

	// If player has not used his single use card return it to hand
	// otherwise move it to discarded pile
	discardSingleUse(game, currentPlayer)

	// Draw a card from deck when turn ends
	if (drawCards.length === 0) {
		const card = currentPlayer.pile.shift()
		drawCards.push(card || null)
	}

	for (let i = 0; i < drawCards.length; i++) {
		const card = drawCards[i]
		if (card) {
			currentPlayer.hand.push(card)
		} else if (
			!DEBUG_CONFIG.disableDeckOut &&
			!DEBUG_CONFIG.startWithAllCards &&
			!DEBUG_CONFIG.unlimitedCards
		) {
			game.endInfo.reason = 'cards'
			game.endInfo.deadPlayerIds = [currentPlayerId]
			return 'GAME_END'
		}
	}

	game.battleLog.addTurnEndEntry()

	return 'DONE'
}

function* backgroundTasksSaga(game: GameModel) {
	yield* all([fork(chatSaga, game), fork(connectionStatusSaga, game)])
}

function* gameSaga(game: GameModel) {
	const backgroundTasks = yield* fork(backgroundTasksSaga, game)

	while (true) {
		game.state.turn.turnNumber++
		const result = yield* call(turnSaga, game)
		if (result === 'GAME_END') break
	}

	yield* cancel(backgroundTasks)
}

export default gameSaga
