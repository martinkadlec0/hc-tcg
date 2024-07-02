import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class ExplorerRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_explorer_rare',
		numericId: 54,
		name: 'Explorer',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'explorer',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default ExplorerRareItemCard
