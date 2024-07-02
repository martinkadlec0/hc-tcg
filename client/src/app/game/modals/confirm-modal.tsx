import Modal from 'components/modal'
import {useDispatch, useSelector} from 'react-redux'
import css from './game-modals.module.scss'
import {applyEffect, removeEffect} from 'logic/game/game-actions'
import {getPlayerState} from 'logic/game/game-selectors'
import Button from 'components/button'

type Props = {
	closeModal: () => void
}
function ConfirmModal({closeModal}: Props) {
	const dispatch = useDispatch()

	const handleYes = () => {
		dispatch(applyEffect({}))
		closeModal()
	}

	const handleNo = () => {
		dispatch(removeEffect())
		closeModal()
	}

	const getCardName = () => {
		const playerState = useSelector(getPlayerState)

		if (!playerState) return null
		const singleUseCard = playerState.board.singleUseCard

		if (!singleUseCard) return null
		return singleUseCard.props.name
	}

	return (
		<Modal title="Play Single Use Card" closeModal={handleNo}>
			<div className={css.confirmModal}>
				<div className={css.description}>Are you sure you want to use {getCardName()}?</div>
				<div className={css.options}>
					<Button size="medium" onClick={handleNo}>
						No
					</Button>
					<Button size="medium" onClick={handleYes}>
						Yes
					</Button>
				</div>
			</div>
		</Modal>
	)
}

export default ConfirmModal
