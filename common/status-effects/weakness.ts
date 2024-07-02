import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CARDS} from '../cards'
import {CardPosModel, getCardPos} from '../models/card-pos-model'
import {getActiveRow, removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {isTargetingPos} from '../utils/attacks'

class WeaknessStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'weakness',
			name: 'Weakness',
			description: "This Hermit is weak to the opponent's active Hermit's type.",
			duration: 3,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player, opponentPlayer} = pos

		if (!statusEffectInfo.duration) statusEffectInfo.duration = this.duration

		if (pos.card) {
			game.battleLog.addEntry(player.id, `$p${pos.card.props.name}$ was inflicted with $eWeakness$`)
		}

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (!statusEffectInfo.duration) return
			statusEffectInfo.duration--

			if (statusEffectInfo.duration === 0)
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
		})

		opponentPlayer.hooks.onAttack.add(statusEffectInfo.statusEffectInstance, (attack) => {
			const targetPos = getCardPos(game, statusEffectInfo.targetInstance)

			if (!targetPos) return

			if (!isTargetingPos(attack, targetPos) || attack.createWeakness === 'never') {
				return
			}

			attack.createWeakness = 'always'
		})

		player.hooks.onAttack.add(statusEffectInfo.statusEffectInstance, (attack) => {
			const targetPos = getCardPos(game, statusEffectInfo.targetInstance)

			if (!targetPos) return

			if (!isTargetingPos(attack, targetPos) || attack.createWeakness === 'never') {
				return
			}

			const attacker = attack.getAttacker()
			const opponentActiveHermit = getActiveRow(opponentPlayer)

			if (
				!attacker ||
				!opponentActiveHermit ||
				!attacker.row.hermitCard.card.isHermit() ||
				!opponentActiveHermit.hermitCard.card.isHermit()
			)
				return

			const attackerType = attacker.row.hermitCard.card.props.type
			const opponentType = opponentActiveHermit.hermitCard.card.props.type

			if (attackerType !== opponentType) return

			attack.createWeakness = 'always'
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
		const {player, opponentPlayer} = pos
		opponentPlayer.hooks.onAttack.remove(statusEffectInfo.statusEffectInstance)
		opponentPlayer.hooks.onAttack.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.afterDefence.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default WeaknessStatusEffect
