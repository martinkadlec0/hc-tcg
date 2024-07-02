import {select} from 'typed-redux-saga'
import {call, put} from 'redux-saga/effects'
import {SagaIterator} from 'redux-saga'
import {LocalGameState} from 'common/types/game-state'
import {getPlayerId} from 'logic/session/session-selectors'
import {setOpenedModal} from 'logic/game/game-actions'
import {isSingleUse} from 'common/cards/base/card'
import {LocalCardInstance} from 'common/types/server-requests'

function* singleUseSaga(card: LocalCardInstance): SagaIterator {
	if (isSingleUse(card.props) && card.props.showConfirmationModal) {
		yield put(setOpenedModal('confirm'))
	}
}

function* actionLogicSaga(gameState: LocalGameState): SagaIterator {
	const playerId = yield* select(getPlayerId)
	const pState = gameState.players[playerId]
	const lastActionResult = gameState.lastActionResult

	if (gameState.currentModalData && gameState.currentModalData.modalId) {
		const id = gameState.currentModalData?.modalId
		yield put(setOpenedModal(id))
	} else if (
		lastActionResult?.action === 'PLAY_SINGLE_USE_CARD' &&
		lastActionResult?.result === 'SUCCESS' &&
		!pState.board.singleUseCardUsed &&
		pState.board.singleUseCard
	) {
		yield call(singleUseSaga, pState.board.singleUseCard)
	} else if (lastActionResult?.result === 'FAILURE_UNMET_CONDITION') {
		yield put(setOpenedModal('unmet-condition'))
	}
}

export default actionLogicSaga
