import {LocalRowState, RowState} from 'common/types/game-state'
import {CardInstance} from 'common/types/game-state'
import Slot from './board-slot'
import css from './board.module.scss'
import cn from 'classnames'
import {StatusEffectT} from 'common/types/game-state'
import {BoardSlotTypeT, SlotInfo, SlotTypeT} from 'common/types/cards'
import {LocalCardInstance} from 'common/types/server-requests'

const getCardBySlot = (
	slotType: SlotTypeT,
	slotIndex: number,
	row: LocalRowState | null
): LocalCardInstance | null => {
	if (!row) return null
	if (slotType === 'hermit') return row.hermitCard || null
	if (slotType === 'attach') return row.effectCard || null
	if (slotType === 'item') return row.itemCards[slotIndex] || null
	return null
}

type BoardRowProps = {
	type: 'left' | 'right'
	rowIndex: number
	onClick: (card: LocalCardInstance | null, slot: SlotTypeT, index: number) => void
	rowState: LocalRowState
	active: boolean
	playerId: string
	statusEffects: Array<StatusEffectT>
}

const BoardRow = ({
	type,
	rowIndex,
	onClick,
	rowState,
	active,
	playerId,
	statusEffects,
}: BoardRowProps) => {
	const slotTypes: Array<BoardSlotTypeT> = ['item', 'item', 'item', 'attach', 'hermit', 'health']
	const slots = slotTypes.map((slotType, slotIndex) => {
		const card = getCardBySlot(slotType, slotIndex, rowState)
		const cssId = slotType === 'item' ? slotType + (slotIndex + 1) : slotType
		return (
			<Slot
				cssId={cssId}
				onClick={() => onClick(card, slotType, slotIndex)}
				card={card}
				rowState={rowState}
				active={active}
				key={slotType + '-' + slotIndex}
				type={slotType}
				rowIndex={rowIndex}
				index={slotIndex}
				playerId={playerId}
				statusEffects={statusEffects}
			/>
		)
	})

	return (
		<div
			className={cn(css.row, {
				[css.active]: active,
				[css.reversed]: type === 'right',
			})}
		>
			{slots}
		</div>
	)
}

export default BoardRow
