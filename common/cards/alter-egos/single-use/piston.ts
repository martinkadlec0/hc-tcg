import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse} from '../../../utils/board'
import {discardSingleUse} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class PistonSingleUseCard extends Card {
	firstPickCondition = slot.every(
		slot.player,
		slot.itemSlot,
		slot.rowHasHermit,
		slot.not(slot.frozen),
		slot.not(slot.empty),
		// This condition needs to be different than the one for the second pick request in this case
		// The reason is that we don't know the row that's chosen until after the first pick request is over
		slot.adjacentTo(slot.every(slot.rowHasHermit, slot.itemSlot, slot.empty, slot.not(slot.frozen)))
	)

	props: SingleUse = {
		...singleUse,
		id: 'piston',
		numericId: 144,
		name: 'Piston',
		expansion: 'alter_egos',
		rarity: 'common',
		tokens: 0,
		description:
			'Move one of your attached item cards to an adjacent Hermit.\nYou can use another single use effect card this turn.',
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.firstPickCondition)
		),
		log: (values) => `${values.defaultLog} to move $m${values.pick.name}$`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const itemInstanceKey = this.getInstanceKey(instance, 'itemInstance')

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an item card from one of your active or AFK Hermits',
			canPick: this.firstPickCondition,
			onResult(pickResult) {
				if (!pickResult.card) return

				// Store the instance of the chosen item
				player.custom[itemInstanceKey] = pickResult.card.instance
			},
		})

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick an empty item slot on one of your adjacent active or AFK Hermits',
			// Note: This lambda function allows player.custom[rowIndexKey] to be defined before we generate the condition.
			// This will be fixed when player.custom is removed.
			canPick: (game, pos) =>
				slot.every(
					slot.player,
					slot.itemSlot,
					slot.empty,
					slot.rowHasHermit,
					slot.not(slot.frozen),
					slot.adjacentTo(slot.hasInstance(player.custom[itemInstanceKey]))
				)(game, pos),
			onResult(pickedSlot) {
				const itemInstance = player.custom[itemInstanceKey]
				const itemPos = game.findSlot(slot.hasInstance(itemInstance))

				const logInfo = pickedSlot
				if (itemPos !== null && itemPos.row !== null) {
					logInfo.card = itemPos.card
				}

				// Move the card and apply su card
				game.swapSlots(itemPos, pickedSlot, true)
				applySingleUse(game, logInfo)

				delete player.custom[itemInstanceKey]
			},
			onCancel() {
				delete player.custom[itemInstanceKey]
			},
			onTimeout() {
				delete player.custom[itemInstanceKey]
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

export default PistonSingleUseCard
