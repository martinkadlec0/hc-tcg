import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import SingleUseCard from '../../base/single-use-card'
import {applyStatusEffect} from '../../../utils/board'

class SplashPotionOfPoisonSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'splash_potion_of_poison',
			numericId: 90,
			name: 'Splash Potion of Poison',
			rarity: 'rare',
			description:
				'Deal an additional 20hp damage every turn until poisoned Hermit is down to 10hp.\n\nIgnores armour. Continues to poison if health is recovered.\n\nDoes not knock out Hermit.',
		})
	}

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onApply.add(instance, () => {
			const opponentActiveRow = opponentPlayer.board.activeRow
			if (opponentActiveRow === null) return
			applyStatusEffect(
				game,
				'poison',
				opponentPlayer.board.rows[opponentActiveRow].hermitCard?.cardInstance
			)
		})
	}

	override canAttach(game: GameModel, pos: CardPosModel) {
		const result = super.canAttach(game, pos)

		if (pos.opponentPlayer.board.activeRow === null) result.push('UNMET_CONDITION')

		return result
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}
}

export default SplashPotionOfPoisonSingleUseCard
