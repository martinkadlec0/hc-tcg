import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class LlamadadRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'llamadad_rare',
		numericId: 134,
		name: 'Llamadad',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'rare',
		tokens: 2,
		type: 'balanced',
		health: 290,
		primary: {
			name: 'Spitz',
			cost: ['balanced'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Matilda',
			cost: ['balanced', 'balanced'],
			damage: 80,
			power: 'Flip a coin.\nIf heads, do an additional 40hp damage.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary' || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)
			if (coinFlip[0] === 'heads') {
				attack.addDamage(this.props.id, 40)
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default LlamadadRareHermitCard
