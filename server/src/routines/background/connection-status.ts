import {takeEvery, delay} from 'typed-redux-saga'
import {broadcast} from '../../utils/comm'
import {getOpponentId} from '../../utils'
import {CONFIG} from 'common/config'
import {getLocalGameState} from '../../utils/state-gen'
import {GameModel} from 'common/models/game-model'
import {AnyAction} from 'redux'
import {PlayerModel} from 'common/models/player-model'

function* sendGameStateOnReconnect(game: GameModel, action: AnyAction) {
	const playerId = action.payload.internalId
	const player = game.players[playerId]
	const opponentId = getOpponentId(game, playerId)
	const opponent = game.players[opponentId]

	yield* delay(500)

	if (game.state.timer.turnStartTime) {
		const maxTime = CONFIG.limits.maxTurnTime * 1000
		const remainingTime = game.state.timer.turnStartTime + maxTime - Date.now()
		const graceTime = 1000
		game.state.timer.turnRemaining = Math.floor((remainingTime + graceTime) / 1000)
	}

	const payload = {
		localGameState: getLocalGameState(game, player),
		order: game.getPlayerIds(),
	}
	broadcast([player], 'GAME_STATE_ON_RECONNECT', payload)
	broadcast([player], 'OPPONENT_CONNECTION', !!opponent.socket?.connected)
}

function* statusChangedSaga(game: GameModel, action: AnyAction) {
	const playerId = (action.payload as PlayerModel).id
	const opponentId = getOpponentId(game, playerId)
	const connectionStatus = game.players[playerId]?.socket?.connected
	broadcast([game.players[opponentId]], 'OPPONENT_CONNECTION', connectionStatus)
}

function* connectionStatusSaga(game: GameModel) {
	yield* takeEvery(
		(action: any) =>
			action.type === 'PLAYER_RECONNECTED' && !!game.players[(action.payload as PlayerModel).id],
		sendGameStateOnReconnect,
		game
	)

	yield* takeEvery(
		(action: any) =>
			['PLAYER_DISCONNECTED', 'PLAYER_RECONNECTED'].includes(action.type) &&
			!!game.players[(action.payload as PlayerModel).id],
		statusChangedSaga,
		game
	)
}

export default connectionStatusSaga
