import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {getActiveRow} from '../../../utils/board'
import {applyStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'
import Card, {SingleUse, singleUse} from '../../base/card'

class PotionOfWeaknessSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'potion_of_weakness',
		numericId: 146,
		name: 'Potion of Weakness',
		expansion: 'alter_egos',
		rarity: 'common',
		tokens: 2,
		description: "Your opponent's active Hermit is weak to your active Hermit's type for 3 turns.",
		sidebarDescriptions: [
			{
				type: 'glossary',
				name: 'weak',
			},
		],
		showConfirmationModal: true,
		attachCondition: slot.every(singleUse.attachCondition, slot.opponentHasActiveHermit),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {opponentPlayer, player} = pos

		player.hooks.onApply.add(instance, () => {
			const opponentActiveRow = getActiveRow(opponentPlayer)
			if (!opponentActiveRow) return
			applyStatusEffect(game, 'weakness', opponentActiveRow.hermitCard?.instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default PotionOfWeaknessSingleUseCard
