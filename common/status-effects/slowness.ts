import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {slot} from '../slot'

class SlownessStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'slowness',
			name: 'Slowness',
			description: 'This Hermit can only use their primary attack.',
			duration: 1,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player} = pos

		if (!statusEffectInfo.duration) statusEffectInfo.duration = this.duration

		if (pos.card) {
			game.battleLog.addEntry(player.id, `$p${pos.card.props.name}$ was inflicted with $eSlowness$`)
		}

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))
			if (!targetPos || targetPos.rowIndex === null) return

			if (player.board.activeRow === targetPos.rowIndex)
				game.addBlockedActions(this.id, 'SECONDARY_ATTACK')
		})

		player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))
			if (!targetPos || targetPos.rowIndex === null) return
			if (!statusEffectInfo.duration) return

			statusEffectInfo.duration--

			if (statusEffectInfo.duration === 0) {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
				return
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
		player.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.afterDefence.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default SlownessStatusEffect
