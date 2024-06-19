import {CARDS} from '../..'
import {CardPosModel, getCardPos} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse, getNonEmptyRows} from '../../../utils/board'
import SingleUseCard from '../../base/single-use-card'

const pickCondition = slot.every(
	slot.opponent,
	slot.hermitSlot,
	slot.not(slot.activeRow),
	slot.not(slot.empty)
)

class TargetBlockSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'target_block',
			numericId: 149,
			name: 'Target Block',
			rarity: 'rare',
			description:
				"Choose one of your opponent's AFK Hermits to take all damage done during this turn.",
		})
	}

	override _attachCondition = slot.every(
		super.attachCondition,
		(game, pos) => getNonEmptyRows(game.opponentPlayer, true).length > 0
	)

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const ignoreThisWeakness = this.getInstanceKey(instance, 'ignoreThisWeakness')

		game.addPickRequest({
			playerId: player.id,
			id: this.id,
			message: "Pick one of your opponent's AFK Hermits",
			canPick: pickCondition,
			onResult(pickResult) {
				const rowIndex = pickResult.rowIndex
				if (!pickResult.card || rowIndex === undefined) return

				const row = opponentPlayer.board.rows[rowIndex]
				if (!row.hermitCard) return

				// Apply the card
				applySingleUse(game, pickResult)

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

	override getExpansion() {
		return 'alter_egos'
	}
}

export default TargetBlockSingleUseCard
