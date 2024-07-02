import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class ZedaphPlaysRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'zedaphplays_rare',
		numericId: 114,
		name: 'Zedaph',
		expansion: 'default',
		rarity: 'rare',
		type: 'explorer',
		tokens: 2,
		health: 290,
		primary: {
			name: 'Sheep Stare',
			cost: ['explorer'],
			damage: 50,
			power:
				"Flip a coin.\nIf heads, on your opponent's next turn, flip a coin.\nIf heads, your opponent's active Hermit attacks themselves.",
		},
		secondary: {
			name: 'Get Dangled',
			cost: ['explorer', 'explorer'],
			damage: 80,
			power: null,
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(instance)
		const coinFlipResult = this.getInstanceKey(instance, 'coinFlipResult')

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== instanceKey || attack.type !== 'primary' || !attacker) return

			const attackerHermit = attacker.row.hermitCard
			const coinFlip = flipCoin(player, attackerHermit)
			if (coinFlip[0] !== 'heads') return

			opponentPlayer.hooks.beforeAttack.add(instance, (attack) => {
				if (!attack.isType('primary', 'secondary') || attack.isBacklash) return
				if (!attack.getAttacker()) return

				// No need to flip a coin for multiple attacks
				if (!player.custom[coinFlipResult]) {
					const coinFlip = flipCoin(player, attackerHermit, 1, opponentPlayer)
					player.custom[coinFlipResult] = coinFlip[0]
				}

				if (player.custom[coinFlipResult] === 'heads') {
					// Change attack target - this just works
					attack.setTarget(this.props.id, attack.getAttacker())
				}
			})

			opponentPlayer.hooks.onTurnEnd.add(instance, () => {
				// Delete our hook at the end of opponents turn
				delete player.custom[coinFlipResult]
				opponentPlayer.hooks.onTurnEnd.remove(instance)
				opponentPlayer.hooks.beforeAttack.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default ZedaphPlaysRareHermitCard
