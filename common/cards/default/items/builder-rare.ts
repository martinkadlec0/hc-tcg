import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class BuilderRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_builder_rare',
		numericId: 52,
		name: 'Builder',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'builder',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default BuilderRareItemCard
