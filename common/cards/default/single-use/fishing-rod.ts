import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {drawCards} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class FishingRodSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'fishing_rod',
		numericId: 24,
		name: 'Fishing Rod',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 2,
		description: 'Draw 2 cards.',
		showConfirmationModal: true,
		log: (values) => `${values.defaultLog} to draw 2 cards`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			(game, pos) => pos.player.pile.length > 2
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			drawCards(player, 2)
			player.hooks.onApply.remove(instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default FishingRodSingleUseCard
