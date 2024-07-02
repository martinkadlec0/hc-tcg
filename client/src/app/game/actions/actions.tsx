import css from './actions.module.scss'
import cn from 'classnames'
import Slot from '../board/board-slot'
import {useSelector, useDispatch} from 'react-redux'
import {attackAction, endTurn, endTurnAction} from 'logic/game/game-actions'
import {
	getPlayerStateById,
	getAvailableActions,
	getCurrentCoinFlip,
	getGameState,
	getPlayerState,
	getCurrentPickMessage,
} from 'logic/game/game-selectors'
import {LocalGameState} from 'common/types/game-state'
import {getPlayerId} from 'logic/session/session-selectors'
import CoinFlip from 'components/coin-flip'
import Button from 'components/button'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import {PickInfo} from 'common/types/server-requests'
import {endTurnModalEmpty} from '../modals/end-turn-modal'

type Props = {
	onClick: (pickInfo: PickInfo) => void
	localGameState: LocalGameState
	mobile?: boolean
	id?: string
}

const Actions = ({onClick, localGameState, mobile, id}: Props) => {
	const currentPlayer = useSelector(getPlayerStateById(localGameState.turn.currentPlayerId))
	const gameState = useSelector(getGameState)
	const playerState = useSelector(getPlayerState)
	const playerId = useSelector(getPlayerId)
	const boardState = currentPlayer?.board
	const singleUseCard = boardState?.singleUseCard || null
	const singleUseCardUsed = boardState?.singleUseCardUsed || false
	const availableActions = useSelector(getAvailableActions)
	const currentCoinFlip = useSelector(getCurrentCoinFlip)
	const pickMessage = useSelector(getCurrentPickMessage)
	const settings = useSelector(getSettings)
	const dispatch = useDispatch()

	const turn = localGameState.turn.currentPlayerId === playerId

	if (!gameState || !playerState) return <main>Loading</main>

	const Status = () => {
		const waitingForOpponent =
			availableActions.includes('WAIT_FOR_OPPONENT_ACTION') && availableActions.length === 1
		let turnMsg = turn ? 'Your Turn' : "Opponent's Turn"
		if (pickMessage) turnMsg = 'Pick a card'
		const endTurn = availableActions.includes('END_TURN')
		const changeHermit = availableActions.includes('CHANGE_ACTIVE_HERMIT')

		// TODO: Show coin flip results for longer amount of time
		if (currentCoinFlip) {
			return (
				<div id={css.status}>
					<CoinFlip
						key={currentCoinFlip.name}
						{...currentCoinFlip}
						amount={currentCoinFlip.amount}
					/>
				</div>
			)
		}

		let message = ''

		if (pickMessage) {
			message = pickMessage
		} else if (waitingForOpponent) {
			message = "Waiting for opponent's action..."
		} else if (endTurn && availableActions.length === 1) {
			message = 'End your turn when ready'
		} else if (changeHermit && availableActions.length === 1) {
			message = 'Select a new active Hermit'
		} else if (endTurn && changeHermit && availableActions.length === 2) {
			message = 'Switch to a new Hermit or end your turn'
		}

		return (
			<div id={css.status}>
				<p className={css.turn}>{turnMsg}</p>
				<p className={css.message}>{message}</p>
			</div>
		)
	}

	const SingleUseSlot = () => {
		const isPlayable =
			availableActions.includes('PLAY_SINGLE_USE_CARD') ||
			availableActions.includes('REMOVE_EFFECT')

		const handleClick = () => {
			isPlayable &&
				onClick({
					type: 'single_use',
					index: null,
					rowIndex: null,
					playerId: localGameState.turn.currentPlayerId,
					card: singleUseCard,
				})
		}

		return (
			<div className={cn(css.slot, {[css.used]: singleUseCardUsed})}>
				<Slot
					card={singleUseCard}
					playerId={playerId}
					type={'single_use'}
					onClick={handleClick}
					statusEffects={gameState.statusEffects}
				/>
			</div>
		)
	}

	const ActionButtons = () => {
		function handleAttack() {
			dispatch(attackAction())
		}
		function handleEndTurn() {
			if (endTurnModalEmpty(availableActions) || settings.confirmationDialogs === 'off') {
				dispatch(endTurn())
			} else {
				dispatch(endTurnAction())
			}
		}

		const attackOptions =
			availableActions.includes('SINGLE_USE_ATTACK') ||
			availableActions.includes('PRIMARY_ATTACK') ||
			availableActions.includes('SECONDARY_ATTACK')

		return (
			<div className={css.buttons}>
				<Button
					variant="default"
					size="small"
					style={{height: '34px'}}
					onClick={handleAttack}
					disabled={!attackOptions}
				>
					Attack
				</Button>
				<Button
					variant={!availableActions.includes('END_TURN') ? 'default' : 'error'}
					size="small"
					style={{height: '34px'}}
					onClick={handleEndTurn}
					disabled={!availableActions.includes('END_TURN')}
				>
					End Turn
				</Button>
			</div>
		)
	}

	return (
		<div id={id} className={cn(css.actions, css.desktop)}>
			{Status()}
			<div className={cn(css.actionSection, !turn && css.fade)}>
				<h2>Actions</h2>
				{ActionButtons()}
			</div>
			{SingleUseSlot()}
		</div>
	)
}

export default Actions
