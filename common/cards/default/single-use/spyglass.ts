import {CARDS} from '../..'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {CardInstance} from '../../../types/game-state'
import {flipCoin} from '../../../utils/coinFlips'
import {getFormattedName} from '../../../utils/game'
import {discardFromHand} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class SpyglassSingleUseCard extends Card<SingleUse> {
	props: SingleUse = {
		...singleUse,
		id: 'spyglass',
		numericId: 91,
		name: 'Spyglass',
		expansion: 'default',
		rarity: 'common',
		tokens: 1,
		description:
			"Look at your opponent's hand, and then flip a coin.\nIf heads, choose one card to discard from your opponent's hand.",
		showConfirmationModal: true,
		log: (values) => `${values.defaultLog} and ${values.coinFlip}`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			(game, pos) => game.state.turn.turnNumber !== 1
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const coinFlip = flipCoin(player, new CardInstance(this, instance))
			const canDiscard = coinFlip[0] === 'heads' && opponentPlayer.hand.length > 0

			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'selectCards',
					payload: {
						modalName: `Spyglass${canDiscard ? `: Select 1 card to discard` : ''}`,
						modalDescription: '',
						cards: opponentPlayer.hand,
						selectionSize: canDiscard ? 1 : 0,
						primaryButton: {
							text: canDiscard ? 'Confirm Selection' : 'Close',
							variant: 'default',
						},
					},
				},
				onResult(modalResult) {
					if (!modalResult) return 'FAILURE_INVALID_DATA'
					if (!canDiscard) return 'SUCCESS'

					if (!modalResult.cards || modalResult.cards.length !== 1) return 'FAILURE_INVALID_DATA'
					discardFromHand(opponentPlayer, modalResult.cards[0])

					game.battleLog.addEntry(
						player.id,
						`$p{You|${opponentPlayer.playerName}}$ discarded ${getFormattedName(
							modalResult.cards[0].cardId,
							true
						)} from {$o${game.opponentPlayer.playerName}'s$|your} hand`
					)

					return 'SUCCESS'
				},
				onTimeout() {
					if (canDiscard) {
						// Discard a random card from the opponent's hand
						const slotIndex = Math.floor(Math.random() * opponentPlayer.hand.length)
						discardFromHand(opponentPlayer, opponentPlayer.hand[slotIndex])
					}
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default SpyglassSingleUseCard
