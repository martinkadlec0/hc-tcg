import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {flipCoin} from '../../../utils/coinFlips'
import {moveCardToHand} from '../../../utils/movement'
import SingleUseCard from '../../base/single-use-card'

const pickCondition = slot.every(slot.player, slot.activeRow, slot.itemSlot, slot.not(slot.empty))

class LootingSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'looting',
			numericId: 76,
			name: 'Looting',
			rarity: 'rare',
			description:
				"Flip a coin.\nIf heads, choose one item card attached to your opponent's active Hermit and add it to your hand.",
			log: (values) => `${values.defaultLog}, and ${values.coinFlip}`,
		})
	}

	override _attachCondition = slot.every(
		super.attachCondition,
		slot.someSlotFulfills(pickCondition)
	)

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const coinFlip = flipCoin(player, {
				cardId: this.id,
				cardInstance: instance,
			})

			if (coinFlip[0] === 'tails') return

			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: 'Pick an item card to add to your hand',
				canPick: pickCondition,
				onResult(pickResult) {
					if (pickResult.rowIndex === undefined || pickResult.card === null) {
						return
					}

					const playerRow = opponentPlayer.board.rows[pickResult.rowIndex]
					const hermitCard = playerRow.hermitCard
					if (!hermitCard || !playerRow.health) return
					moveCardToHand(game, pickResult.card, player)
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
