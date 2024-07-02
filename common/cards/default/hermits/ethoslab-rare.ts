import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import {applyStatusEffect, getActiveRow} from '../../../utils/board'
import Card, {Hermit, hermit} from '../../base/card'

class EthosLabRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'ethoslab_rare',
		numericId: 20,
		name: 'Etho',
		expansion: 'default',
		rarity: 'rare',
		tokens: 3,
		type: 'redstone',
		health: 280,
		primary: {
			name: 'Oh Snappers',
			cost: ['redstone'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Blue Fire',
			cost: ['redstone', 'redstone'],
			damage: 80,
			power: "Flip a coin.\nIf heads, burn your opponent's active Hermit.",
		},
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'fire',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			const attackId = this.getInstanceKey(instance)
			if (attack.id !== attackId || attack.type !== 'secondary' || !attack.getTarget() || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] !== 'heads') return

			const opponentActiveRow = getActiveRow(opponentPlayer)
			if (!opponentActiveRow || !opponentActiveRow.hermitCard) return

			applyStatusEffect(game, 'fire', opponentActiveRow?.hermitCard.instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default EthosLabRareHermitCard
