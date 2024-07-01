import {call, cancelled, fork, put, putResolve, race, take, takeEvery} from 'typed-redux-saga'
import {sendMsg, receiveMsg} from 'logic/socket/socket-saga'
import gameSaga from 'logic/game/game-saga'
import {gameEnd} from 'logic/game/game-actions'
import {codeReceived, invalidCode, waitingForPlayer, clearMatchmaking} from './matchmaking-actions'
import {queueVoice} from 'logic/sound/sound-actions'

function* createBossGameSaga() {
	function* matchmaking() {
		try {
			// Send message to server to create the game
			yield* call(sendMsg, 'CREATE_BOSS_GAME')

			const createBossResponse = yield* race({
				success: call(receiveMsg, 'CREATE_BOSS_GAME_SUCCESS'),
				failure: call(receiveMsg, 'CREATE_BOSS_GAME_FAILURE'),
			})

			if (createBossResponse.failure) {
				yield* put(clearMatchmaking())
				return
			}

			yield* call(receiveMsg, 'GAME_START')
			yield* put(queueVoice(['EXSTART']))
			yield* call(gameSaga)
		} catch (err) {
			console.error('Game crashed: ', err)
		} finally {
			if (yield* cancelled()) {
				// Clear state and back to menu
				yield* put(clearMatchmaking())
				yield* put(gameEnd())
			}
		}
	}

	const result = yield* race({
		cancel: take('LEAVE_MATCHMAKING'),
		matchmaking: call(matchmaking),
	})

	yield* put(clearMatchmaking())

	if (result.cancel) {
		yield* call(sendMsg, 'CANCEL_BOSS_GAME')
	}
}

function* createPrivateGameSaga() {
	function* matchmaking() {
		try {
			// Send message to server to create the game
			yield* call(sendMsg, 'CREATE_PRIVATE_GAME')

			// Wait for response
			const createGameResponse = yield* race({
				success: call(receiveMsg, 'CREATE_PRIVATE_GAME_SUCCESS'),
				failure: call(receiveMsg, 'CREATE_PRIVATE_GAME_FAILURE'),
			})

			if (createGameResponse.success) {
				const gameCode: string = createGameResponse.success.payload
				yield* put(codeReceived(gameCode))
			} else {
				// Something went wrong, go back to menu
				yield* put(clearMatchmaking())
				return
			}

			// Wait for game start or timeout
			const queueResponse = yield* race({
				gameStart: call(receiveMsg, 'GAME_START'),
				timeout: call(receiveMsg, 'PRIVATE_GAME_TIMEOUT'),
			})

			if (queueResponse.gameStart) {
				yield* call(gameSaga)
			}
		} catch (err) {
			console.error('Game crashed: ', err)
		} finally {
			if (yield* cancelled()) {
				yield* put(clearMatchmaking())
				yield* put(gameEnd())
			}
		}
	}

	const result = yield* race({
		cancel: take('LEAVE_MATCHMAKING'), // We pressed the leave button
		matchmaking: call(matchmaking),
	})

	yield* put(clearMatchmaking())

	if (result.cancel) {
		// Tell the server the private game is cancelled
		yield* call(sendMsg, 'CANCEL_PRIVATE_GAME')
	}
}

function* joinPrivateGameSaga() {
	function* matchmaking() {
		try {
			while (true) {
				const {payload: gameCode} = yield take('SET_MATCHMAKING_CODE')
				yield* call(sendMsg, 'JOIN_PRIVATE_GAME', gameCode)

				const result = yield* race({
					failure: call(receiveMsg, 'JOIN_PRIVATE_GAME_FAILURE'),
					success: call(receiveMsg, 'JOIN_PRIVATE_GAME_SUCCESS'),
					invalidCode: call(receiveMsg, 'INVALID_CODE'),
					waitingForPlayer: call(receiveMsg, 'WAITING_FOR_PLAYER'),
					timeout: call(receiveMsg, 'PRIVATE_GAME_TIMEOUT'),
				})

				if (result.invalidCode) {
					yield* put(invalidCode())
					continue
				}

				if (result.failure) {
					// Something went wrong, go back to menu
					yield* put(clearMatchmaking())
				} else if (result.success || result.waitingForPlayer) {
					if (result.waitingForPlayer) {
						yield put(waitingForPlayer())
					}

					// Private game joined successfully - wait for game start or timeout
					const queueResponse = yield* race({
						gameStart: call(receiveMsg, 'GAME_START'),
						timeout: call(receiveMsg, 'PRIVATE_GAME_TIMEOUT'),
					})

					if (queueResponse.gameStart) {
						yield* call(gameSaga)
					}
				} else if (result.invalidCode) {
					yield* put(invalidCode())
				}

				// For anything but invalid code, we exit loop
				break
			}
		} catch (err) {
			console.error('Game crashed: ', err)
		} finally {
			if (yield* cancelled()) {
				yield put(gameEnd())
				yield* put(clearMatchmaking())
			}
		}
	}

	const result = yield* race({
		cancel: take('LEAVE_MATCHMAKING'), // We pressed the leave button
		matchmaking: call(matchmaking),
	})

	yield* put(clearMatchmaking())

	if (result.cancel) {
		// If we are waiting for a game here - i.e. we are in the private queue - Then cancel it
		yield* call(sendMsg, 'CANCEL_PRIVATE_GAME')
	}
}

function* joinQueueSaga() {
	function* matchmaking() {
		try {
			// Send message to server to join the queue
			yield* call(sendMsg, 'JOIN_QUEUE')

			// Wait for response
			const joinResponse = yield* race({
				success: call(receiveMsg, 'JOIN_QUEUE_SUCCESS'),
				failure: call(receiveMsg, 'JOIN_QUEUE_FAILURE'),
			})

			if (joinResponse.failure) {
				// Something went wrong, go back to menu
				yield* put(clearMatchmaking())
				return
			}

			// We have joined the queue, wait for game start
			yield* call(receiveMsg, 'GAME_START')
			yield* call(gameSaga)
			console.log('end game sagas')
		} catch (err) {
			console.error('Game crashed: ', err)
		} finally {
			if (yield* cancelled()) {
				// Clear state and back to menu
				yield* put(clearMatchmaking())
				yield* put(gameEnd())
			}
		}
	}

	const result = yield* race({
		leave: take('LEAVE_MATCHMAKING'), // We pressed the leave button
		matchmaking: call(matchmaking),
	})

	yield* put(clearMatchmaking())

	if (result.leave) {
		// Tell the server we left the queue
		yield* call(sendMsg, 'LEAVE_QUEUE')
	} else {
		yield* put(clearMatchmaking())
	}
}

function* reconnectSaga() {
	const reconnectState = yield* call(receiveMsg, 'GAME_STATE_ON_RECONNECT')
	yield* put(clearMatchmaking())
	yield* call(gameSaga, reconnectState.payload.localGameState)
	yield* put(clearMatchmaking())
}

function* matchmakingSaga() {
	yield* takeEvery('JOIN_QUEUE', joinQueueSaga)
	yield* takeEvery('CREATE_PRIVATE_GAME', createPrivateGameSaga)
	yield* takeEvery('JOIN_PRIVATE_GAME', joinPrivateGameSaga)
	yield* takeEvery('CREATE_BOSS_GAME', createBossGameSaga)
	yield* fork(reconnectSaga)
}

export default matchmakingSaga
