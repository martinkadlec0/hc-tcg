import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {slot} from '../slot'

class MelodyStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'melody',
			name: "Ollie's Melody",
			description: 'This Hermit heals 10hp every turn.',
			duration: 0,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player} = pos

		const hasMelody = game.state.statusEffects.some(
			(a) => a.targetInstance === pos.card?.instance && a.statusEffectId === 'melody'
		)

		if (hasMelody) return

		game.state.statusEffects.push(statusEffectInfo)

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))
			if (!targetPos || !targetPos.row || !targetPos.row.hermitCard) return
			if (targetPos.rowIndex === null) return

			const hermitCard = targetPos.row.hermitCard
			if (hermitCard) {
				const maxHealth = Math.max(targetPos.row.health, hermitCard.card.props.health)
				targetPos.row.health = Math.min(targetPos.row.health + 10, maxHealth)
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
		player.hooks.afterDefence.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default MelodyStatusEffect
