import Card, {CanAttachResult} from './card'
import {PlayCardLog, CardRarityT, EnergyT, HermitTypeT} from '../../types/cards'
import {GameModel} from '../../models/game-model'
import {CardPosModel} from '../../models/card-pos-model'
import {TurnActions} from '../../types/game-state'
import {FormattedTextNode, formatText} from '../../utils/formatting'
import {HERMIT_CARDS} from '..'
import {slot} from '../../slot'

type ItemDefs = {
	id: string
	numericId: number
	name: string
	rarity: CardRarityT
	hermitType: HermitTypeT
}

abstract class ItemCard extends Card {
	public hermitType: HermitTypeT

	constructor(defs: ItemDefs) {
		super({
			type: 'item',
			id: defs.id,
			numericId: defs.numericId,
			name: defs.name,
			rarity: defs.rarity,
		})

		this.hermitType = defs.hermitType

		this.updateLog(
			(values) =>
				`$p{You|${values.player}}$ attached $m${values.pos.name}$ to $p${values.pos.hermitCard}$`
		)
	}

	public override attachCondition = slot.every(
		slot.player,
		slot.itemSlot,
		slot.empty,
		slot.rowHasHermit,
		(game, pos) => !game.getAllBlockedActions().includes('PLAY_SINGLE_USE_CARD')
	)

	public override getFormattedDescription(): FormattedTextNode {
		return this.rarity === 'rare' ? formatText('*Counts as 2 Item cards.*') : formatText('')
	}

	public abstract getEnergy(game: GameModel, instance: string, pos: CardPosModel): Array<EnergyT>
}

export default ItemCard
