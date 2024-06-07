import StatusEffect from './status-effect'
import {GameModel} from '../models/game-model'
import {CARDS, HERMIT_CARDS} from '../cards'
import {getCardPos, CardPosModel} from '../models/card-pos-model'
import {getActiveRow, applyStatusEffect, removeStatusEffect} from '../utils/board'
import {StatusEffectT, CardT} from '../types/game-state'
import {STRENGTHS} from '../const/strengths'

class WeaknessStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'weakness',
			name: 'Weakness',
			description: 'This will assign dummies for UI.',
			duration: 3,
			counter: false,
			damageEffect: false,
			visible: false,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		game.state.statusEffects.push(statusEffectInfo)
		const {player, opponentPlayer} = pos
		const strongType = HERMIT_CARDS[getActiveRow(opponentPlayer)!.hermitCard.cardId].hermitType
		const weakType = HERMIT_CARDS[getActiveRow(player)!.hermitCard.cardId].hermitType

		// Purely asthetic.
		function applyDummies() {
			for (let i = 0; i < player.board.rows.length; i++) {
				const row = opponentPlayer.board.rows[i]

				if (row.hermitCard) {
					const card = row.hermitCard
					if (HERMIT_CARDS[card.cardId].hermitType == weakType) {
						applyStatusEffect(
							game,
							'weaknessdummy',
							card.cardInstance,
							Math.random().toString(),
							statusEffectInfo.duration!
						)
					}
				}
			}
			for (let i = 0; i < player.board.rows.length; i++) {
				const row = player.board.rows[i]

				if (row.hermitCard) {
					const card = row.hermitCard
					if (HERMIT_CARDS[card.cardId].hermitType == weakType) {
						applyStatusEffect(
							game,
							'weaknessdummy',
							card.cardInstance,
							'receiverWeakness',
							statusEffectInfo.duration!
						)
					}
				}
			}
		}

		if (!statusEffectInfo.duration) statusEffectInfo.duration = this.duration

		applyDummies()

		STRENGTHS[strongType].push(weakType)

		player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			if (!statusEffectInfo.duration) return
			statusEffectInfo.duration--

			if (statusEffectInfo.duration === 0) {
				removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)

				for (let i = 0; i < STRENGTHS[strongType].length; i++) {
					if (STRENGTHS[strongType][i] == weakType) {
						delete STRENGTHS[strongType][i]
						break
					}
				}
			}
		})

		opponentPlayer.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (!STRENGTHS[strongType].includes(weakType)) {
				STRENGTHS[strongType].push(weakType)
			}

			applyDummies()
		})

		player.hooks.onAttach.add(statusEffectInfo.statusEffectInstance, (instance) => {
			// Declare card and check for nulls.
			if (getCardPos(game, instance) == null) return
			const card = getCardPos(game, instance)!.card
			if (card == null) return

			const cardType = CARDS[card.cardId].type

			if (cardType == 'hermit') {
				const hermitType = HERMIT_CARDS[card.cardId].hermitType
				if (hermitType == weakType) {
					applyStatusEffect(
						game,
						'weaknessdummy',
						card.cardInstance,
						'receiverWeakness',
						statusEffectInfo.duration!
					)
				}
			}
		})

		opponentPlayer.hooks.onAttach.add(statusEffectInfo.statusEffectInstance, (instance) => {
			// Declare card and check for nulls.
			if (getCardPos(game, instance) == null) return
			const card = getCardPos(game, instance)!.card
			if (card == null) return

			const cardType = CARDS[card.cardId].type

			if (cardType == 'hermit') {
				const hermitType = HERMIT_CARDS[card.cardId].hermitType
				if (hermitType == weakType) {
					applyStatusEffect(
						game,
						'weaknessdummy',
						card.cardInstance,
						Math.random().toString(),
						statusEffectInfo.duration!
					)
				}
			}
		})
	}

	override onRemoval(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		player.hooks.onTurnEnd.remove(statusEffectInfo.statusEffectInstance)
		opponentPlayer.hooks.onTurnStart.remove(statusEffectInfo.statusEffectInstance)
		player.hooks.onAttach.remove(statusEffectInfo.statusEffectInstance)
		opponentPlayer.hooks.onAttach.remove(statusEffectInfo.statusEffectInstance)
	}
}

export default WeaknessStatusEffect
