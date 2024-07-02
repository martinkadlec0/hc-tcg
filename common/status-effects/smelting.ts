import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {StatusEffectT} from '../types/game-state'
import {discardCard} from '../utils/movement'

class SmeltingStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'smelting',
			name: 'Smelting',
			description:
				'When the counter reaches 0, upgrades all item cards attached to this Hermit to double items',
			duration: 4,
			counter: true,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player} = pos

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (statusEffectInfo.duration === undefined) return
			statusEffectInfo.duration -= 1
			if (statusEffectInfo.duration === 0) {
				discardCard(game, pos.card)
				pos.row?.itemCards.forEach((card) => {
					if (!card) return
					card.card.props.id = card.card.props.id.replace('common', 'rare')
				})
			}
		})
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default SmeltingStatusEffect
