import {RootState} from 'store'
import {LocalPlayerState} from 'common/types/game-state'
import {getPlayerState, getOpponentState} from 'logic/game/game-selectors'

const getActiveRow = (playerState: LocalPlayerState | null) => {
	if (!playerState) return null
	const {rows, activeRow} = playerState.board
	if (activeRow === null) return null
	const activeHermit = rows[activeRow]
	if (!activeHermit) return null
	return activeHermit
}

export const getPlayerActiveRow = (state: RootState) => {
	const playerState = getPlayerState(state)
	return getActiveRow(playerState)
}

export const getOpponentActiveRow = (state: RootState) => {
	const playerState = getOpponentState(state)
	return getActiveRow(playerState)
}
