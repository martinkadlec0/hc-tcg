import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {discardCard} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class SweepingEdgeSingleUseCard extends Card {
	discardCondition = slot.every(
		slot.some(slot.activeRow, slot.adjacentTo(slot.activeRow)),
		slot.attachSlot,
		slot.opponent,
		slot.not(slot.empty),
		slot.not(slot.frozen)
	)

	props: SingleUse = {
		...singleUse,
		id: 'sweeping_edge',
		numericId: 148,
		name: 'Sweeping Edge',
		expansion: 'alter_egos',
		rarity: 'ultra_rare',
		tokens: 2,
		description:
			'Your opponent must discard any effect cards attached to their active Hermit and any adjacent Hermits.',
		showConfirmationModal: true,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.discardCondition)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {opponentPlayer, player} = pos

		player.hooks.onApply.add(instance, () => {
			game
				.filterSlots(this.discardCondition)
				.map((slot) => slot.card && discardCard(game, slot.card))
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default SweepingEdgeSingleUseCard
