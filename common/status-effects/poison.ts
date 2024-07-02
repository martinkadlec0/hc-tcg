import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {RowPos} from '../types/cards'
import {CardPosModel} from '../models/card-pos-model'
import {AttackModel} from '../models/attack-model'
import {getActiveRowPos, removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {executeExtraAttacks} from '../utils/attacks'
import {slot} from '../slot'

class PoisonStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'poison',
			name: 'Poison',
			description:
				"Poisoned Hermits take an additional 20hp damage at the end of their opponent's turn, until down to 10hp. Can not stack with burn.",
			duration: 0,
			counter: false,
			damageEffect: true,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		const hasDamageEffect = game.state.statusEffects.some(
			(a) => a.targetInstance === pos.card?.instance && a.damageEffect === true
		)

		if (hasDamageEffect) return

		game.state.statusEffects.push(statusEffectInfo)

		if (pos.card) {
			game.battleLog.addEntry(player.id, `$p${pos.card.props.name}$ was $ePoisoned$`)
		}

		opponentPlayer.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))
			if (!targetPos || !targetPos.row || targetPos.rowIndex === null) return
			if (!targetPos.row.hermitCard) return

			const activeRowPos = getActiveRowPos(opponentPlayer)
			const sourceRow: RowPos | null = activeRowPos
				? {
						player: activeRowPos.player,
						rowIndex: activeRowPos.rowIndex,
						row: activeRowPos.row,
				  }
				: null

			const targetRow: RowPos = {
				player: targetPos.player,
				rowIndex: targetPos.rowIndex,
				row: targetPos.row,
			}

			const statusEffectAttack = new AttackModel({
				id: this.getInstanceKey(statusEffectInfo.statusEffectInstance, 'statusEffectAttack'),
				attacker: sourceRow,
				target: targetRow,
				type: 'status-effect',
				log: (values) => `${values.target} took ${values.damage} damage from $bPoison$`,
			})

			if (targetPos.row.health >= 30) {
				statusEffectAttack.addDamage(this.id, 20)
			} else if (targetPos.row.health == 20) {
				statusEffectAttack.addDamage(this.id, 10)
			}

			executeExtraAttacks(game, [statusEffectAttack], true)
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
		opponentPlayer.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.afterDefence.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default PoisonStatusEffect
