import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applyStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'
import Card, {SingleUse, singleUse} from '../../base/card'

class SplashPotionOfPoisonSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'splash_potion_of_poison',
		numericId: 90,
		name: 'Splash Potion of Poison',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		description: "Poison your opponent's active Hermit.",
		showConfirmationModal: true,
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'poison',
			},
		],
		attachCondition: slot.every(singleUse.attachCondition, slot.opponentHasActiveHermit),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const opponentActiveRow = opponentPlayer.board.activeRow
			if (opponentActiveRow === null) return
			applyStatusEffect(
				game,
				'poison',
				opponentPlayer.board.rows[opponentActiveRow].hermitCard?.instance
			)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default SplashPotionOfPoisonSingleUseCard
