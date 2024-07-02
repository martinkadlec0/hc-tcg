import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {healHermit} from '../../../types/game-state'
import Card, {SingleUse, singleUse} from '../../base/card'

class SplashPotionOfHealingIISingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'splash_potion_of_healing_ii',
		numericId: 147,
		name: 'Splash Potion of Healing II',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		description: 'Heal all of your Hermits 30hp.',
		showConfirmationModal: true,
		log: (values) => `${values.defaultLog} and healed all {your|their} Hermits $g30hp$`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			game
				.filterSlots(slot.every(slot.player, slot.hermitSlot))
				.forEach(({row, card}) => healHermit(row, 20))
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default SplashPotionOfHealingIISingleUseCard
