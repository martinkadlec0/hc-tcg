import {LocalGameState, Message} from 'common/types/game-state'
import {GameEndOutcomeT, GameEndReasonT, CurrentCoinFlipT} from 'common/types/game-state'
import {LocalCardInstance, PickInfo} from 'common/types/server-requests'

export const gameStateReceived = (localGameState: LocalGameState) => ({
	type: 'GAME_STATE_RECEIVED' as const,
	payload: {
		localGameState,
		time: Date.now(),
	},
})

export const localGameState = (localGameState: LocalGameState) => ({
	type: 'LOCAL_GAME_STATE' as const,
	payload: {
		localGameState,
		time: Date.now(),
	},
})

export const gameStart = () => ({
	type: 'GAME_START' as const,
})

export const gameEnd = () => ({
	type: 'GAME_END' as const,
})

export const setSelectedCard = (card: LocalCardInstance | null) => ({
	type: 'SET_SELECTED_CARD' as const,
	payload: card,
})

export const setOpenedModal = (id: string | null, info: any = null) => ({
	type: 'SET_OPENED_MODAL' as const,
	payload: id === null ? null : {id, info},
})

export const slotPicked = (pickInfo: PickInfo) => ({
	type: 'SLOT_PICKED' as const,
	payload: {pickInfo},
})

export const forfeit = () => ({
	type: 'FORFEIT' as const,
})

type ExtraItemT = {hermitId: string; type: 'primary' | 'secondary'}

export const startAttack = (
	type: 'single-use' | 'primary' | 'secondary',
	extra?: Record<string, ExtraItemT>
) => ({
	type: 'START_ATTACK' as const,
	payload: {type, extra},
})

export const showEndGameOverlay = (outcome: GameEndOutcomeT, reason: GameEndReasonT = null) => ({
	type: 'SHOW_END_GAME_OVERLAY' as const,
	payload: {
		outcome,
		reason,
	},
})

export const setCoinFlip = (payload: CurrentCoinFlipT | null) => ({
	type: 'SET_COIN_FLIP',
	payload,
})

export const setOpponentConnection = (payload: boolean) => ({
	type: 'SET_OPPONENT_CONNECTION',
	payload,
})

// ---

export const modalRequest = (payload: any) => ({
	type: 'MODAL_REQUEST' as const,
	payload,
})

export const applyEffect = (payload: any) => ({
	type: 'APPLY_EFFECT' as const,
	payload,
})

export const removeEffect = () => ({
	type: 'REMOVE_EFFECT' as const,
})

export const endTurn = () => ({
	type: 'END_TURN' as const,
})

export const chatMessage = (message: string) => ({
	type: 'CHAT_MESSAGE',
	payload: message,
})

export const chatUpdate = (messages: Array<Message>) => ({
	type: 'CHAT_UPDATE',
	payload: messages,
})

export const attackAction = () => ({
	type: 'ATTACK_ACTION',
})

export const endTurnAction = () => ({
	type: 'END_TURN_ACTION',
})
