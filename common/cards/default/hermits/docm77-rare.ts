import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class Docm77RareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'docm77_rare',
		numericId: 16,
		name: 'Docm77',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'farm',
		health: 280,
		primary: {
			name: 'Shadow Tech',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'World Eater',
			cost: ['farm', 'farm'],
			damage: 80,
			power: 'Flip a Coin.\nIf heads, attack damage doubles.\nIf tails, attack damage is halved.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const attacker = attack.getAttacker()
			if (attack.id !== attackId || attack.type !== 'secondary' || !attacker) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] === 'heads') {
				attack.addDamage(this.props.id, this.props.secondary.damage)
			} else {
				attack.reduceDamage(this.props.id, this.props.secondary.damage / 2)
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default Docm77RareHermitCard
