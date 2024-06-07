import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'

class WeaknessDummyStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'weaknessdummy',
			name: 'Weakness',
			description: 'This hermit currently has modified weaknesses.',
			duration: 0,
			counter: false,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player, opponentPlayer} = pos

		if (statusEffectInfo.statusEffectInstance == 'receiverWeakness') {
			player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
			})
		} else {
			opponentPlayer.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
			})
		}
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		if (statusEffectInfo.statusEffectId == 'receiverWeakness') {
			player.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		} else {
			opponentPlayer.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		}
	}
}

export default WeaknessDummyStatusEffect
