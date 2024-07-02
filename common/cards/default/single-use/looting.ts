import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {CardInstance} from '../../../types/game-state'
import {flipCoin} from '../../../utils/coinFlips'
import {moveCardInstanceoHand} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class LootingSingleUseCard extends Card<SingleUse> {
	pickCondition = slot.every(slot.opponent, slot.activeRow, slot.itemSlot, slot.not(slot.empty))

	props: SingleUse = {
		...singleUse,
		id: 'looting',
		numericId: 76,
		name: 'Looting',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		description:
			"Flip a coin.\nIf heads, choose one item card attached to your opponent's active Hermit and add it to your hand.",
		showConfirmationModal: true,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
		log: (values) => `${values.defaultLog}, and ${values.coinFlip}`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const coinFlip = flipCoin(player, new CardInstance(this, instance))

			if (coinFlip[0] === 'tails') return

			game.addPickRequest({
				playerId: player.id,
				id: this.props.id,
				message: 'Pick an item card to add to your hand',
				canPick: this.pickCondition,
				onResult(pickedSlot) {
					if (pickedSlot.rowIndex === null || pickedSlot.card === null) {
						return
					}

					const playerRow = opponentPlayer.board.rows[pickedSlot.rowIndex]
					const hermitCard = playerRow.hermitCard
					if (!hermitCard || !playerRow.health) return
					moveCardInstanceoHand(game, pickedSlot.card, player)
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default LootingSingleUseCard
