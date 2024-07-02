import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applyStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'
import Card, {SingleUse, singleUse} from '../../base/card'

class BadOmenSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'bad_omen',
		numericId: 139,
		name: 'Bad Omen',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		description: `Give your opponent's active Hermit bad omen for their next 3 turns.`,
		showConfirmationModal: true,
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'badomen',
			},
		],
		attachCondition: slot.every(singleUse.attachCondition, slot.opponentHasActiveHermit),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {opponentPlayer, player} = pos
		const activeRow = opponentPlayer.board.activeRow
		if (activeRow === null) return

		player.hooks.onApply.add(instance, () => {
			applyStatusEffect(game, 'badomen', opponentPlayer.board.rows[activeRow].hermitCard?.instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default BadOmenSingleUseCard
