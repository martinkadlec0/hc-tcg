import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {discardSingleUse} from '../../../utils/movement'
import Card, {Hermit, hermit} from '../../base/card'

// Because of this card we can't rely elsewhere on the suCard to be in state on turnEnd hook
class GeminiTayRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'geminitay_rare',
		numericId: 28,
		name: 'Gem',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'terraform',
		health: 270,
		primary: {
			name: "It's Fine",
			cost: ['terraform'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Geminislay',
			cost: ['terraform', 'terraform'],
			damage: 80,
			power: 'At the end of your turn, you may use an additional single use effect card.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			player.hooks.afterAttack.add(instance, (attack) => {
				// Discard the single-use card.
				discardSingleUse(game, player)

				// We are hooking into afterAttack, so we just remove the blocks on actions
				// The beauty of this is that there is no need to replicate any of the existing logic anymore
				game.removeCompletedActions('SINGLE_USE_ATTACK', 'PLAY_SINGLE_USE_CARD')
				game.removeBlockedActions('game', 'PLAY_SINGLE_USE_CARD')

				player.hooks.afterAttack.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		// Remove hook
		player.hooks.onAttack.remove(instance)
	}
}

export default GeminiTayRareHermitCard
