import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {isTargetingPos} from '../../../utils/attacks'
import {discardCard} from '../../../utils/movement'
import EffectCard from '../../base/effect-card'
import {removeStatusEffect} from '../../../utils/board'

class TotemEffectCard extends EffectCard {
	constructor() {
		super({
			id: 'totem',
			numericId: 101,
			name: 'Totem',
			rarity: 'ultra_rare',
			description:
				'Recover 10hp and remain in battle after you are knocked out.\n\nDoes not count as a knockout. Discard after use.',
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		// If we are attacked from any source
		// Add before any other hook so they can know a hermits health reliably
		player.hooks.afterDefence.addBefore(instance, (attack) => {
			if (!isTargetingPos(attack, pos) || !attack.target) return
			const {row} = attack.target
			if (row.health) return

			row.health = 10

			const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
				return ail.targetInstance === pos.card?.cardInstance
			})
			statusEffectsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})

			// This will remove this hook, so it'll only be called once
			discardCard(game, row.effectCard)
		})

		// Also hook into afterAttack of opponent before other hooks, so that health will always be the same when their hooks are called
		// @TODO this is slightly more hacky than I'd like
		opponentPlayer.hooks.afterAttack.addBefore(instance, (attack) => {
			if (!isTargetingPos(attack, pos) || !attack.target) return
			const {row} = attack.target
			if (row.health) return

			row.health = 10

			const thisHermitId = pos.row?.hermitCard?.cardInstance

			const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
				return ail.targetInstance === thisHermitId
			})
			statusEffectsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})

			// This will remove this hook, so it'll only be called once
			discardCard(game, row.effectCard)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		pos.player.hooks.afterDefence.remove(instance)
		pos.opponentPlayer.hooks.afterAttack.remove(instance)
	}
}

export default TotemEffectCard
