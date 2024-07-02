import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class BalancedRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_balanced_rare',
		numericId: 50,
		name: 'Balanced',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'balanced',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default BalancedRareItemCard
