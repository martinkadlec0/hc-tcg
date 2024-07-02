import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {getActiveRow} from '../../../utils/board'
import Card, {hermit, Hermit} from '../../base/card'

class FiveAMPearlRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'fiveampearl_rare',
		numericId: 230,
		name: '5AM Pearl',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		type: 'balanced',
		health: 270,
		primary: {
			name: 'Wicked',
			cost: ['balanced'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Dogs of War',
			cost: ['balanced', 'balanced'],
			damage: 70,
			power: 'If Wolf card is attached to this Hermit, do an additional 30hp damage.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.beforeAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			const effectCard = getActiveRow(player)?.effectCard
			if (!effectCard || effectCard.props.id !== 'wolf') return

			attack.addDamage(this.props.id, 30)
		})

		player.hooks.onTurnEnd.add(instance, () => {
			delete player.custom[this.getInstanceKey(instance)]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.beforeAttack.remove(instance)
		player.hooks.onTurnEnd.remove(instance)
		delete player.custom[this.getInstanceKey(instance)]
	}
}

export default FiveAMPearlRareHermitCard
