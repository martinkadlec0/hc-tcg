import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {discardCard} from '../../../utils/movement'
import HermitCard from '../../base/hermit-card'
import {flipCoin} from '../../../utils/coinFlips'
import {slot} from '../../../slot'

class MonkeyfarmRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'monkeyfarm_rare',
			numericId: 212,
			name: 'Monkeyfarm',
			rarity: 'rare',
			type: 'farm',
			health: 250,
			primary: {
				name: 'Skull',
				cost: ['farm'],
				damage: 40,
				power: null,
			},
			secondary: {
				name: 'Monkeystep',
				cost: ['farm', 'farm'],
				damage: 80,
				power: "Flip a coin. If heads, discard 1 attached item card from an opponent's AFK Hermit.",
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary' || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)
			if (coinFlip[0] !== 'heads') return

			const pickCondition = slot.every(slot.opponent, slot.itemSlot, slot.not(slot.empty))

			if (!game.someSlotFulfills(pickCondition)) return

			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: "Pick one of your opponent's AFK Hermit's item cards",
				canPick: pickCondition,
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || rowIndex === null) return

					const row = opponentPlayer.board.rows[rowIndex]
					if (!row.hermitCard) return

					// Apply the card
					discardCard(game, pickedSlot.card)
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
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

export default MonkeyfarmRareHermitCard
