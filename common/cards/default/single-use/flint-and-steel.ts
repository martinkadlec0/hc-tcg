import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {discardFromHand, drawCards} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class FlintAndSteelSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'flint_&_steel',
		numericId: 25,
		name: 'Flint & Steel',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		description:
			'Discard your hand. Draw 3 cards.\nCan be used even if you do not have any cards in your hand.',
		showConfirmationModal: true,
		log: (values) => `${values.defaultLog} to discard {your|their} hand and draw 3 cards`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			(game, pos) => pos.player.pile.length > 3
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			const hand = player.hand
			for (const card of hand) {
				discardFromHand(player, card)
			}

			drawCards(player, 3)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default FlintAndSteelSingleUseCard
