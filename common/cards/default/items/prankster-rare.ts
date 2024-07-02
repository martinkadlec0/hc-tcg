import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class PranksterRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_prankster_rare',
		numericId: 60,
		name: 'Prankster',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'prankster',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default PranksterRareItemCard
