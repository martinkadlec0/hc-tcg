import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {applySingleUse} from '../../../utils/board'
import {slot} from '../../../slot'
import {healHermit} from '../../../types/game-state'
import Card, {SingleUse, singleUse} from '../../base/card'

class GoldenAppleSingleUseCard extends Card {
	pickCondition = slot.every(slot.hermitSlot, slot.not(slot.activeRow), slot.not(slot.empty))

	props: SingleUse = {
		...singleUse,
		id: 'golden_apple',
		numericId: 30,
		name: 'Golden Apple',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 3,
		description: 'Heal one of your AFK Hermits 100hp.',
		log: (values) => `${values.defaultLog} on $p${values.pick.name}$ and healed $g100hp$`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.playerHasActiveHermit,
			slot.someSlotFulfills(this.pickCondition)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick one of your AFK Hermits',
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				const rowIndex = pickedSlot.rowIndex
				if (!pickedSlot.card || rowIndex === null) return

				const row = player.board.rows[rowIndex]
				if (!row.health) return

				// Apply
				applySingleUse(game, pickedSlot)

				healHermit(row, 100)
			},
		})
	}
}

export default GoldenAppleSingleUseCard
