import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applyStatusEffect, getActiveRow} from '../../../utils/board'
import Card, {Hermit, hermit} from '../../base/card'

class BdoubleO100RareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'bdoubleo100_rare',
		numericId: 1,
		name: 'Bdubs',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'balanced',
		health: 260,
		primary: {
			name: 'Retexture',
			cost: ['any'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Shreep',
			cost: ['balanced', 'balanced', 'any'],
			damage: 0,
			power:
				'This Hermit restores all HP, then sleeps for the rest of this turn, and the following two turns, before waking up.',
		},
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'sleeping',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (!attacker) return
			const attackId = this.getInstanceKey(instance)
			if (attack.id !== attackId || attack.type !== 'secondary') return

			const row = getActiveRow(player)

			if (!row) return

			// Add new sleeping statusEffect
			applyStatusEffect(game, 'sleeping', row.hermitCard.instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default BdoubleO100RareHermitCard
