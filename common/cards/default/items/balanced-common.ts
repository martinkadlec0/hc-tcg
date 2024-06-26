import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import ItemCard from '../../base/item-card'

class BalancedCommonItemCard extends ItemCard {
	constructor() {
		super({
			id: 'item_balanced_common',
			numericId: 49,
			name: 'Balanced',
			rarity: 'common',
			type: 'balanced',
		})
	}

	getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.type]
	}
}

export default BalancedCommonItemCard
