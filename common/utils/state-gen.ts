import {getPlayerState} from '../../server/src/utils/state-gen'
import {GameModel} from '../models/game-model'
import {GameState} from '../types/game-state'

export function getGameState(game: GameModel): GameState {
	const playerIds = game.getPlayerIds()
	if (Math.random() > 0.5) playerIds.reverse()

	const gameState: GameState = {
		turn: {
			turnNumber: 0,
			currentPlayerId: playerIds[0],
			availableActions: [],
			opponentAvailableActions: [],
			completedActions: [],
			blockedActions: {},
			currentAttack: null,
		},
		order: playerIds,
		statusEffects: [],
		lastActionResult: null,
		players: playerIds.reduce(
			(playerStates, playerId) => ({
				...playerStates,
				[playerId]: getPlayerState(game.players[playerId]),
			}),
			{}
		),

		pickRequests: [],
		modalRequests: [],

		timer: {
			turnStartTime: 0,
			turnRemaining: 0,
			opponentActionStartTime: null,
		},

		isBossGame: false,
	}
	return gameState
}
