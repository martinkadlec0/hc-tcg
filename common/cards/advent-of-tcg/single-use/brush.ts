import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot, SlotCondition} from '../../../slot'
import {CardInstance} from '../../../types/game-state'
import SingleUseCard from '../../base/single-use-card'

class BrushSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'brush',
			numericId: 221,
			name: 'Brush',
			rarity: 'rare',
			description:
				'View the top 3 cards of your deck, then choose any number to keep on the top of your deck. The rest will be placed on the bottom in their original order.',
		})
	}

	override _attachCondition = slot.every(
		super.attachCondition,
		(game, pos) => pos.player.pile.length >= 3
	)

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Brush: Choose cards to place on the top of your deck.',
						modalDescription: 'Select cards you would like to draw sooner first.',
						cards: player.pile.slice(0, 3),
						selectionSize: 3,
						primaryButton: {
							text: 'Confirm Selection',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'FAILURE_INVALID_DATA'
					if (!modalResult.cards) return 'SUCCESS'

					const cards: Array<CardInstance> = modalResult.cards
					const bottomCards: Array<CardInstance> = player.pile.slice(0, 3).filter((c) => {
						if (cards.some((d) => c.instance === d.instance)) return false
						return true
					})

					player.pile = player.pile.slice(3)
					cards.reverse().forEach((c) => player.pile.unshift(c))
					bottomCards.forEach((c) => player.pile.push(c))

					return 'SUCCESS'
				},
				onTimeout() {
					// Do nothing
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}
}

export default BrushSingleUseCard
