import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {TurnActions} from '../../../types/game-state'
import {discardCard} from '../../../utils/movement'
import EffectCard from '../../base/effect-card'
import {CARDS} from '../..'
import {applySingleUse, removeStatusEffect} from '../../../utils/board'
import {CanAttachResult} from '../../base/card'
import {slot} from '../../../slot'

class WaterBucketEffectCard extends EffectCard {
	constructor() {
		super({
			id: 'water_bucket',
			numericId: 105,
			name: 'Water Bucket',
			rarity: 'common',
			description:
				'Remove burn and String from one of your Hermits.\nIf attached, prevents the Hermit this card is attached to from being burned.',
			log: (values) => {
				if (values.pos.slotType === 'single_use')
					return `${values.defaultLog} on $p${values.pick.name}$`
				return `$p{You|${values.player}}$ attached $e${this.name}$ to $p${values.pos.hermitCard}$`
			},
		})
	}

	override canBeAttachedTo = slot.some(
		slot.singleUseSlot,
		slot.every(slot.player, slot.effectSlot, slot.rowHasHermit)
	)

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, row} = pos
		if (pos.slot.type === 'single_use') {
			game.addPickRequest({
				playerId: player.id,
				id: instance,
				message: 'Pick one of your Hermits',
				canPick: slot.every(slot.player, slot.hermitSlot, slot.not(slot.empty)),
				onResult(pickResult) {
					if (pickResult.rowIndex === undefined) return 'FAILURE_INVALID_SLOT'

					const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
						return (
							ail.targetInstance === pickResult.card?.cardInstance && ail.statusEffectId == 'fire'
						)
					})
					statusEffectsToRemove.forEach((ail) => {
						removeStatusEffect(game, pos, ail.statusEffectInstance)
					})

					if (player.board.rows[pickResult.rowIndex].effectCard?.cardId === 'string') {
						discardCard(game, player.board.rows[pickResult.rowIndex].effectCard)
					}
					for (let i = 0; i < player.board.rows[pickResult.rowIndex].itemCards.length; i++) {
						if (player.board.rows[pickResult.rowIndex].itemCards[i]?.cardId === 'string') {
							discardCard(game, player.board.rows[pickResult.rowIndex].itemCards[i])
						}
					}

					applySingleUse(game, pickResult)

					return 'SUCCESS'
				},
			})
		} else if (pos.slot.type === 'effect') {
			// Straight away remove fire
			const fireStatusEffect = game.state.statusEffects.find((ail) => {
				return ail.targetInstance === row?.hermitCard?.cardInstance && ail.statusEffectId == 'fire'
			})
			if (fireStatusEffect) {
				removeStatusEffect(game, pos, fireStatusEffect.statusEffectInstance)
			}

			player.hooks.onDefence.add(instance, (attack) => {
				if (!row) return
				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return ail.targetInstance === row.hermitCard?.cardInstance && ail.statusEffectId == 'fire'
				})
				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})

			opponentPlayer.hooks.afterApply.add(instance, () => {
				if (!row) return
				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return ail.targetInstance === row.hermitCard?.cardInstance && ail.statusEffectId == 'fire'
				})
				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})
		}
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		opponentPlayer.hooks.afterApply.remove(instance)
		player.hooks.onDefence.remove(instance)
	}

	override showSingleUseTooltip(): boolean {
		return true
	}
}

export default WaterBucketEffectCard
