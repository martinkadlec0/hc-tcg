import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {SingleUse, singleUse} from '../../base/card'

// We could stop displaying the coin flips but I think it may confuse players when Zedaph or Pearl uses fortune.
class FortuneSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'fortune',
		numericId: 26,
		name: 'Fortune',
		expansion: 'default',
		rarity: 'ultra_rare',
		tokens: 1,
		description: 'Any coin flips on this turn are not required, as "heads" is assumed.',
		showConfirmationModal: true,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			player.hooks.onCoinFlip.add(instance, (card, coinFlips) => {
				for (let i = 0; i < coinFlips.length; i++) {
					coinFlips[i] = 'heads'
				}
				return coinFlips
			})

			player.hooks.onTurnStart.add(instance, () => {
				player.hooks.onTurnStart.remove(instance)
				player.hooks.onCoinFlip.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.remove(instance)
	}
}

export default FortuneSingleUseCard
