import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class RedstoneRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_redstone_rare',
		numericId: 64,
		name: 'Redstone',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'redstone',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default RedstoneRareItemCard
