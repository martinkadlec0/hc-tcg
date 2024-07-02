import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class PvPRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_pvp_rare',
		numericId: 62,
		name: 'PvP',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'pvp',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default PvPRareItemCard
