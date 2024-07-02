import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel, getCardPos} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {isTargetingPos} from '../utils/attacks'

class ProtectedStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'protected',
			name: "Sheriff's Protection",
			description: 'This Hermit does not take damage on their first active turn.',
			duration: 0,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(statusEffectInfo.statusEffectInstance)

		player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			if (player.board.activeRow === pos.rowIndex) {
				player.custom[instanceKey] = true
			}
		})

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (player.custom[instanceKey]) {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
			}
		})

		player.hooks.onDefence.add(statusEffectInfo.statusEffectInstance, (attack) => {
			const targetPos = getCardPos(game, statusEffectInfo.targetInstance)
			if (!targetPos) return
			// Only block if just became active
			if (!player.custom[instanceKey]) return
			// Only block damage when we are active
			const isActive = player.board.activeRow === pos.rowIndex
			if (!isActive || !isTargetingPos(attack, targetPos)) return
			// Do not block backlash attacks
			if (attack.isBacklash) return

			if (attack.getDamage() > 0) {
				// Block all damage
				attack.multiplyDamage(this.id, 0).lockDamage(this.id)
			}
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
		const instanceKey = this.getInstanceKey(statusEffectInfo.statusEffectInstance)

		player.hooks.onDefence.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onDefence.remove(statusEffectInfo.statusEffectInstance)
		delete player.custom[instanceKey]
	}
}

export default ProtectedStatusEffect
