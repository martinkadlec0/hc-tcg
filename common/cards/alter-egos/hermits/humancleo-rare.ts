import HermitCard from '../../base/hermit-card'
import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {flipCoin} from '../../../utils/coinFlips'
import {getActiveRow} from '../../../utils/board'
import {hasEnoughEnergy} from '../../../utils/attacks'
import {HERMIT_CARDS, ITEM_CARDS} from '../..'
import {slot} from '../../../slot'

class HumanCleoRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'humancleo_rare',
			numericId: 132,
			name: 'Human Cleo',
			rarity: 'rare',
			hermitType: 'pvp',
			health: 270,
			primary: {
				name: 'Humanity',
				cost: ['pvp'],
				damage: 50,
				power: null,
			},
			secondary: {
				name: 'Betrayed',
				cost: ['pvp', 'pvp'],
				damage: 70,
				power:
					'Flip a coin twice.\nIf both are heads, your opponent must attack one of their own AFK Hermits on their next turn. Your opponent must have the necessary item cards attached to execute an attack.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(instance)
		const opponentTargetKey = this.getInstanceKey(instance, 'opponentTarget')

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== instanceKey || attack.type !== 'secondary' || !attacker) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard, 2)

			const headsAmount = coinFlip.filter((flip) => flip === 'heads').length
			if (headsAmount < 2) return

			const pickCondition = slot.every(
				slot.player,
				slot.not(slot.activeRow),
				slot.not(slot.empty),
				slot.hermitSlot
			)

			const blockActions = () => {
				// Start by removing blocked actions in case requirements are no longer met
				game.removeBlockedActions(this.id, 'CHANGE_ACTIVE_HERMIT', 'END_TURN')

				// Return if the opponent has no AFK Hermits to attack
				if (!game.someSlotFulfills(pickCondition)) return

				const opponentActiveRow = getActiveRow(opponentPlayer)
				if (!opponentActiveRow) return

				const energy = opponentActiveRow.itemCards.flatMap((item) => {
					if (item) return ITEM_CARDS[item.cardId].hermitType
					return []
				})

				const opponentActiveHermit = HERMIT_CARDS[opponentActiveRow.hermitCard.cardId]

				// Return if no energy
				if (
					!hasEnoughEnergy(energy, opponentActiveHermit.primary.cost) &&
					!hasEnoughEnergy(energy, opponentActiveHermit.secondary.cost)
				) {
					return
				}

				// Don't prevent change hermit if opponent is blocked from attacking for other reason
				if (game.isActionBlocked('PRIMARY_ATTACK') && game.isActionBlocked('SECONDARY_ATTACK')) {
					return
				}

				// The opponent needs to attack in this case, so prevent them switching or ending turn
				game.addBlockedActions(this.id, 'CHANGE_ACTIVE_HERMIT', 'END_TURN')
			}

			opponentPlayer.hooks.onTurnStart.add(instance, blockActions)
			opponentPlayer.hooks.onAttach.add(instance, blockActions)
			opponentPlayer.hooks.onDetach.add(instance, blockActions)

			// Add a pick request for opponent to pick an afk hermit to attack
			opponentPlayer.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
				// Only pick if there is afk to pick
				if (!game.someSlotFulfills(pickCondition)) return

				game.addPickRequest({
					playerId: opponentPlayer.id,
					id: this.id,
					message: 'Pick one of your AFK Hermits',
					canPick: pickCondition,
					onResult(pickedSlot) {
						const rowIndex = pickedSlot.rowIndex
						if (!pickedSlot.card || rowIndex === null) return

						// Remove the hook straight away
						opponentPlayer.hooks.getAttackRequests.remove(instance)
						// Save the target index for opponent to attack
						player.custom[opponentTargetKey] = rowIndex

						return
					},
					onTimeout() {
						// Remove the hook straight away
						opponentPlayer.hooks.getAttackRequests.remove(instance)
						// Pick the first afk hermit to attack
						const firstAfk = game.filterSlots(pickCondition)[0]
						if (!firstAfk) return

						// Save the target index for opponent to attack
						player.custom[opponentTargetKey] = firstAfk.rowIndex
					},
				})
			})

			opponentPlayer.hooks.beforeAttack.add(instance, (attack) => {
				if (!attack.isType('primary', 'secondary')) return

				// Immediately remove the hook
				opponentPlayer.hooks.beforeAttack.remove(instance)

				const opponentTarget: number = player.custom[opponentTargetKey]
				if (opponentTarget !== undefined) {
					delete player.custom[opponentTargetKey]

					const targetRow = opponentPlayer.board.rows[opponentTarget]
					if (targetRow && targetRow.hermitCard) {
						attack.setTarget(this.id, {
							player: opponentPlayer,
							rowIndex: opponentTarget,
							row: targetRow,
						})
					}
				}

				// They attacked now, they can end turn or change hermits with Chorus Fruit
				game.removeBlockedActions(this.id, 'CHANGE_ACTIVE_HERMIT', 'END_TURN')
			})

			opponentPlayer.hooks.onTurnEnd.add(instance, () => {
				// Make sure the target is always deleted
				delete player.custom[opponentTargetKey]
				// Delete hooks generated during opponent's attack
				opponentPlayer.hooks.onTurnStart.remove(instance)
				opponentPlayer.hooks.onAttach.remove(instance)
				opponentPlayer.hooks.onDetach.remove(instance)
				opponentPlayer.hooks.getAttackRequests.remove(instance)
				opponentPlayer.hooks.beforeAttack.remove(instance)
				opponentPlayer.hooks.onTurnEnd.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		// Remove hooks
		player.hooks.onAttack.remove(instance)
		opponentPlayer.hooks.onTurnStart.remove(instance)
		opponentPlayer.hooks.onAttach.remove(instance)
		opponentPlayer.hooks.onDetach.remove(instance)
		opponentPlayer.hooks.getAttackRequests.remove(instance)
		opponentPlayer.hooks.beforeAttack.remove(instance)
		opponentPlayer.hooks.onTurnEnd.remove(instance)
		delete player.custom[this.getInstanceKey(instance, 'opponentTarget')]
	}

	override getExpansion() {
		return 'alter_egos'
	}

	override getPalette() {
		return 'alter_egos'
	}

	override getBackground() {
		return 'alter_egos_background'
	}
}

export default HumanCleoRareHermitCard
