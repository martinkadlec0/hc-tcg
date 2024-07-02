import Modal from 'components/modal'
import {useSelector, useDispatch} from 'react-redux'
import {getAvailableActions, getPlayerState} from 'logic/game/game-selectors'
import {CARDS} from 'common/cards'
import css from './game-modals.module.scss'
import Button from 'components/button'
import {getGameState} from 'logic/game/game-selectors'
import {PickInfo} from 'common/types/server-requests'

type Props = {
	closeModal: () => void
	info: PickInfo
}
function ChangeHermitModal({closeModal, info}: Props) {
	const dispatch = useDispatch()
	const availableActions = useSelector(getAvailableActions)
	const playerState = useSelector(getPlayerState)
	const gameState = useSelector(getGameState)

	if (info.type !== 'hermit' || !playerState || !gameState || info.rowIndex === null) {
		throw new Error('This should never happen')
	}

	const hermitName = info.card?.props.name || ''
	const hasActiveHermit = playerState.board.activeRow !== null
	const canChange = !hasActiveHermit || availableActions.includes('CHANGE_ACTIVE_HERMIT')

	let message = `Are you sure you want to activate ${hermitName}?`
	if (!canChange) message = `You can not change your active hermit at this moment.`

	const lastAction = hasActiveHermit && canChange

	const handleYes = () => {
		dispatch({type: 'CONFIRM_HERMIT_CHANGE', payload: true})
		closeModal()
	}

	const handleNo = () => {
		dispatch({type: 'CONFIRM_HERMIT_CHANGE', payload: false})
		closeModal()
	}

	return (
		<Modal title="Change active hermit" closeModal={handleNo}>
			<div className={css.confirmModal}>
				<div className={css.description}>
					{lastAction && (
						<div className={css.turnEndNotification}>
							<span className={css.infoIcon}>!</span>
							{/* Hermit change is the last action of your turn. */}
							<p>Changing your hermit will end your turn!</p>
						</div>
					)}
					{message}
				</div>

				<div className={css.options}>
					{canChange ? (
						<>
							<Button onClick={handleNo}>Cancel</Button>
							<Button onClick={handleYes}>Yes</Button>
						</>
					) : (
						<>
							<Button onClick={handleNo}>Ok</Button>
						</>
					)}
				</div>
			</div>
		</Modal>
	)
}

export default ChangeHermitModal
