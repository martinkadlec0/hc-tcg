import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {CardT} from '../../../types/game-state'
import SingleUseCard from '../../base/single-use-card'

class GlowstoneSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'glowstone',
			numericId: 224,
			name: 'Glowstone',
			rarity: 'rare',
			description:
				'View the top 3 cards of your opponent’s deck. Choose one for them to draw. The other 2 will be placed on the bottom of their deck in their original order.',
		})
	}

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			if (!opponentPlayer.pile.length) return // Do nothing if opponent has no more cards to draw
			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Glowstone: Choose the card for your opponent to draw.',
						modalDescription: 'The other two cards will be placed on the bottom of their deck.',
						cards: opponentPlayer.pile.slice(0, 3),
						selectionSize: 1,
						primaryButton: {
							text: 'Confirm Selection',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'FAILURE_INVALID_DATA'
					if (!modalResult.cards) return 'FAILURE_INVALID_DATA'
					if (modalResult.cards.length !== 1) return 'FAILURE_INVALID_DATA'

					const cards: Array<CardT> = modalResult.cards
					const bottomCards: Array<CardT> = opponentPlayer.pile.slice(0, 3).filter((c) => {
						if (cards.some((d) => c.cardInstance === d.cardInstance)) return false
						return true
					})

					opponentPlayer.pile = opponentPlayer.pile.slice(3)
					bottomCards.forEach((c) => opponentPlayer.pile.push(c))

					cards.forEach((c) => opponentPlayer.hand.push(c))

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

export default GlowstoneSingleUseCard
