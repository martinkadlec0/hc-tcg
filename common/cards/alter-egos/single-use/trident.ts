import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {CardInstance} from '../../../types/game-state'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import {discardSingleUse} from '../../../utils/movement'
import Card, {SingleUse, singleUse} from '../../base/card'

class TridentSingleUseCard extends Card<SingleUse> {
	props: SingleUse = {
		...singleUse,
		id: 'trident',
		numericId: 150,
		name: 'Trident',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 2,
		description:
			"Do 30hp damage to your opponent's active Hermit.\nFlip a coin.\nIf heads, this card is returned to your hand.",
		hasAttack: true,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.getAttack.add(instance, () => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return null
			const opponentActivePos = getActiveRowPos(opponentPlayer)
			if (!opponentActivePos) return null

			const tridentAttack = new AttackModel({
				id: this.getInstanceKey(instance),
				attacker: activePos,
				target: opponentActivePos,
				type: 'effect',
				log: (values) =>
					`${values.defaultLog} to attack ${values.target} for ${values.damage} damage, then ${values.coinFlip}`,
			}).addDamage(this.props.id, 30)

			return tridentAttack
		})

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			if (attack.id !== attackId) return

			player.custom[this.getInstanceKey(instance)] = flipCoin(
				player,
				new CardInstance(this, instance)
			)[0]

			applySingleUse(game)
		})

		player.hooks.onApply.add(instance, () => {
			// Return to hand
			if (player.custom[this.getInstanceKey(instance)] === 'heads') {
				// Reset single use card used, won't return to the hand otherwise
				player.board.singleUseCardUsed = false
				discardSingleUse(game, player)
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.getAttack.remove(instance)
		player.hooks.onApply.remove(instance)
		player.hooks.onAttack.remove(instance)
		delete player.custom[this.getInstanceKey(instance)]
	}
}

export default TridentSingleUseCard
