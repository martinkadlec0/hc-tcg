import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {hermit, Hermit} from '../../base/card'

class OverseerRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'overseer_rare',
		numericId: 235,
		name: 'Overseer',
		expansion: 'alter_egos_ii',
		background: 'alter_egos',
		palette: 'alter_egos',
		rarity: 'rare',
		tokens: 0,
		type: 'miner',
		health: 250,
		primary: {
			name: 'Testing',
			cost: ['miner'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Starched',
			cost: ['miner', 'miner'],
			damage: 80,
			power: 'Attack damage doubles versus Farm types.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.beforeAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const target = attack.getTarget()
			if (attack.id !== attackId || attack.type !== 'secondary' || !target) return

			const isFarmer =
				target.row.hermitCard.isHermit() && target.row.hermitCard.props.type === 'farm' ? 2 : 1

			attack.multiplyDamage(this.props.id, isFarmer)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.beforeAttack.remove(instance)
	}
}

export default OverseerRareHermitCard
