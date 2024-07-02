import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class TinFoilChefRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'tinfoilchef_rare',
		numericId: 98,
		name: 'TFC',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'miner',
		health: 300,
		primary: {
			name: 'True Hermit',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Branch Mine',
			cost: ['miner', 'miner'],
			damage: 80,
			power: 'Flip a coin.\nIf heads, you draw an extra card at the end of your turn.',
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

			const drawCard = player.pile.shift()
			if (drawCard) player.hand.push(drawCard)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default TinFoilChefRareHermitCard
