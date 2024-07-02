import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {applySingleUse} from '../../../utils/board'
import {slot} from '../../../slot'
import {healHermit} from '../../../types/game-state'
import Card, {SingleUse, singleUse} from '../../base/card'

class InstantHealthSingleUseCard extends Card {
	pickCondition = slot.every(slot.hermitSlot, slot.not(slot.empty))

	props: SingleUse = {
		...singleUse,
		id: 'instant_health',
		numericId: 42,
		name: 'Instant Health',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		description: 'Heal one of your Hermits 30hp.',
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.playerHasActiveHermit,
			slot.someSlotFulfills(this.pickCondition)
		),
		log: (values) => `${values.defaultLog} on $p${values.pick.name}$ and healed $g30hp$`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an active or AFK Hermit',
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				const rowIndex = pickedSlot.rowIndex
				if (!pickedSlot.card || rowIndex === null) return

				const row = player.board.rows[rowIndex]
				if (!row.health) return

				// Apply
				applySingleUse(game, pickedSlot)

				healHermit(row, 30)
			},
		})
	}
}

export default InstantHealthSingleUseCard
