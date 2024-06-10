import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import SingleUseCard from '../../base/single-use-card'
import {HERMIT_CARDS} from '../../index'

class SplashPotionOfHealingIISingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'splash_potion_of_healing_ii',
			numericId: 147,
			name: 'Splash Potion of Healing II',
			rarity: 'rare',
			description: 'Heal all of your Hermits 30hp.',
			log: (values) => `${values.defaultLog} and healed all {your|their} Hermits $g30hp$`,
		})
	}

	override canApply() {
		return true
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onApply.add(instance, () => {
			for (const row of player.board.rows) {
				if (!row.hermitCard) continue
				const hermitInfo = HERMIT_CARDS[row.hermitCard.cardId]
				if (hermitInfo) {
					const maxHealth = Math.max(row.health, hermitInfo.health)
					row.health = Math.min(row.health + 30, maxHealth)
				}
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onApply.remove(instance)
	}

	override getExpansion() {
		return 'alter_egos'
	}
}

export default SplashPotionOfHealingIISingleUseCard
