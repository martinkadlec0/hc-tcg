import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {discardCard} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class CurseOfVanishingSingleUseCard extends Card {
	discardCondition = slot.every(
		slot.opponent,
		slot.activeRow,
		slot.attachSlot,
		slot.not(slot.empty),
		slot.not(slot.frozen)
	)

	props: SingleUse = {
		...singleUse,
		id: 'curse_of_vanishing',
		numericId: 12,
		name: 'Curse Of Vanishing',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		description: 'Your opponent must discard any effect card attached to their active Hermit.',
		showConfirmationModal: true,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.discardCondition)
		),
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos

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

export default CurseOfVanishingSingleUseCard
