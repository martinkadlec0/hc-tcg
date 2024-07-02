import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import HermitCard from '../../base/hermit-card'
import {applyStatusEffect, removeStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'

class SolidaritygamingRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'solidaritygaming_rare',
			numericId: 220,
			name: 'Jimmy',
			rarity: 'rare',
			type: 'prankster',
			health: 270,
			primary: {
				name: 'The Law',
				cost: ['prankster', 'any'],
				damage: 70,
				power:
					'After your attack, choose one of your AFK Hermits to protect. This Hermit does not take damage on their first active turn.\nOnly one Hermit can be protected at a time.',
			},
			secondary: {
				name: 'Not a toy',
				cost: ['prankster', 'prankster', 'prankster'],
				damage: 100,
				power: null,
			},
		})
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'primary') return
			player.board.rows.forEach((row) => {
				if (!row.hermitCard) return

				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return (
						ail.targetInstance === row.hermitCard.instance && ail.statusEffectId === 'protected'
					)
				})

				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})

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
				message: 'Choose an AFK Hermit to protect',
				canPick: pickCondition,
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || rowIndex === null) return

					applyStatusEffect(game, 'protected', pickedSlot.card.instance)
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

export default SolidaritygamingRareHermitCard
