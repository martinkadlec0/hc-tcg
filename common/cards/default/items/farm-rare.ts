import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class FarmRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_farm_rare',
		numericId: 56,
		name: 'Farm',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'farm',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default FarmRareItemCard
