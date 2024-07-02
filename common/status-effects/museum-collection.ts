import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {executeAttacks} from '../utils/attacks'
import {AttackModel} from '../models/attack-model'
import {slot} from '../slot'

class MuseumCollectionStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'museum-collection',
			name: 'Museum Collection Size',
			description:
				"Number of cards you've played this turn. Each card adds 20 damage to Biffa's secondary attack.",
			duration: 0,
			counter: true,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const oldHandSize = this.getInstanceKey(statusEffectInfo.statusEffectInstance)
		const {player} = pos

		player.custom[oldHandSize] = player.hand.length

		player.hooks.onAttach.add(statusEffectInfo.statusEffectInstance, (instance) => {
			if (player.hand.length === player.custom[oldHandSize]) return
			const instanceLocation = game.findSlot(slot.hasInstance(instance))
			if (statusEffectInfo.duration === undefined) return
			player.custom[oldHandSize] = player.hand.length
			if (instanceLocation?.type === 'single_use') return
			statusEffectInfo.duration++
		})

		player.hooks.onApply.add(statusEffectInfo.statusEffectInstance, () => {
			if (statusEffectInfo.duration === undefined) return
			player.custom[oldHandSize] = player.hand.length
			statusEffectInfo.duration++
		})

		player.hooks.onAttack.add(statusEffectInfo.statusEffectInstance, (attack) => {
			const activeRow = player.board.activeRow
			if (activeRow === null) return
			const targetHermit = player.board.rows[activeRow].hermitCard
			if (!targetHermit) return
			if (
				attack.id !==
					this.getTargetInstanceKey(targetHermit?.card.props.id, statusEffectInfo.targetInstance) ||
				attack.type !== 'secondary'
			)
				return
			if (statusEffectInfo.duration === undefined) return

			player.hooks.onApply.remove(statusEffectInfo.statusEffectInstance)
			player.hooks.onApply.add(statusEffectInfo.statusEffectInstance, () => {
				if (statusEffectInfo.duration === undefined) return
				statusEffectInfo.duration++

				const additionalAttack = new AttackModel({
					id: this.getInstanceKey(statusEffectInfo.statusEffectInstance, 'additionalAttack'),
					attacker: attack.getAttacker(),
					target: attack.getTarget(),
					type: 'secondary',
				})
				additionalAttack.addDamage(this.id, 20)

				player.hooks.onApply.remove(statusEffectInfo.statusEffectInstance)

				executeAttacks(game, [additionalAttack], true)
			})

			attack.addDamage(this.id, 20 * statusEffectInfo.duration)
		})

		player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			delete player.custom[oldHandSize]
			removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
		})

		player.hooks.afterDefence.add(statusEffectInfo.statusEffectInstance, (attack) => {
			const attackTarget = attack.getTarget()
			if (!attackTarget) return
			if (attackTarget.row.hermitCard.instance !== statusEffectInfo.targetInstance) return
			if (attackTarget.row.health > 0) return
			removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
		})
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onApply.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onAttach.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onAttack.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.afterDefence.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default MuseumCollectionStatusEffect
