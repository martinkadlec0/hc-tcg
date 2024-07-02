import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import {removeStatusEffect} from '../../../utils/board'
import Card, {Hermit, hermit} from '../../base/card'

class VintageBeefRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'vintagebeef_rare',
		numericId: 103,
		name: 'Beef',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'builder',
		health: 290,
		primary: {
			name: 'Pojk',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Beefy Tunes',
			cost: ['builder', 'builder'],
			damage: 80,
			power:
				'Flip a coin.\nIf heads, all status effects are removed from your active and AFK Hermits.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary' || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)
			if (coinFlip[0] !== 'heads') return

			player.board.rows.forEach((row) => {
				if (!row.hermitCard) return

				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return ail.targetInstance === row.hermitCard.instance
				})

				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default VintageBeefRareHermitCard
