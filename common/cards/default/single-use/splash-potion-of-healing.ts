import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {healHermit} from '../../../types/game-state'
import Card, {SingleUse, singleUse} from '../../base/card'

class SplashPotionOfHealingSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'splash_potion_of_healing',
		numericId: 89,
		name: 'Splash Potion of Healing',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		description: 'Heal all of your Hermits 20hp.',
		showConfirmationModal: true,
		log: (values) => `${values.defaultLog} and healed all {your|their} Hermits $g20hp$`,
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

export default SplashPotionOfHealingSingleUseCard
