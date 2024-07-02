import {HERMIT_CARDS} from '../..'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {RowPos} from '../../../types/cards'
import {RowStateWithHermit} from '../../../types/game-state'
import HermitCard from '../../base/hermit-card'
import {applyStatusEffect, removeStatusEffect} from '../../../utils/board'

class ShubbleYTRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'shubbleyt_rare',
			numericId: 217,
			name: 'Shelby',
			rarity: 'rare',
			type: 'terraform',
			health: 300,
			primary: {
				name: 'Good Witch',
				cost: ['terraform'],
				damage: 50,
				power: null,
			},
			secondary: {
				name: 'Parallel World',
				cost: ['terraform', 'terraform'],
				damage: 80,
				power:
					'After your attack, view the top card of your deck. You may choose to place it on the bottom of your deck.',
			},
		})
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance)) return
			if (attack.type !== 'secondary') return

			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Shelby: Place your top card on bottom of deck?',
						modalDescription: '',
						cards: [player.pile[0]],
						selectionSize: 0,
						primaryButton: {
							text: 'Place on Bottom',
							variant: 'primary',
						},
						secondaryButton: {
							text: 'Do Nothing',
							variant: 'secondary',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'SUCCESS'
					if (!modalResult.result) return 'SUCCESS'

					const topCard = player.pile.shift()
					if (!topCard) return 'SUCCESS'
					player.pile.push(topCard)

					return 'SUCCESS'
				},
				onTimeout() {},
			})
		})
	}

	public override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos

		player.hooks.afterAttack.remove(instance)
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override getPalette() {
		return 'advent_of_tcg'
	}

	override getBackground() {
		return 'advent_of_tcg'
	}
}

export default ShubbleYTRareHermitCard
