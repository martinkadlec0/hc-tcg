import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class NetheriteSwordSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'netherite_sword',
		numericId: 83,
		name: 'Netherite Sword',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 3,
		description: "Do 60hp damage to your opponent's active Hermit.",
		hasAttack: true,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.getAttack.add(instance, () => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return null
			const opponentActivePos = getActiveRowPos(opponentPlayer)
			if (!opponentActivePos) return null

			const swordAttack = new AttackModel({
				id: this.getInstanceKey(instance, 'attack'),
				attacker: activePos,
				target: opponentActivePos,
				type: 'effect',
				log: (values) =>
					`${values.defaultLog} to attack ${values.target} for ${values.damage} damage`,
			}).addDamage(this.props.id, 60)

			return swordAttack
		})

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance, 'attack')
			if (attack.id !== attackId) return

			// We've executed our attack, apply effect
			applySingleUse(game)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.getAttack.remove(instance)
		player.hooks.onAttack.remove(instance)
	}
}

export default NetheriteSwordSingleUseCard
