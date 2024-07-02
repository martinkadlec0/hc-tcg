import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applyStatusEffect} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class LavaBucketSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'lava_bucket',
		numericId: 74,
		name: 'Lava Bucket',
		expansion: 'default',
		rarity: 'rare',
		tokens: 3,
		description: "Burn your opponent's active Hermit.",
		showConfirmationModal: true,
		attachCondition: slot.every(singleUse.attachCondition, slot.opponentHasActiveHermit),
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'fire',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const opponentActiveRow = opponentPlayer.board.activeRow
			if (opponentActiveRow === null) return
			applyStatusEffect(
				game,
				'fire',
				opponentPlayer.board.rows[opponentActiveRow].hermitCard?.instance
			)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default LavaBucketSingleUseCard
