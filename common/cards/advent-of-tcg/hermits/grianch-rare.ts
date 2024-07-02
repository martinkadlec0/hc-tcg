import HermitCard from '../../base/hermit-card'
import {HERMIT_CARDS} from '../..'
import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {flipCoin} from '../../../utils/coinFlips'
import {slot} from '../../../slot'

class GrianchRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'grianch_rare',
			numericId: 209,
			name: 'The Grianch',
			rarity: 'rare',
			type: 'builder',
			health: 250,
			primary: {
				name: 'Nice',
				cost: ['builder', 'any'],
				damage: 70,
				power: 'Heal any AFK Hermit for 40hp.',
			},
			secondary: {
				name: 'Naughty',
				cost: ['builder', 'builder'],
				damage: 80,
				power:
					'Flip a Coin.\nIf heads, attack damage doubles.\nIf tails, your opponent may attack twice next round.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== instanceKey || attack.type !== 'secondary' || !attacker) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] === 'tails') {
				opponentPlayer.hooks.afterAttack.add(instance, (attack) => {
					game.removeCompletedActions('PRIMARY_ATTACK', 'SECONDARY_ATTACK', 'SINGLE_USE_ATTACK')
					opponentPlayer.hooks.afterAttack.remove(instance)
				})
				return
			}

			attack.addDamage(this.id, this.secondary.damage)
		})

		player.hooks.afterAttack.add(instance, (attack) => {
			if (attack.id !== instanceKey || attack.type !== 'primary') return

			const pickCondition = slot.every(
				slot.not(slot.activeRow),
				slot.not(slot.empty),
				slot.hermitSlot
			)

			if (!game.someSlotFulfills(pickCondition)) return

			game.addPickRequest({
				playerId: player.id,
				id: this.id,
				message: 'Pick an AFK Hermit from either side of the board',
				canPick: pickCondition,
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || rowIndex === null) return

					// Make sure it's an actual hermit card
					const hermitCard = HERMIT_CARDS[pickedSlot.card.cardId]
					if (!hermitCard) return
					const hermitId = pickedSlot.player.board.rows[rowIndex].hermitCard?.cardId
					const hermitHealth = pickedSlot.player.board.rows[rowIndex].health

					if (!hermitHealth || !hermitId) return
					const hermitInfo = HERMIT_CARDS[hermitId]
					if (hermitInfo) {
						// Heal
						pickedSlot.player.board.rows[rowIndex].health = Math.min(
							hermitHealth + 40,
							hermitInfo.health // Max health
						)
					} else {
						// Armor Stand
						pickedSlot.player.board.rows[rowIndex].health = hermitHealth + 40
					}
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onAttack.remove(instance)
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

export default GrianchRareHermitCard
