import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CardPosModel} from '../models/card-pos-model'
import {removeStatusEffect} from '../utils/board'
import {StatusEffectT} from '../types/game-state'
import {CARDS} from '../cards'
import {slot} from '../slot'

class BadOmenStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'badomen',
			name: 'Bad Omen',
			description: 'All coinflips are tails.',
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
			game.battleLog.addEntry(player.id, `$p${pos.card.props.name}$ was inflicted with $bBad Omen$`)
		}

		opponentPlayer.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (!statusEffectInfo.duration) return
			statusEffectInfo.duration--

			if (statusEffectInfo.duration === 0)
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
		})

		player.hooks.onCoinFlip.addBefore(statusEffectInfo.statusEffectInstance, (card, coinFlips) => {
			const targetPos = game.findSlot(slot.hasInstance(statusEffectInfo.targetInstance))

			// Only modify when the target hermit is "flipping"
			const {currentPlayer} = game
			if (
				statusEffectInfo.targetInstance !== card.instance &&
				(currentPlayer.id !== player.id || player.board.activeRow !== targetPos?.rowIndex)
			) {
				return coinFlips
			}

			for (let i = 0; i < coinFlips.length; i++) {
				if (coinFlips[i]) coinFlips[i] = 'tails'
			}
			return coinFlips
		})
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		player.hooks.onCoinFlip.remove(statusEffectInfo.statusEffectInstance)
		opponentPlayer.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default BadOmenStatusEffect
