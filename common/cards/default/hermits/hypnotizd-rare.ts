import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {HermitAttackType} from '../../../types/attack'
import {PickRequest} from '../../../types/server-requests'
import {getActiveRow} from '../../../utils/board'
import {discardCard} from '../../../utils/movement'
import Card, {Hermit, hermit} from '../../base/card'

/*
- Has to support having two different afk targets (one for hypno, one for su effect like bow)
- If the afk target for Hypno's ability & e.g. bow are the same, don't apply weakness twice
- TODO - Can't use Got 'Em to attack AFK hermits even with Efficiency if Hypno has no item cards to discard
*/
class HypnotizdRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'hypnotizd_rare',
		numericId: 37,
		name: 'Hypno',
		expansion: 'default',
		rarity: 'rare',
		tokens: 3,
		type: 'miner',
		health: 270,
		primary: {
			name: 'MmHmm',
			cost: ['miner'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: "Got 'Em",
			cost: ['miner', 'any'],
			damage: 70,
			power:
				"You can choose to attack one of your opponent's AFK Hermits. If you do this, you must discard one item card attached to your active Hermit.",
		},
	}

	override getAttack(
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	) {
		const {player, opponentPlayer} = pos
		const attack = super.getAttack(game, instance, pos, hermitAttackType)

		if (!attack || attack.type !== 'secondary') return attack

		const targetKey = this.getInstanceKey(instance, 'target')
		const targetIndex: number | undefined = player.custom[targetKey]
		if (targetIndex === undefined) return attack
		if (targetIndex === opponentPlayer.board.activeRow) return attack

		const targetRow = opponentPlayer.board.rows[targetIndex]
		if (!targetRow.hermitCard) return attack

		// Change attack target
		attack.setTarget(this.props.id, {
			player: opponentPlayer,
			rowIndex: targetIndex,
			row: targetRow,
		})

		const newAttacks = attack

		// Delete the target info now
		delete player.custom[targetKey]

		return newAttacks
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player, opponentPlayer} = pos
		const targetKey = this.getInstanceKey(instance, 'target')

		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			if (activeInstance !== instance || hermitAttackType !== 'secondary') return

			const pickCondition = slot.every(
				slot.player,
				slot.activeRow,
				slot.itemSlot,
				slot.not(slot.empty)
			)

			if (!game.someSlotFulfills(pickCondition)) return
			const itemRequest: PickRequest = {
				playerId: player.id,
				id: this.props.id,
				message: 'Choose an item to discard from your active Hermit.',
				canPick: pickCondition,
				onResult(pickedSlot) {
					if (!pickedSlot.card) return
					discardCard(game, pickedSlot.card)
				},
				onTimeout() {
					discardCard(game, game.findSlot(pickCondition)?.card || null)
				},
			}

			game.addPickRequest({
				playerId: player.id,
				id: this.props.id,
				message: "Pick one of your opponent's Hermits",
				canPick: slot.every(slot.opponent, slot.hermitSlot, slot.not(slot.empty)),
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex

					// Store the row index to use later
					player.custom[targetKey] = rowIndex

					const targetingAfk = rowIndex !== opponentPlayer.board.activeRow

					if (targetingAfk) {
						// Add a second pick request to remove an item
						game.addPickRequest(itemRequest)
					}
				},
				onTimeout() {
					// We didn't choose anyone so we will just attack as normal
				},
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		player.hooks.getAttackRequests.remove(instance)
	}
}

export default HypnotizdRareHermitCard
