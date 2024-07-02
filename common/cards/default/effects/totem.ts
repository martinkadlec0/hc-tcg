import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {isTargetingPos} from '../../../utils/attacks'
import {discardCard} from '../../../utils/movement'
import {removeStatusEffect} from '../../../utils/board'
import {AttackModel} from '../../../models/attack-model'
import Card, {Attach, attach} from '../../base/card'

class TotemEffectCard extends Card {
	props: Attach = {
		...attach,
		id: 'totem',
		numericId: 101,
		name: 'Totem',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 3,
		description:
			'If the Hermit this card is attached to is knocked out, they are revived with 10hp.\nDoes not count as a knockout. Discard after use.',
		sidebarDescriptions: [
			{
				type: 'glossary',
				name: 'knockout',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		const reviveHook = (attack: AttackModel) => {
			const target = attack.getTarget()
			if (!isTargetingPos(attack, pos) || !target) return
			const {row} = target
			if (row.health) return

			row.health = 10

			const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
				return ail.targetInstance === pos.card?.instance
			})
			statusEffectsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})

			const revivedHermit = row.hermitCard.props.name
			game.battleLog.addEntry(player.id, `Using $eTotem$, $p${revivedHermit}$ revived with $g10hp$`)

			// This will remove this hook, so it'll only be called once
			discardCard(game, row.effectCard)
		}

		// If we are attacked from any source
		// Add before any other hook so they can know a hermits health reliably
		player.hooks.afterDefence.addBefore(instance, (attack) => reviveHook(attack))

		// Also hook into afterAttack of opponent before other hooks, so that health will always be the same when their hooks are called
		// @TODO this is slightly more hacky than I'd like
		opponentPlayer.hooks.afterAttack.addBefore(instance, (attack) => reviveHook(attack))
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		pos.player.hooks.afterDefence.remove(instance)
		pos.opponentPlayer.hooks.afterAttack.remove(instance)
	}
}

export default TotemEffectCard
