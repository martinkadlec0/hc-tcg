import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class FarmCommonItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_farm_common',
		numericId: 55,
		name: 'Farm',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'farm',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type]
	}
}

export default FarmCommonItemCard
