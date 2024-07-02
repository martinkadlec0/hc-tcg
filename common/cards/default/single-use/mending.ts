import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse, getActiveRow} from '../../../utils/board'
import {discardSingleUse} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class MendingSingleUseCard extends Card {
	pickCondition = slot.every(
		slot.player,
		slot.attachSlot,
		slot.empty,
		slot.rowHasHermit,
		slot.not(slot.frozen),
		slot.not(slot.activeRow)
	)

	props: SingleUse = {
		...singleUse,
		id: 'mending',
		numericId: 78,
		name: 'Mending',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 1,
		description: "Move your active Hermit's attached effect card to any of your AFK Hermits.",
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition),
			slot.someSlotFulfills(
				slot.every(slot.activeRow, slot.attachSlot, slot.not(slot.frozen), slot.not(slot.empty))
			)
		),
		log: (values) =>
			`${values.defaultLog} to move $e${values.pick.name}$ to $p${values.pick.hermitCard}$`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		const activeRowIndex = player.board.activeRow
		if (activeRowIndex === null) {
			discardSingleUse(game, player)
			return
		}

		const activeRow = getActiveRow(player)
		if (!activeRow) {
			discardSingleUse(game, player)
			return
		}
		const effectCard = activeRow.effectCard
		if (!effectCard) {
			discardSingleUse(game, player)
			return
		}

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an empty effect slot from one of your AFK Hermits',
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				const hermitActiveEffectCard = game.findSlot(
					slot.every(slot.player, slot.activeRow, slot.attachSlot)
				)

				if (!hermitActiveEffectCard || !hermitActiveEffectCard.row) return

				const logInfo = pickedSlot
				logInfo.card = hermitActiveEffectCard.row.effectCard

				// Apply the mending card
				applySingleUse(game, logInfo)

				// Move the effect card
				game.swapSlots(hermitActiveEffectCard, pickedSlot)
			},
		})
	}
}

export default MendingSingleUseCard
