import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applySingleUse, removeStatusEffect} from '../../../utils/board'
import {slot} from '../../../slot'
import Card, {Attach, SingleUse, attach, singleUse} from '../../base/card'

class MilkBucketEffectCard extends Card {
	props: Attach & SingleUse = {
		...attach,
		...singleUse,
		id: 'milk_bucket',
		numericId: 79,
		name: 'Milk Bucket',
		category: 'attach',
		expansion: 'default',
		rarity: 'common',
		tokens: 0,
		description:
			'Remove poison and bad omen from one of your Hermits.\nIf attached, prevents the Hermit this card is attached to from being poisoned.',
		attachCondition: slot.some(attach.attachCondition, singleUse.attachCondition),
		log: (values) => {
			if (values.pos.slotType === 'single_use')
				return `${values.defaultLog} on $p${values.pick.name}$`
			return `$p{You|${values.player}}$ attached $e${this.props.name}$ to $p${values.pos.hermitCard}$`
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, row} = pos
		if (pos.type === 'single_use') {
			game.addPickRequest({
				playerId: player.id,
				id: instance,
				message: 'Pick one of your Hermits',
				canPick: slot.every(slot.player, slot.hermitSlot, slot.not(slot.empty)),
				onResult(pickedSlot) {
					const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
						return (
							ail.targetInstance === pickedSlot.card?.instance &&
							(ail.statusEffectId == 'poison' || ail.statusEffectId == 'badomen')
						)
					})
					statusEffectsToRemove.forEach((ail) => {
						removeStatusEffect(game, pos, ail.statusEffectInstance)
					})

					applySingleUse(game, pickedSlot)
				},
			})
		} else if (pos.type === 'attach') {
			// Straight away remove poison
			const poisonStatusEffect = game.state.statusEffects.find((ail) => {
				return ail.targetInstance === row?.hermitCard?.instance && ail.statusEffectId == 'poison'
			})
			if (poisonStatusEffect) {
				removeStatusEffect(game, pos, poisonStatusEffect.statusEffectInstance)
			}

			player.hooks.onDefence.add(instance, (attack) => {
				if (!row) return
				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return (
						ail.targetInstance === row.hermitCard?.instance &&
						(ail.statusEffectId == 'poison' || ail.statusEffectId == 'badomen')
					)
				})
				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})

			opponentPlayer.hooks.afterApply.add(instance, () => {
				if (!row) return
				const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
					return (
						ail.targetInstance === row.hermitCard?.instance &&
						(ail.statusEffectId == 'poison' || ail.statusEffectId == 'badomen')
					)
				})
				statusEffectsToRemove.forEach((ail) => {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				})
			})
		}
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		player.hooks.onDefence.remove(instance)
		opponentPlayer.hooks.afterApply.remove(instance)
	}
}

export default MilkBucketEffectCard
