import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {healHermit} from '../../../types/game-state'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class FalseSymmetryRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'falsesymmetry_rare',
		numericId: 23,
		name: 'False',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'builder',
		health: 250,
		primary: {
			name: 'High Noon',
			cost: ['builder'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Supremacy',
			cost: ['builder', 'any'],
			damage: 70,
			power: 'Flip a coin.\nIf heads, heal this Hermit 40hp.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const attacker = attack.getAttacker()
			if (attack.id !== attackId || attack.type !== 'secondary' || !attacker) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] === 'tails') return

			// Heal 40hp
			healHermit(pos.row, 40)
			game.battleLog.addEntry(player.id, `$p${attacker.row.hermitCard.props.name}$ healed $g40hp$`)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default FalseSymmetryRareHermitCard
