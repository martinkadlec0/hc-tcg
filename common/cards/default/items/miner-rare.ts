import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Item, item} from '../../base/card'

class MinerRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_miner_rare',
		numericId: 58,
		name: 'Miner',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'miner',
	}

	override getEnergy(game: GameModel, instance: string, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default MinerRareItemCard
