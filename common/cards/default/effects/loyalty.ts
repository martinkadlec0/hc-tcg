import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {moveCardInstanceoHand} from '../../../utils/movement'
import Card, {Attach, attach} from '../../base/card'

class LoyaltyEffectCard extends Card {
	props: Attach = {
		...attach,
		id: 'loyalty',
		numericId: 77,
		name: 'Loyalty',
		expansion: 'default',
		rarity: 'rare',
		tokens: 0,
		description:
			'When the Hermit that this card is attached to is knocked out, all attached item cards are returned to your hand.',
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		const afterAttack = (attack: AttackModel) => {
			const attackTarget = attack.getTarget()
			if (!attackTarget || attackTarget.row.health > 0) return
			if (attackTarget.player !== pos.player || attackTarget.rowIndex !== pos.rowIndex) return

			// Return all attached item cards to the hand
			for (let i = 0; i < attackTarget.row.itemCards.length; i++) {
				const card = attackTarget.row.itemCards[i]
				if (card) {
					moveCardInstanceoHand(game, card)
				}
			}
		}

		player.hooks.afterAttack.add(instance, (attack) => afterAttack(attack))
		opponentPlayer.hooks.afterAttack.add(instance, (attack) => afterAttack(attack))
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		player.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
	}
}

export default LoyaltyEffectCard
