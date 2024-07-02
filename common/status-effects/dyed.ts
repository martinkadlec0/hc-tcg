import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {StatusEffectT} from '../types/game-state'

class DyedStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'dyed',
			name: 'Dyed',
			description: 'Items attached to this Hermit become any type.',
			duration: 0,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player} = pos

		const hasDyed = game.state.statusEffects.some(
			(a) => a.targetInstance === pos.card?.instance && a.statusEffectId === 'dyed'
		)

		if (hasDyed) return

		game.state.statusEffects.push(statusEffectInfo)

		player.hooks.availableEnergy.add(statusEffectInfo.statusEffectInstance, (availableEnergy) => {
			if (player.board.activeRow === null) return availableEnergy

			const activeRow = player.board.rows[player.board.activeRow]

			if (statusEffectInfo.targetInstance !== activeRow.hermitCard?.instance) return availableEnergy

			return availableEnergy.map(() => 'any')
		})
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.availableEnergy.remove(statusEffectInfo.statusEffectInstance)
		opponentPlayer.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default DyedStatusEffect
