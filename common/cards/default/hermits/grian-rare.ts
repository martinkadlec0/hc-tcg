import {CardPosModel, getCardPos} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {getActiveRowPos} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import {discardCard} from '../../../utils/movement'
import Card, {Hermit, hermit} from '../../base/card'

// The tricky part about this one are destroyable items (shield, totem, loyalty) since they are available at the moment of attack, but not after

/*
Some assumptions that make sense to me:
- Shield can't be stolen as they get used up during the attack
- If hermitMultiplier is 0 (e.g. invis potion), then shield don't get used and so you can steal it
- Totem/Loyalty can be stolen unless it was used
- If you choose to discard the card it gets discarded to your discard pile
*/

class GrianRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'grian_rare',
		numericId: 35,
		name: 'Grian',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'prankster',
		health: 300,
		primary: {
			name: 'Borrow',
			cost: ['prankster', 'prankster'],
			damage: 50,
			power:
				"After your attack, flip a coin.\nIf heads, steal the attached effect card of your opponent's active Hermit, and then choose to attach or discard it.",
		},
		secondary: {
			name: 'Start a War',
			cost: ['prankster', 'prankster', 'prankster'],
			damage: 100,
			power: null,
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, rowIndex, row} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance)) return
			const attacker = attack.getAttacker()
			if (attack.type !== 'primary' || !attacker) return

			const opponentRowPos = getActiveRowPos(opponentPlayer)
			if (rowIndex === null || !row || !opponentRowPos) return

			const opponentEffectCard = opponentRowPos.row.effectCard
			if (!opponentEffectCard) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] === 'tails') return

			const effectSlot = game.findSlot(
				slot.every(slot.player, slot.rowIndex(rowIndex), slot.attachSlot)
			)
			const canAttach = game.findSlot(
				slot.every(slot.player, slot.not(slot.frozen), slot.attachSlot, slot.activeRow, slot.empty)
			)

			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: 'Grian - Borrow',
						modalDescription: `Would you like to attach or discard your opponent's ${opponentEffectCard.props.name} card?`,
						cards: [opponentEffectCard],
						selectionSize: 0,
						primaryButton: canAttach
							? {
									text: 'Attach',
									variant: 'default',
							  }
							: null,
						secondaryButton: {
							text: 'Discard',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult || modalResult.result === undefined) return 'FAILURE_INVALID_DATA'

					if (modalResult.result) {
						// Discard our current attached card if there is one
						discardCard(game, row.effectCard)

						// Move their effect card over
						const opponentEffectSlot = game.findSlot(
							slot.every(slot.opponent, slot.attachSlot, slot.activeRow)
						)
						game.swapSlots(effectSlot, opponentEffectSlot)

						const newPos = getCardPos(game, opponentEffectCard.instance)

						if (newPos) {
							// Call onAttach
							opponentEffectCard.card.onAttach(game, opponentEffectCard.instance, newPos)
							player.hooks.onAttach.call(opponentEffectCard.instance)
						}
					} else {
						// Discard
						discardCard(game, opponentEffectCard, player)
					}

					return 'SUCCESS'
				},
				onTimeout() {
					// Discard
					discardCard(game, opponentEffectCard, player)
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.afterAttack.remove(instance)
	}
}

export default GrianRareHermitCard
