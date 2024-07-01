import EffectCard from '../../base/effect-card'
import {isTargetingPos} from '../../../utils/attacks'
import {GameModel} from '../../../models/game-model'
import {discardCard} from '../../../utils/movement'
import {CardPosModel, getBasicCardPos} from '../../../models/card-pos-model'
import {TurnActions} from '../../../types/game-state'
import {getActiveRow} from '../../../utils/board'
import {CanAttachResult} from '../../base/card'
import {hasActive} from '../../../utils/game'

class BerryBushEffectCard extends EffectCard {
	constructor() {
		super({
			id: 'berry_bush',
			numericId: 200,
			name: 'Sweet Berry Bush',
			rarity: 'ultra_rare',
			description:
				"Use like a Hermit card. Place on one of your opponent's empty Hermit slots. Has 30hp.\nCan not attach cards to it.\nYou do not get a point when it's knocked out.\nLoses 10hp per turn. If you knock out Sweet Berry Bush before it's HP becomes 0, add 2 Instant Healing II into your hand.",
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, row} = pos
		if (!row) return

		row.health = 30

		player.hooks.afterAttack.add(instance, () => {
			if (!row.health) {
				// Discard to prevent losing a life
				discardCard(game, row.hermitCard)
			}
		})

		player.hooks.canAttach.add(instance, (result, pos) => {
			if (pos.row?.hermitCard?.cardInstance !== instance) return
			if (['item', 'effect'].includes(pos.slot.type)) result.push('UNMET_CONDITION_SILENT')
		})

		opponentPlayer.hooks.afterAttack.add(instance, () => {
			if (!row.health) {
				// Discard to prevent losing a life
				discardCard(game, row.hermitCard)
				for (let i = 0; i < 2; i++) {
					const cardInfo = {
						cardId: 'instant_health_ii',
						cardInstance: Math.random().toString(),
					}
					opponentPlayer.hand.push(cardInfo)
				}
			}
		})

		opponentPlayer.hooks.onTurnEnd.add(instance, () => {
			if (!row.health || row.health <= 10) {
				discardCard(game, row.hermitCard)
				return
			}
			row.health -= 10
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, slot, row} = pos

		if (getActiveRow(player) === row) {
			game.changeActiveRow(player, null)
		}

		if (slot && slot.type === 'hermit' && row) {
			row.health = null
			row.effectCard = null
			row.itemCards = row.itemCards.map(() => null)
		}

		player.hooks.afterAttack.remove(instance)
		player.hooks.canAttach.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.onTurnEnd.remove(instance)
	}

	override canAttach(game: GameModel, pos: CardPosModel) {
		const {slot} = pos
		const {currentPlayer, opponentPlayer} = game
		const result: CanAttachResult = []

		if (!slot || slot.type !== 'hermit') result.push('INVALID_SLOT')
		if (pos.player.id !== opponentPlayer.id) result.push('INVALID_PLAYER')
		if (!hasActive(opponentPlayer) || !hasActive(currentPlayer)) result.push('UNMET_CONDITION')

		return result
	}

	public override getActions(game: GameModel): TurnActions {
		const {opponentPlayer} = game

		// Is there a hermit slot free on the board
		const spaceForHermit = opponentPlayer.board.rows.some((row) => !row.hermitCard)

		return spaceForHermit ? ['PLAY_HERMIT_CARD'] : []
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override showAttachTooltip() {
		return false
	}
}

export default BerryBushEffectCard
