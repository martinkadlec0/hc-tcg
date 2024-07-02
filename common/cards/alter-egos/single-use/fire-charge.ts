import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {discardCard, discardSingleUse} from '../../../utils/movement'
import {applySingleUse} from '../../../utils/board'
import {getFormattedName} from '../../../utils/game'
import {slot} from '../../../slot'
import Card, {SingleUse, singleUse} from '../../base/card'

class FireChargeSingleUseCard extends Card {
	pickCondition = slot.every(
		slot.player,
		slot.not(slot.frozen),
		slot.not(slot.empty),
		slot.some(slot.itemSlot, slot.attachSlot)
	)

	props: SingleUse = {
		...singleUse,
		id: 'fire_charge',
		numericId: 142,
		name: 'Fire Charge',
		expansion: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		description:
			'Discard one attached item or effect card from any of your Hermits.\nYou can use another single use effect card this turn.',
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
		log: (values) => `${values.defaultLog} to discard ${getFormattedName(values.pick.id, false)}`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an item or effect card from one of your active or AFK Hermits',
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				if (!pickedSlot.card) return

				// Discard the picked card and apply su card
				discardCard(game, pickedSlot.card)
				applySingleUse(game, pickedSlot)
			},
		})

		player.hooks.afterApply.add(instance, () => {
			discardSingleUse(game, player)

			// Remove playing a single use from completed actions so it can be done again
			game.removeCompletedActions('PLAY_SINGLE_USE_CARD')

			player.hooks.afterApply.remove(instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.afterApply.remove(instance)
	}
}

export default FireChargeSingleUseCard
