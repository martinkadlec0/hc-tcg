import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {isTargetingPos} from '../../../utils/attacks'
import {discardCard} from '../../../utils/movement'
import Card, {Attach, attach} from '../../base/card'

class TurtleShellEffectCard extends Card {
	props: Attach = {
		...attach,
		id: 'turtle_shell',
		numericId: 125,
		name: 'Turtle Shell',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		description:
			"Attach to any of your AFK Hermits. On that Hermit's first turn after becoming active, any damage done by your opponent to that Hermit is prevented, and then this card is discarded.",
		attachCondition: slot.every(attach.attachCondition, slot.not(slot.activeRow)),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onTurnEnd.add(instance, () => {
			if (player.board.activeRow === pos.rowIndex) {
				player.custom[instanceKey] = true
			}
		})

		player.hooks.onTurnStart.add(instance, () => {
			if (player.custom[instanceKey]) {
				discardCard(game, pos.card)
			}
		})

		player.hooks.onDefence.add(instance, (attack) => {
			// Only block if just became active
			if (!player.custom[instanceKey]) return
			// Only block damage when we are active
			const isActive = player.board.activeRow === pos.rowIndex
			if (!isActive || !isTargetingPos(attack, pos)) return
			// Do not block backlash attacks
			if (attack.isBacklash) return

			if (attack.getDamage() > 0) {
				// Block all damage
				attack.multiplyDamage(this.props.id, 0).lockDamage(this.props.id)
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onDefence.remove(instance)
		player.hooks.onTurnEnd.remove(instance)
		player.hooks.onTurnStart.remove(instance)
		delete player.custom[instanceKey]
	}
}

export default TurtleShellEffectCard
