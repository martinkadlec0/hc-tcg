import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class TargetBlockSingleUseCard extends Card {
	pickCondition = slot.every(
		slot.opponent,
		slot.hermitSlot,
		slot.not(slot.activeRow),
		slot.not(slot.empty)
	)

	props: SingleUse = {
		...singleUse,
		id: 'target_block',
		numericId: 149,
		name: 'Target Block',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 3,
		description:
			"Choose one of your opponent's AFK Hermits to take all damage done during this turn.",
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const ignoreThisWeakness = this.getInstanceKey(instance, 'ignoreThisWeakness')

		game.addPickRequest({
			playerId: player.id,
			id: this.props.id,
			message: "Pick one of your opponent's AFK Hermits",
			canPick: this.pickCondition,
			onResult(pickedSlot) {
				const rowIndex = pickedSlot.rowIndex
				if (!pickedSlot.card || rowIndex === null) return

				const row = opponentPlayer.board.rows[rowIndex]
				if (!row.hermitCard) return

				// Apply the card
				applySingleUse(game, pickedSlot)

				// Redirect all future attacks this turn
				player.hooks.beforeAttack.add(instance, (attack) => {
					if (attack.isType('status-effect') || attack.isBacklash) return

					attack.setTarget(this.id, {
						player: opponentPlayer,
						rowIndex,
						row,
					})
				})
			},
		})

		player.hooks.onTurnEnd.add(instance, () => {
			player.hooks.beforeAttack.remove(instance)
			player.hooks.onTurnEnd.remove(instance)
			opponentPlayer.hooks.onDefence.remove(instance)
			delete player.custom[ignoreThisWeakness]
		})
	}
}

export default TargetBlockSingleUseCard
