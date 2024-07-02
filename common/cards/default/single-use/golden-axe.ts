import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class GoldenAxeSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'golden_axe',
		numericId: 31,
		name: 'Golden Axe',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		description:
			"Do 40hp damage to your opponent's active Hermit.\nAny effect card attached to your opponent's active Hermit is ignored during this turn.",
		hasAttack: true,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		let attacking = false

		player.hooks.getAttack.add(instance, () => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return null
			const opponentActivePos = getActiveRowPos(opponentPlayer)
			if (!opponentActivePos) return null

			const axeAttack = new AttackModel({
				id: this.getInstanceKey(instance),
				attacker: activePos,
				target: opponentActivePos,
				type: 'effect',
				log: (values) =>
					`${values.defaultLog} to attack ${values.target} for ${values.damage} damage`,
			}).addDamage(this.props.id, 40)

			return axeAttack
		})

		player.hooks.beforeAttack.addBefore(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const opponentActivePos = getActiveRowPos(opponentPlayer)

			attacking = true

			if (!opponentActivePos) return null

			if (attack.id === attackId) {
				applySingleUse(game)
			}

			attack.shouldIgnoreSlots.push(slot.every(slot.opponent, slot.attachSlot, slot.activeRow))
		})

		player.hooks.afterAttack.add(instance, () => {
			player.hooks.getAttack.remove(instance)
			player.hooks.afterAttack.remove(instance)
		})

		player.hooks.onTurnEnd.add(instance, () => {
			player.hooks.beforeAttack.remove(instance)
			player.hooks.onTurnEnd.remove(instance)

			attacking = false
		})

		player.hooks.onDetach.add(instance, () => {
			player.hooks.getAttack.remove(instance)
			player.hooks.onTurnEnd.remove(instance)
			if (!attacking) {
				player.hooks.beforeAttack.remove(instance)
			}
		})
	}
}

export default GoldenAxeSingleUseCard
