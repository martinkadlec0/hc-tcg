import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {CardInstance} from '../../../types/game-state'
import {applySingleUse} from '../../../utils/board'
import {discardFromHand, drawCards} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class ComposterSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'composter',
		numericId: 7,
		name: 'Composter',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		description:
			'Discard 2 cards in your hand. Draw 2.\nCan not be used if you do not have 2 cards to discard.',
		log: (values) => `${values.defaultLog} to discard 2 cards and draw 2 cards`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			(game, pos) => pos.player.hand.length >= 2,
			(game, pos) => pos.player.pile.length > 2
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		let firstPickedCard: CardInstance | null = null

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick 2 cards from your hand',
			canPick: slot.hand,
			onResult(pickedSlot) {
				firstPickedCard = pickedSlot.card
			},
		})

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: 'Pick 1 more card from your hand',
			canPick: (game, pos) => {
				if (firstPickedCard === null) return false
				return slot.every(slot.hand, slot.not(slot.hasInstance(firstPickedCard.instance)))(
					game,
					pos
				)
			},
			onResult(pickedSlot) {
				discardFromHand(player, firstPickedCard)
				discardFromHand(player, pickedSlot.card)

				// Apply
				applySingleUse(game)

				drawCards(player, 2)
			},
		})
	}
}

export default ComposterSingleUseCard
