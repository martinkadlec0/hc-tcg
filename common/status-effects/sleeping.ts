import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {slot} from '../slot'

class SleepingStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'sleeping',
			name: 'Sleep',
			description:
				'While your Hermit is sleeping, you can not attack or make your active Hermit go AFK. If sleeping Hermit is made AFK by your opponent, they wake up.',
			duration: 3,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, card, row, rowIndex} = pos

		if (!card || !row?.hermitCard || rowIndex === null || !card.card.isHealth()) return

		game.state.statusEffects.push(statusEffectInfo)
		game.addBlockedActions(this.id, 'PRIMARY_ATTACK', 'SECONDARY_ATTACK', 'CHANGE_ACTIVE_HERMIT')
		if (!statusEffectInfo.duration) statusEffectInfo.duration = this.duration

		row.health = card.card.props.health

		game.battleLog.addEntry(
			player.id,
			`$p${card.props.name}$ went to $eSleep$ and restored $gfull health$`
		)

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))
			if (!targetPos || !statusEffectInfo.duration) return
			statusEffectInfo.duration--

			if (statusEffectInfo.duration === 0 || player.board.activeRow !== targetPos.rowIndex) {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
				return
			}

			if (player.board.activeRow === targetPos.rowIndex)
				game.addBlockedActions(
					this.id,
					'PRIMARY_ATTACK',
					'SECONDARY_ATTACK',
					'CHANGE_ACTIVE_HERMIT'
				)
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

export default SleepingStatusEffect
