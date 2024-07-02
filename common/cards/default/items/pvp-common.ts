import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class PvPCommonItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_pvp_common',
		numericId: 61,
		name: 'PvP',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		type: 'pvp',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type]
	}
}

export default PvPCommonItemCard
