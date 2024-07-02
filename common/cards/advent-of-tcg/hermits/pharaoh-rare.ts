import {HERMIT_CARDS} from '../..'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {getActiveRow} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import HermitCard from '../../base/hermit-card'

class PharaohRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'pharaoh_rare',
			numericId: 214,
			name: 'Pharaoh',
			rarity: 'rare',
			type: 'balanced',
			health: 300,
			primary: {
				name: 'Targét',
				cost: ['balanced'],
				damage: 50,
				power: null,
			},
			secondary: {
				name: 'Xibalba',
				cost: ['balanced', 'balanced'],
				damage: 80,
				power:
					'Flip a coin. If heads, can give up to 80hp to AFK Hermit. Health given is equal to damage during attack. Can not heal other Pharaohs.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const playerKey = this.getInstanceKey(instance, 'player')
		const rowKey = this.getInstanceKey(instance, 'row')

		// Pick the hermit to heal
		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			// Make sure we are attacking
			if (activeInstance !== instance) return

			// Only secondary attack
			if (hermitAttackType !== 'secondary') return

			const attacker = getActiveRow(player)?.hermitCard
			if (!attacker) return

			const coinFlip = flipCoin(player, attacker)

			if (coinFlip[0] === 'tails') return

			const pickCondition = slot.every(
				slot.hermitSlot,
				slot.not(slot.activeRow),
				slot.not(slot.empty),
				slot.not(slot.hasId(this.id))
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

					//Cannot heal other pharaohs
					if (hermitCard.id === 'pharaoh_rare') return

					// Store the info to use later
					player.custom[playerKey] = pickedSlot.player.id
					player.custom[rowKey] = rowIndex
				},
				onTimeout() {
					// We didn't pick anyone to heal, so heal no one
				},
			})
		})

		// Heals the afk hermit *before* we actually do damage
		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)

			const pickedPlayer = game.state.players[player.custom[playerKey]]
			if (!pickedPlayer) return
			const pickedRowIndex = player.custom[rowKey]
			const pickedRow = pickedPlayer.board.rows[pickedRowIndex]
			if (!pickedRow || !pickedRow.hermitCard) return

			const hermitInfo = HERMIT_CARDS[pickedRow.hermitCard.cardId]
			if (hermitInfo) {
				// Heal
				pickedRow.health = Math.min(
					pickedRow.health + attack.calculateDamage(),
					hermitInfo.health // Max health
				)
			}
		})

		player.hooks.onTurnEnd.add(instance, () => {
			delete player.custom[playerKey]
			delete player.custom[rowKey]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.getAttackRequests.remove(instance)
		player.hooks.onAttack.remove(instance)
		player.hooks.onTurnEnd.remove(instance)
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override getPalette() {
		return 'pharaoh'
	}
}

export default PharaohRareHermitCard
