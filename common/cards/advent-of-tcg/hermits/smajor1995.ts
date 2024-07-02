import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import HermitCard from '../../base/hermit-card'
import {applyStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'

class Smajor1995RareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'smajor1995_rare',
			numericId: 218,
			name: 'Scott',
			rarity: 'rare',
			type: 'builder',
			health: 270,
			primary: {
				name: 'Color Splash',
				cost: ['any'],
				damage: 30,
				power: null,
			},
			secondary: {
				name: 'To Dye For',
				cost: ['any', 'any', 'any'],
				damage: 70,
				power:
					'After your attack, select one of your Hermits. Items attached to this Hermit become any type.',
			},
		})
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			const pickCondition = slot.every(
				slot.player,
				slot.not(slot.activeRow),
				slot.not(slot.empty),
				slot.hermitSlot
			)

			if (!game.someSlotFulfills(pickCondition)) return

			game.addPickRequest({
				playerId: player.id,
				id: instance,
				message: 'Choose an AFK Hermit to dye.',
				canPick: pickCondition,
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || rowIndex === null) return

					applyStatusEffect(game, 'dyed', pickedSlot.card.instance)
				},
			})
		})
	}

	public override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.remove(instance)
		delete player.custom[instanceKey]
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override getPalette() {
		return 'advent_of_tcg'
	}

	override getBackground() {
		return 'advent_of_tcg'
	}
}

export default Smajor1995RareHermitCard
