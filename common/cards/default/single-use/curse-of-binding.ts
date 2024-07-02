import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {SingleUse, singleUse} from '../../base/card'

class CurseOfBindingSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'curse_of_binding',
		numericId: 11,
		name: 'Curse Of Binding',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		description: 'Your opponent can not make their active Hermit go AFK on their next turn.',
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {opponentPlayer, player} = pos

		player.hooks.onApply.add(instance, () => {
			opponentPlayer.hooks.onTurnStart.add(instance, () => {
				game.addBlockedActions(this.props.id, 'CHANGE_ACTIVE_HERMIT')

				opponentPlayer.hooks.onTurnStart.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.remove(instance)
	}
}

export default CurseOfBindingSingleUseCard
