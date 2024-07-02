import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {HermitAttackType} from '../../../types/attack'
import {CardInstance} from '../../../types/game-state'
import {slot} from '../../../slot'
import Card, {Hermit, hermit} from '../../base/card'

class RendogRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'rendog_rare',
		numericId: 87,
		name: 'Rendog',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'builder',
		health: 250,
		primary: {
			name: "Comin' At Ya",
			cost: ['builder'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Role Play',
			cost: ['builder', 'builder', 'builder'],
			damage: 0,
			power: "Use an attack from any of your opponent's Hermits.",
		},
	}

	pickCondition = slot.every(
		slot.opponent,
		slot.hermitSlot,
		slot.not(slot.empty),
		slot.not(slot.hasId(this.props.id))
	)

	override getAttack(
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	) {
		const {player} = pos
		const pickedAttackKey = this.getInstanceKey(instance, 'pickedAttack')
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')
		const attack = super.getAttack(game, instance, pos, hermitAttackType)

		if (!attack || attack.type !== 'secondary') return attack
		if (attack.id !== this.getInstanceKey(instance)) return attack

		const imitatingCard: CardInstance | undefined = player.custom[imitatingCardKey]

		if (!imitatingCard) return null

		// No loops please
		if (imitatingCard.props.id === this.props.id) return null
		if (!imitatingCard.isHermit()) return null

		const attackType = player.custom[pickedAttackKey]
		if (!attackType) return null
		// Delete the stored data about the attack we chose
		delete player.custom[pickedAttackKey]

		// Return the attack we picked from the card we picked
		const newAttack = imitatingCard.card.getAttack(game, imitatingCard.instance, pos, attackType)
		if (!newAttack) return null
		const attackName =
			newAttack.type === 'primary'
				? imitatingCard.props.primary.name
				: imitatingCard.props.secondary.name
		newAttack.updateLog(
			(values) =>
				`${values.attacker} ${values.coinFlip ? values.coinFlip + ', then ' : ''} attacked ${
					values.target
				} with $v${imitatingCard.props.name}'s ${attackName}$ for ${values.damage} damage`
		)
		return newAttack
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')
		const pickedAttackKey = this.getInstanceKey(instance, 'pickedAttack')
		const imitatingCardInstance = Math.random().toString()

		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			// Make sure we are attacking
			if (activeInstance !== instance) return
			// Only activate power on secondary attack
			if (hermitAttackType !== 'secondary') return

			game.addPickRequest({
				playerId: player.id,
				id: this.props.id,
				message: "Pick one of your opponent's Hermits",
				canPick: this.pickCondition,
				onResult(pickedSlot) {
					if (!pickedSlot.card) return
					let pickedCard = pickedSlot.card

					game.addModalRequest({
						playerId: player.id,
						data: {
							modalId: 'copyAttack',
							payload: {
								modalName: 'Rendog: Choose an attack to copy',
								modalDescription: "Which of the Hermit's attacks do you want to copy?",
								cardPos: pickedSlot,
							},
						},
						onResult(modalResult) {
							if (!modalResult) return 'FAILURE_INVALID_DATA'
							if (modalResult.cancel) {
								// Cancel this attack so player can choose a different hermit to imitate
								game.state.turn.currentAttack = null
								game.cancelPickRequests()
								return 'SUCCESS'
							}
							if (!modalResult.pick) return 'FAILURE_INVALID_DATA'
							const attack: HermitAttackType = modalResult.pick

							// Store the chosen attack to copy
							player.custom[pickedAttackKey] = attack

							// Replace the hooks of the card we're imitating only if it changed
							const imitatingCard: CardInstance | undefined = player.custom[imitatingCardKey]
							if (!imitatingCard || pickedCard.props.id !== imitatingCard.props.id) {
								if (imitatingCard) {
									// Detach the old card
									imitatingCard.card.onDetach(game, imitatingCard.instance, pos)
								}

								// Attach the new card
								pickedCard.card.onAttach(game, imitatingCardInstance, pos)

								// Store which card we are imitating with our own instance
								player.custom[imitatingCardKey] = new CardInstance(
									pickedCard.card,
									imitatingCardInstance
								)
							}

							// Add the attack requests of the chosen card
							player.hooks.getAttackRequests.call(imitatingCardInstance, modalResult.pick)

							return 'SUCCESS'
						},
						onTimeout() {
							player.custom[pickedAttackKey] = {
								card: pickedCard,
								attack: 'primary',
							}
						},
					})
				},
				onTimeout() {
					// We didn't pick someone to imitate so do nothing
				},
			})
		})

		player.hooks.onActiveRowChange.add(instance, (oldRow, newRow) => {
			if (pos.rowIndex === oldRow) {
				// We switched away from ren, delete the imitating card
				const imitatingCard: CardInstance | undefined = player.custom[imitatingCardKey]
				if (imitatingCard) {
					// Detach the old card
					imitatingCard.card.onDetach(game, imitatingCard.instance, pos)
				}
			}
		})

		player.hooks.blockedActions.add(instance, (blockedActions) => {
			// Block "Role Play" if there are not opposing Hermit cards other than rare Ren(s)
			if (!game.someSlotFulfills(this.pickCondition)) blockedActions.push('SECONDARY_ATTACK')
			return blockedActions
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const imitatingCardKey = this.getInstanceKey(instance, 'imitatingCard')
		const pickedAttackKey = this.getInstanceKey(instance, 'pickedAttack')

		// If the card we are imitating is still attached, detach it
		const imitatingCard: CardInstance | undefined = player.custom[imitatingCardKey]
		if (imitatingCard) {
			imitatingCard.card.onDetach(game, imitatingCard.instance, pos)
		}

		// Remove hooks and custom data
		player.hooks.getAttackRequests.remove(instance)
		player.hooks.onActiveRowChange.remove(instance)
		player.hooks.blockedActions.remove(instance)
		delete player.custom[imitatingCardKey]
		delete player.custom[pickedAttackKey]
	}
}

export default RendogRareHermitCard
