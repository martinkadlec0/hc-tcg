import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse, getActiveRow} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class ChorusFruitSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'chorus_fruit',
		numericId: 5,
		name: 'Chorus Fruit',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		description: 'After your attack, choose an AFK Hermit to set as your active Hermit.',
		log: (values) => `${values.defaultLog} with {your|their} attack`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.not(
				slot.someSlotFulfills(
					slot.every(slot.player, slot.hermitSlot, slot.activeRow, slot.hasStatusEffect('sleeping'))
				)
			)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const removedBlockKey = this.getInstanceKey(instance, 'removedBlockedAction')

		player.hooks.onAttack.add(instance, (attack) => {
			// Apply the card
			applySingleUse(game)

			player.hooks.afterAttack.add(instance, (attack) => {
				if (player.custom[removedBlockKey]) return
				// Remove change active hermit from the blocked actions so it can be done once more
				game.removeCompletedActions('CHANGE_ACTIVE_HERMIT')
				game.removeBlockedActions('game', 'CHANGE_ACTIVE_HERMIT')
				player.custom[removedBlockKey] = true
				// If another attack loop runs let the blocked action be removed again
				player.hooks.beforeAttack.add(instance, (attack) => {
					if (attack.isType('status-effect')) return // Ignore fire and poison attacks
					delete player.custom[removedBlockKey]
					player.hooks.beforeAttack.remove(instance)
				})
			})

			player.hooks.onTurnEnd.add(instance, (attack) => {
				delete player.custom[removedBlockKey]
				player.hooks.beforeAttack.remove(instance)
				player.hooks.afterAttack.remove(instance)
				player.hooks.onTurnEnd.remove(instance)
			})

			player.hooks.onAttack.remove(instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onAttack.remove(instance)
	}
}

export default ChorusFruitSingleUseCard
