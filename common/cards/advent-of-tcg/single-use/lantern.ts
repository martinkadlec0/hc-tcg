import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {CardInstance} from '../../../types/game-state'
import SingleUseCard from '../../base/single-use-card'

class LanternSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'lantern',
			numericId: 225,
			name: 'Lantern',
			rarity: 'rare',
			description:
				'Look at the top 4 cards of your deck, and choose 2 to draw. Show these 2 cards to your opponent.',
		})
	}

	override _attachCondition = slot.every(
		super.attachCondition,
		(game, pos) => pos.player.pile.length >= 4
	)

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Lantern: Choose 2 cards to draw immediately.',
						modalDescription: '',
						cards: player.pile.slice(0, 4),
						selectionSize: 2,
						primaryButton: {
							text: 'Confirm Selection',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'FAILURE_INVALID_DATA'
					if (!modalResult.cards) return 'FAILURE_INVALID_DATA'
					if (modalResult.cards.length !== 2) return 'FAILURE_INVALID_DATA'

					const cards: Array<CardInstance> = modalResult.cards

					player.pile = player.pile.filter((c) => {
						if (cards.some((d) => c.instance === d.instance)) return false
						return true
					})

					cards.forEach((c) => player.hand.push(c))

					game.addModalRequest({
						playerId: opponentPlayer.id,
						data: {
							modalId: 'selectCards',
							payload: {
								modalName: 'Lantern: Cards your opponent drew.',
								modalDescription: '',
								cards: modalResult.cards,
								selectionSize: 0,
								primaryButton: {
									text: 'Close',
									variant: 'default',
								},
							},
						},
						onResult() {
							return 'SUCCESS'
						},
						onTimeout() {
							// Do nothing
						},
					})

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

export default LanternSingleUseCard
