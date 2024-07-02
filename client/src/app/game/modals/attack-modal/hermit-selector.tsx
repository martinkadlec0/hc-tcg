import {useSelector} from 'react-redux'
import {useState} from 'react'
import classnames from 'classnames'
import {getPlayerActiveRow, getOpponentActiveRow} from '../../game-selectors'
import css from '../game-modals.module.scss'
import {getPlayerId} from 'logic/session/session-selectors'
import {getPlayerStateById} from 'logic/game/game-selectors'
import Attack from './attack'
import Card, {Hermit, isHermit} from 'common/cards/base/card'
import {CARDS} from 'common/cards'
import {LocalCardInstance} from 'common/types/server-requests'

type HermitExtra = {
	hermitId: string
	type: 'primary' | 'secondary'
}

type Props = {
	extraAttacks: Array<string>
	handleExtraAttack: (hermitExtra: HermitExtra) => void
}
function HermitSelector({extraAttacks, handleExtraAttack}: Props) {
	// TODO - This whole file needs to be rafactored
	const activeRow = useSelector(getPlayerActiveRow)
	const opponentRow = useSelector(getOpponentActiveRow)
	const playerId = useSelector(getPlayerId)
	const playerState = useSelector(getPlayerStateById(playerId))

	const initialId = extraAttacks[0].split(':')[0]
	const [selectedHermit, setSelectedHermit] = useState<string>(initialId)

	if (!activeRow || !playerState || !activeRow.hermitCard) return null
	if (!opponentRow || !opponentRow.hermitCard) return null

	const playerHermitInfo = activeRow.hermitCard
	if (!isHermit(playerHermitInfo.props)) return null

	const hermitFullName = playerHermitInfo.props.id.split('_')[0]

	const eaResult = extraAttacks.reduce((agg, extra) => {
		const [hermitId, action] = extra.split(':')
		const hermitInfo = CARDS[hermitId] as Card<Hermit>
		if (!hermitInfo) throw new Error('Invalid extra attack')
		const type = action === 'PRIMARY_ATTACK' ? 'primary' : 'secondary'
		const hermitFullName = hermitInfo.props.id.split('_')[0]
		agg[hermitId] = agg[hermitId] || {}
		agg[hermitId][type] = (
			<Attack
				key={extra}
				name={hermitInfo.props[type].name}
				icon={`/images/hermits-nobg/${hermitFullName}.png`}
				attackInfo={hermitInfo.props[type]}
				onClick={() => handleExtraAttack({hermitId, type})}
				extra
			/>
		)
		return agg
	}, {} as Record<string, any>)

	const hermitOptions = Object.keys(eaResult).map((hermitId) => {
		const hermitInfo = CARDS[hermitId]
		const hermitFullName = hermitInfo.props.id.split('_')[0]
		return (
			<img
				key={hermitId}
				onClick={() => setSelectedHermit(hermitId)}
				className={classnames(css.hermitOption, {
					[css.selected]: selectedHermit === hermitId,
				})}
				src={`/images/hermits-emoji/${hermitFullName}.png`}
				alt={hermitInfo.props.name}
				title={hermitInfo.props.name}
			/>
		)
	})

	return (
		<div className={css.hermitSelector}>
			<div className={css.attack} style={{cursor: 'default'}}>
				<div className={classnames(css.portrait, css.hermitIcon)}>
					<img src={`/images/hermits-nobg/${hermitFullName}.png`} />
				</div>
				<div className={css.info}>
					<div className={css.name}>
						{playerHermitInfo.props.secondary.name}
						<span className={css.select}> Select a hermit...</span>
					</div>
					<button className={css.hermitOptions}>{hermitOptions}</button>
				</div>
			</div>
			<div className={css.extraAttacks}>
				{eaResult[selectedHermit].primary || null}
				{eaResult[selectedHermit].secondary || null}
			</div>
		</div>
	)
}

export default HermitSelector
