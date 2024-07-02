import Modal from 'components/modal'
import {useSelector, useDispatch} from 'react-redux'
import {getPlayerActiveRow, getOpponentActiveRow} from '../../game-selectors'
import css from '../game-modals.module.scss'
import {getPlayerId} from 'logic/session/session-selectors'
import {getAvailableActions, getPlayerStateById} from 'logic/game/game-selectors'
import {startAttack} from 'logic/game/game-actions'
import Attack from './attack'
import HermitSelector from './hermit-selector'
import {isHermit} from 'common/cards/base/card'

type Props = {
	closeModal: () => void
}
function AttackModal({closeModal}: Props) {
	// TODO - This whole file needs to be rafactored
	const dispatch = useDispatch()
	const activeRow = useSelector(getPlayerActiveRow)
	const opponentRow = useSelector(getOpponentActiveRow)
	const availableActions = useSelector(getAvailableActions)
	const playerId = useSelector(getPlayerId)
	const playerState = useSelector(getPlayerStateById(playerId))
	const singleUseCard = playerState?.board.singleUseCard

	if (!activeRow || !playerState || !activeRow.hermitCard) return null
	if (!opponentRow || !opponentRow.hermitCard) return null
	if (availableActions.includes('WAIT_FOR_TURN')) return null

	const playerHermitInfo = activeRow.hermitCard
	if (!isHermit(playerHermitInfo.props)) return null

	const hermitFullName = playerHermitInfo.props.id.split('_')[0]
	const singleUseInfo = singleUseCard ? singleUseCard : null

	const handleAttack = (type: 'single-use' | 'primary' | 'secondary') => {
		dispatch(startAttack(type))
		closeModal()
	}

	const handleExtraAttack = (hermitExtra: any) => {
		const extra = {
			[playerHermitInfo.props.id]: hermitExtra,
		}
		dispatch(startAttack('secondary', extra))
		closeModal()
	}

	const effectAttack = () => handleAttack('single-use')
	const primaryAttack = () => handleAttack('primary')
	const secondaryAttack = () => handleAttack('secondary')

	const attacks = []
	if (singleUseInfo && availableActions.includes('SINGLE_USE_ATTACK')) {
		attacks.push(
			<Attack
				key="single-use"
				name={singleUseInfo.props.name}
				icon={`/images/effects/${singleUseInfo?.props.id}.png`}
				attackInfo={null}
				onClick={effectAttack}
			/>
		)
	}

	if (availableActions.includes('PRIMARY_ATTACK')) {
		attacks.push(
			<Attack
				key="primary"
				name={playerHermitInfo.props.primary.name}
				icon={`/images/hermits-nobg/${hermitFullName}.png`}
				attackInfo={playerHermitInfo.props.primary}
				onClick={primaryAttack}
			/>
		)
	}

	const extraAttacks = availableActions.filter((a) => a.includes(':'))

	if (!extraAttacks.length && availableActions.includes('SECONDARY_ATTACK')) {
		attacks.push(
			<Attack
				key="secondary"
				name={playerHermitInfo.props.secondary.name}
				icon={`/images/hermits-nobg/${hermitFullName}.png`}
				attackInfo={playerHermitInfo.props.secondary}
				onClick={secondaryAttack}
			/>
		)
	}

	if (extraAttacks.length) {
		attacks.push(
			<HermitSelector
				key="hermit-selector"
				extraAttacks={extraAttacks}
				handleExtraAttack={handleExtraAttack}
			/>
		)
	}

	return (
		<Modal title="Attack" closeModal={closeModal} centered>
			<div className={css.description}>
				{attacks.length ? (
					<>
						<Modal.Notice icon={'!'}>Attacking will end your turn!</Modal.Notice>
						{attacks}
					</>
				) : (
					<span>No attacks available.</span>
				)}
			</div>
		</Modal>
	)
}

export default AttackModal
