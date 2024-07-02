import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {SlotInfo} from '../../../types/cards'
import {CardInstance} from '../../../types/game-state'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {SingleUse, singleUse} from '../../base/card'

class EggSingleUseCard extends Card<SingleUse> {
	pickCondition = slot.every(
		slot.opponent,
		slot.hermitSlot,
		slot.not(slot.activeRow),
		slot.not(slot.empty)
	)

	props: SingleUse = {
		...singleUse,
		id: 'egg',
		numericId: 140,
		name: 'Egg',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		description:
			"After your attack, choose one of your opponent's AFK Hermits to set as their active Hermit, and then flip a coin.\nIf heads, also do 10hp damage to that Hermit.",
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
		log: (values) => `${values.defaultLog} on $o${values.pick.name}$`,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const targetKey = this.getInstanceKey(instance, 'target')

		player.hooks.getAttackRequests.add(instance, () => {
			game.addPickRequest({
				playerId: player.id,
				id: this.props.id,
				message: "Pick one of your opponent's AFK Hermits",
				canPick: this.pickCondition,
				onResult(pickedSlot) {
					if (!pickedSlot.card || pickedSlot.rowIndex === null) return

					// Store the row index to use later
					player.custom[targetKey] = pickedSlot
				},
				onTimeout() {
					// We didn't pick a target so do nothing
				},
			})
		})

		player.hooks.onAttack.add(instance, (attack) => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return []

			const pickInfo: SlotInfo = player.custom[targetKey]
			if (!pickInfo || pickInfo.rowIndex === null || pickInfo.rowIndex == undefined) return
			const opponentRow = opponentPlayer.board.rows[pickInfo.rowIndex]
			if (!opponentRow.hermitCard) return

			applySingleUse(game, pickInfo)

			const coinFlip = flipCoin(player, new CardInstance(this, instance))
			if (coinFlip[0] === 'heads') {
				const eggAttack = new AttackModel({
					id: this.getInstanceKey(instance),
					attacker: activePos,
					target: {
						player: opponentPlayer,
						rowIndex: pickInfo.rowIndex,
						row: opponentRow,
					},
					log: (values) =>
						`$p{You|${values.player}}$ flipped $gheads$ on $eEgg$ and did an additional ${values.damage} to ${values.target}`,
					type: 'effect',
				}).addDamage(this.props.id, 10)

				attack.addNewAttack(eggAttack)
			}

			player.hooks.afterAttack.add(instance, () => {
				const pickInfo: SlotInfo = player.custom[targetKey]
				if (pickInfo.rowIndex === null || pickInfo.rowIndex === null) return
				game.changeActiveRow(opponentPlayer, pickInfo.rowIndex)

				delete player.custom[targetKey]

				player.hooks.afterAttack.remove(instance)
			})

			// Only do this once if there are multiple attacks
			player.hooks.onAttack.remove(instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.getAttackRequests.remove(instance)
		player.hooks.onAttack.remove(instance)
	}
}

export default EggSingleUseCard
