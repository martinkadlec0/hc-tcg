import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {applyStatusEffect, removeStatusEffect} from '../../../utils/board'
import HermitCard from '../../base/hermit-card'

class OrionSoundRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'orionsound_rare',
			numericId: 213,
			name: 'Oli',
			rarity: 'rare',
			hermitType: 'speedrunner',
			health: 280,
			primary: {
				name: 'Melody',
				cost: ['speedrunner'],
				damage: 60,
				power:
					'Select an Active or AFK Hermit. This Hermit is healed by 10hp every turn until Oli is knocked out.',
			},
			secondary: {
				name: 'Concert',
				cost: ['speedrunner', 'speedrunner'],
				damage: 80,
				power: null,
			},
		})
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(instance)
		player.custom[instanceKey] = []

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'primary') return

			game.addPickRequest({
				playerId: player.id,
				id: instance,
				message: 'Choose an Active or AFK Hermit to heal.',
				canPick: slot.every(slot.not(slot.empty), slot.hermitSlot),
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || rowIndex === null) return

					applyStatusEffect(game, 'melody', pickedSlot.card.cardInstance)
					player.custom[instanceKey].push(pickedSlot.card.cardInstance)
				},
			})
		})

		const afterAttack = (attack: AttackModel) => {
			const attackTarget = attack.getTarget()
			if (!attackTarget || attackTarget.row.health > 0) return
			if (attackTarget.player !== pos.player || attackTarget.rowIndex !== pos.rowIndex) return

			const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
				return (
					player.custom[instanceKey].includes(ail.targetInstance) && ail.statusEffectId == 'melody'
				)
			})
			statusEffectsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})
		}

		player.hooks.afterAttack.add(instance, (attack) => afterAttack(attack))
		opponentPlayer.hooks.afterAttack.add(instance, (attack) => afterAttack(attack))
	}

	public override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player, opponentPlayer} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.remove(instance)
		player.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
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

export default OrionSoundRareHermitCard
