import {CardPosModel, getCardPos} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {discardCard} from '../../../utils/movement'
import EffectCard from '../../base/effect-card'

class SlimeballEffectCard extends EffectCard {
	constructor() {
		super({
			id: 'slimeball',
			numericId: 204,
			name: 'Slimeball',
			rarity: 'ultra_rare',
			description:
				"Attach to any Hermit, including your opponent's. That Hermit and its attached items will not be removed from the slot they are attached to, unless that Hermit is knocked out. Attached cards cannot be removed until slimeball is discarded.",
		})
	}

	override _attachCondition = slot.every(
		slot.opponent,
		slot.attachSlot,
		slot.empty,
		slot.rowHasHermit,
		slot.actionAvailable('PLAY_EFFECT_CARD'),
		slot.not(slot.frozen)
	)

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.freezeSlots.add(instance, () => {
			return slot.every(
				slot.player,
				slot.rowIndex(pos.rowIndex),
				slot.not(slot.attachSlot),
				slot.not(slot.empty)
			)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		pos.player.hooks.freezeSlots.remove(instance)
		pos.player.hooks.onDetach.remove(instance)
	}

	public override getExpansion(): string {
		return 'advent_of_tcg'
	}
}

export default SlimeballEffectCard
