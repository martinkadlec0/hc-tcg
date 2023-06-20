import SingleUseCard from './_single-use-card'
import {GameModel} from '../../../../server/models/game-model'
import {HERMIT_CARDS} from '../..'


class InstantHealthSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'instant_health',
			name: 'Instant Health',
			rarity: 'common',
			description: 'Heal active or AFK Hermit 30hp.',
			pickOn: 'apply',
			pickReqs: [{target: 'player', type: ['hermit'], amount: 1}],
		})
	}

	/**
	 * @param {GameModel} game
	 * @param {string} instance
	 * @param {import('../../../types/cards').CardPos} pos
	 * @param {import('server/utils/picked-cards').PickedSlots} pickedSlots
	 */
	onApply(game, instance, pos, pickedSlots) {
		const pickedCards = pickedSlots[this.id] || []
		if (pickedCards.length !== 1) return

		const row = pickedCards[0].row?.state
		if (!row || !row.health) return
		const card = row.hermitCard
		if (!card) return
		const hermitInfo = HERMIT_CARDS[card.cardId]
		row.health = Math.min(row.health + 30, hermitInfo.health)
	}
}

export default InstantHealthSingleUseCard
