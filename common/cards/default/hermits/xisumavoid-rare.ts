import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import {applyStatusEffect, getActiveRow} from '../../../utils/board'
import Card, {Hermit, hermit} from '../../base/card'

class XisumavoidRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'xisumavoid_rare',
		numericId: 112,
		name: 'Xisuma',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'redstone',
		health: 280,
		primary: {
			name: 'Goodness Me',
			cost: ['redstone'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Cup of Tea',
			cost: ['redstone', 'redstone'],
			damage: 80,
			power: "Flip a coin.\nIf heads, poison your opponent's active Hermit.",
		},
		sidebarDescriptions: [
			{
				type: 'statusEffect',
				name: 'poison',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			const attacker = attack.getAttacker()
			if (attack.id !== attackId || attack.type !== 'secondary' || !attack.getTarget() || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] !== 'heads') return

			const opponentActiveRow = getActiveRow(opponentPlayer)
			if (!opponentActiveRow || !opponentActiveRow.hermitCard) return

			applyStatusEffect(game, 'poison', opponentActiveRow?.hermitCard.instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default XisumavoidRareHermitCard
