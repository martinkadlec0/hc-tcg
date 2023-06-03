import {select, take} from 'typed-redux-saga'
import {call, put, fork} from 'redux-saga/effects'
import {SagaIterator} from 'redux-saga'
import {LocalGameState} from 'common/types/game-state'
import {runPickProcessSaga} from './pick-process-saga'
import {CardT} from 'common/types/game-state'
import CARDS from 'common/cards'
import {getPlayerId} from 'logic/session/session-selectors'
import {
	setOpenedModal,
	followUp,
	applyEffect,
	removeEffect,
} from 'logic/game/game-actions'
import HermitCard from 'common/cards/card-plugins/hermits/_hermit-card'
import EffectCard from 'common/cards/card-plugins/effects/_effect-card'
import SingleUseCard from 'common/cards/card-plugins/single-use/_single-use-card'
import ItemCard from 'common/cards/card-plugins/items/_item-card'

function* borrowSaga(): SagaIterator {
	yield put(setOpenedModal('borrow'))
	const result = yield* take(['BORROW_ATTACH', 'BORROW_DISCARD'])
	if (result.type === 'BORROW_DISCARD') {
		yield put(followUp({attach: false}))
		return
	}

	yield put(followUp({attach: true}))
}

function* singleUseSaga(card: CardT): SagaIterator {
	const cardInfo = CARDS[card.cardId]
	if (!cardInfo) return

	if (
		[
			'splash_potion_of_healing',
			'lava_bucket',
			'splash_potion_of_poison',
			'clock',
			'invisibility_potion',
			'fishing_rod',
			'emerald',
			'flint_&_steel',
			'spyglass',
			'efficiency',
			'curse_of_binding',
			'curse_of_vanishing',
			'looting',
			'fortune',
			'chorus_fruit',
			'sweeping_edge',
			'potion_of_slowness',
			'potion_of_weakness',
			'bad_omen',
		].includes(card.cardId)
	) {
		yield put(setOpenedModal('confirm'))
	} else if (card.cardId === 'chest') {
		yield put(setOpenedModal('chest'))
	} else if (cardInfo.pickOn === 'apply') {
		const result = yield call(
			runPickProcessSaga,
			cardInfo.name,
			cardInfo.pickReqs
		)
		if (result && result.length) {
			yield put(applyEffect({pickResults: {[card.cardId]: result}}))
		} else {
			yield put(removeEffect())
		}
	}
}

const getFollowUpName = (
	cardInfo: HermitCard | EffectCard | SingleUseCard | ItemCard
) => {
	if (
		cardInfo instanceof EffectCard ||
		cardInfo instanceof SingleUseCard ||
		cardInfo instanceof ItemCard
	)
		return cardInfo.name
	if (cardInfo.primary.power) cardInfo.primary.name
	if (cardInfo.secondary.power) cardInfo.secondary.name
	return cardInfo.name
}

function* actionLogicSaga(gameState: LocalGameState): SagaIterator {
	const playerId = yield* select(getPlayerId)
	const pState = gameState.players[playerId]
	const lastTurnAction = gameState.pastTurnActions[gameState.pastTurnActions.length - 1]
	
	if (pState.followUp) {
		const cardInfo = CARDS[pState.followUp] as
			| HermitCard
			| EffectCard
			| SingleUseCard
			| ItemCard
			| null
		if (cardInfo?.pickOn === 'followup') {
			let pickedCards = null
			const name = getFollowUpName(cardInfo)
			while (!pickedCards)
				pickedCards = yield call(runPickProcessSaga, name, cardInfo.pickReqs)
			yield put(followUp({pickedCards: {[pState.followUp]: pickedCards}}))
		} else if (pState.followUp === 'grian_rare') {
			yield fork(borrowSaga)
		}
	} else if (pState.custom.spyglass) {
		yield put(setOpenedModal('spyglass'))
	} else if (lastTurnAction === 'PLAY_SINGLE_USE_CARD' && !pState.board.singleUseCardUsed && pState.board.singleUseCard) {
		yield call(singleUseSaga, pState.board.singleUseCard)
	} else if (lastTurnAction === 'PLAYED_INVALID_CARD') {
		yield put(setOpenedModal('unmet-condition'))
	}
}

export default actionLogicSaga
