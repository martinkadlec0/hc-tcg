import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import Card, {Hermit, hermit} from '../../base/card'

class TangoTekRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'tangotek_rare',
		numericId: 95,
		name: 'Tango',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'farm',
		health: 290,
		primary: {
			name: 'Skadoodle',
			cost: ['farm'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Extra Flee',
			cost: ['farm', 'farm', 'farm'],
			damage: 100,
			power:
				'After your attack, both players must choose an AFK Hermit to set as their active Hermit, unless they have no AFK Hermits.\nYour opponent chooses their active Hermit first.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			if (
				attack.id !== this.getInstanceKey(instance) ||
				attack.type !== 'secondary' ||
				!attack.getTarget()
			)
				return

			const opponentInactiveRowsPickCondition = slot.every(
				slot.opponent,
				slot.hermitSlot,
				slot.not(slot.activeRow),
				slot.not(slot.empty)
			)
			const playerInactiveRowsPickCondition = slot.every(
				slot.player,
				slot.hermitSlot,
				slot.not(slot.activeRow),
				slot.not(slot.empty)
			)

			// Check if we are blocked from changing by anything other than the game
			const canChange = !game.isActionBlocked('CHANGE_ACTIVE_HERMIT', ['game'])

			// If opponent has hermit they can switch to, add a pick request for them to switch
			if (game.someSlotFulfills(opponentInactiveRowsPickCondition)) {
				game.addPickRequest({
					playerId: opponentPlayer.id,
					id: this.props.id,
					message: 'Pick a new active Hermit from your afk hermits',
					canPick: opponentInactiveRowsPickCondition,
					onResult(pickedSlot) {
						if (pickedSlot.rowIndex === null) return

						game.changeActiveRow(opponentPlayer, pickedSlot.rowIndex)
					},
					onTimeout() {
						let newActiveRow = game.filterSlots(opponentInactiveRowsPickCondition)[0]
						if (newActiveRow === undefined || newActiveRow.rowIndex === null) return
						game.changeActiveRow(game.opponentPlayer, newActiveRow.rowIndex)
					},
				})
			}

			// If we have an afk hermit, didn't just die, and are not bound in place, add a pick for us to switch
			const attacker = attack.getAttacker()
			if (
				game.someSlotFulfills(playerInactiveRowsPickCondition) &&
				attacker &&
				attacker.row.health > 0 &&
				canChange
			) {
				game.addPickRequest({
					playerId: player.id,
					id: this.props.id,
					message: 'Pick a new active Hermit from your afk hermits',
					canPick: playerInactiveRowsPickCondition,
					onResult(pickedSlot) {
						if (pickedSlot.rowIndex === null) return

						game.changeActiveRow(player, pickedSlot.rowIndex)
					},
					onTimeout() {
						let newActiveHermit = game.findSlot(playerInactiveRowsPickCondition)
						if (!newActiveHermit || newActiveHermit.rowIndex === null) return
						game.changeActiveRow(game.currentPlayer, newActiveHermit.rowIndex)
					},
				})
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.afterAttack.remove(instance)
	}
}

export default TangoTekRareHermitCard
