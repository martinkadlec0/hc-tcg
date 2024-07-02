import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class EthosLabUltraRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'ethoslab_ultra_rare',
		numericId: 21,
		name: 'Etho',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 3,
		type: 'pvp',
		health: 250,
		primary: {
			name: 'Ladders',
			cost: ['any'],
			damage: 30,
			power: null,
		},
		secondary: {
			name: 'Slab',
			cost: ['any', 'any'],
			damage: 70,
			power: 'Flip a coin 3 times.\nDo an additional 20hp damage for every heads.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const attacker = attack.getAttacker()
			if (attack.id !== attackId || attack.type !== 'secondary' || !attacker) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard, 3)
			const headsAmount = coinFlip.filter((flip) => flip === 'heads').length
			attack.addDamage(this.props.id, headsAmount * 20)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default EthosLabUltraRareHermitCard
