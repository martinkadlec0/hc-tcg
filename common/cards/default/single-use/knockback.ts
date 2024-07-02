import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse, getActiveRow} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class KnockbackSingleUseCard extends Card {
	pickCondition = slot.every(
		slot.opponent,
		slot.hermitSlot,
		slot.not(slot.activeRow),
		slot.not(slot.empty)
	)

	props: SingleUse = {
		...singleUse,
		id: 'knockback',
		numericId: 73,
		name: 'Knockback',
		expansion: 'default',
		rarity: 'rare',
		tokens: 0,
		description:
			'After your attack, your opponent must choose an AFK Hermit to set as their active Hermit, unless they have no AFK Hermits.',
		log: (values) => `${values.defaultLog} with {your|their} attack`,
		attachCondition: slot.every(
			singleUse.attachCondition,
			slot.someSlotFulfills(this.pickCondition)
		),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.afterAttack.add(instance, (attack) => {
			applySingleUse(game)

			// Only Apply this for the first attack
			player.hooks.afterAttack.remove(instance)
		})

		player.hooks.onApply.add(instance, () => {
			const activeRow = getActiveRow(opponentPlayer)

			if (activeRow && activeRow.health) {
				game.addPickRequest({
					playerId: opponentPlayer.id,
					id: this.props.id,
					message: 'Choose a new active Hermit from your AFK Hermits',
					canPick: this.pickCondition,
					onResult(pickedSlot) {
						if (pickedSlot.rowIndex === null) return

						game.changeActiveRow(opponentPlayer, pickedSlot.rowIndex)
					},
					onTimeout: () => {
						const row = game.filterSlots(this.pickCondition)[0]
						if (row === undefined || row.rowIndex === null) return
						game.changeActiveRow(game.opponentPlayer, row.rowIndex)
					},
				})
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.afterAttack.remove(instance)
		player.hooks.onApply.remove(instance)
	}
}

export default KnockbackSingleUseCard
