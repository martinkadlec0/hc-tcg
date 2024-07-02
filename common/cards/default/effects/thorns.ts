import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {executeExtraAttacks, isTargetingPos} from '../../../utils/attacks'
import Card, {Attach, attach} from '../../base/card'

class ThornsEffectCard extends Card {
	props: Attach = {
		...attach,
		id: 'thorns',
		numericId: 96,
		name: 'Thorns',
		expansion: 'default',
		rarity: 'common',
		tokens: 2,
		description:
			"When the Hermit this card is attached to takes damage, your opponent's active Hermit takes 20hp damage.\nIgnores armour.",
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const triggeredKey = this.getInstanceKey(instance, 'triggered')

		// Only when the opponent attacks us
		opponentPlayer.hooks.afterAttack.add(instance, (attack) => {
			// If we have already triggered once this turn do not do so again
			if (player.custom[triggeredKey]) return

			if (!attack.isType('primary', 'secondary', 'effect') || attack.isBacklash) return
			// Only return a backlash attack if the attack did damage
			if (attack.calculateDamage() <= 0) return

			if (!attack.getAttacker() || !isTargetingPos(attack, pos)) return

			player.custom[triggeredKey] = true

			const backlashAttack = new AttackModel({
				id: this.getInstanceKey(instance, 'backlash'),
				attacker: attack.getTarget(),
				target: attack.getAttacker(),
				type: 'effect',
				isBacklash: true,
				log: (values) => `${values.target} took ${values.damage} damage from $eThorns$`,
			}).addDamage(this.props.id, 20)

			backlashAttack.shouldIgnoreSlots.push(
				slot.hasId('gold_armor', 'iron_armor', 'diamond_armor', 'netherite_armor')
			)

			executeExtraAttacks(game, [backlashAttack])
		})

		opponentPlayer.hooks.onTurnEnd.add(instance, () => {
			delete player.custom[triggeredKey]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const triggeredKey = this.getInstanceKey(instance, 'triggered')
		opponentPlayer.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.onTurnEnd.remove(instance)
		delete player.custom[triggeredKey]
	}
}

export default ThornsEffectCard
