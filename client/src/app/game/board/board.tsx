import {useSelector} from 'react-redux'
import {CardInstance, LocalGameState, LocalPlayerState, RowState} from 'common/types/game-state'
import {getPlayerId} from 'logic/session/session-selectors'
import css from './board.module.scss'
import BoardRow from './board-row'
import PlayerInfo from '../player-info'
import Timer from '../timer'
import Actions from '../actions/actions'
import {CARDS} from 'common/cards'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import MobileActions from '../actions/mobile-actions'
import {LocalCardInstance, PickInfo} from 'common/types/server-requests'
import {SlotTypeT} from 'common/types/cards'

type Props = {
	onClick: (pickInfo: PickInfo) => void
	localGameState: LocalGameState
}

// TODO - Don't allow clicking on slots on the other side
// TODO - Use selectors instead of passing gameState
function Board({onClick, localGameState}: Props) {
	const settings = useSelector(getSettings)
	const playerId = useSelector(getPlayerId)
	const player = localGameState.players[playerId]
	const opponent = localGameState.players[localGameState.opponentPlayerId]
	const side = settings.gameSide
	const leftPlayer = side === 'Left' ? player : opponent
	const rightPlayer = side === 'Right' ? player : opponent

	const handleRowClick = (
		playerId: string,
		rowIndex: number,
		card: LocalCardInstance | null,
		type: SlotTypeT,
		index: number
	) => {
		onClick({
			playerId,
			rowIndex,
			card,
			type,
			index,
		})
	}

	const PlayerBoard = (player: LocalPlayerState, direction: 'left' | 'right') => {
		const rows = player.board.rows
		const boardArray = new Array(5).fill(null)

		return (
			<div className={css.playerBoard} id={css[direction]}>
				{boardArray.map((_, index) => {
					if (!rows[index]) throw new Error('Rendering board row failed!')
					return (
						<BoardRow
							key={index}
							rowIndex={index}
							rowState={rows[index]}
							active={index === player.board.activeRow}
							playerId={player.id}
							onClick={handleRowClick.bind(null, player.id, index)}
							type={direction}
							statusEffects={localGameState.statusEffects}
						/>
					)
				})}
			</div>
		)
	}

	return (
		<div className={css.gameBoard}>
			<div className={css.playerInfoSection}>
				<PlayerInfo player={leftPlayer} direction="left" />
				<Timer />
				<PlayerInfo player={rightPlayer} direction="right" />
			</div>

			<div className={css.actualBoard}>
				{PlayerBoard(leftPlayer, 'left')}
				<Actions localGameState={localGameState} onClick={onClick} id={css.actions} />
				{PlayerBoard(rightPlayer, 'right')}
			</div>

			<MobileActions localGameState={localGameState} onClick={onClick} id={css.actions} />
		</div>
	)
}

export default Board
