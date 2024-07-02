import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class LadderSingleUseCard extends Card {
	pickCondition = slot.every(
		slot.player,
		slot.hermitSlot,
		slot.not(slot.empty),
		slot.adjacentTo(slot.activeRow)
	)

	props: SingleUse = {
		...singleUse,
		id: 'ladder',
		numericId: 143,
		name: 'Ladder',
		expansion: 'alter_egos',
		rarity: 'ultra_rare',
		tokens: 2,
		description:
			'Before your attack, swap your active Hermit card with one of your adjacent AFK Hermit cards.\nAll cards attached to both Hermits, including health, remain in place. Your active Hermit remains active after swapping.',
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an AFK Hermit adjacent to your active Hermit',
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				applySingleUse(game)

				game.swapSlots(
					pickedSlot,
					game.findSlot(slot.every(slot.player, slot.hermitSlot, slot.activeRow))
				)

				game.changeActiveRow(player, pickedSlot.rowIndex)
			},
		})
	}
}

export default LadderSingleUseCard
