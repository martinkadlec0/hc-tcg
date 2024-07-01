import {CardPosModel} from '../models/card-pos-model'
import {GameModel} from '../models/game-model'
import {StatusEffectT} from '../types/game-state'
import {getActiveRow, removeStatusEffect} from '../utils/board'
import {isRemovable} from '../utils/cards'
import {discardCard, discardFromHand} from '../utils/movement'
import StatusEffect from './status-effect'
import {broadcast} from '../../server/src/utils/comm'

class ExBossNineStatusEffect extends StatusEffect {
	constructor() {
		super({
			id: 'exboss-nine',
			name: 'Boss Rules',
			description: "At the end of EX's ninth turn, an additional move will be performed.",
			duration: 1,
			counter: true,
			damageEffect: false,
			visible: true,
		})
	}

	override onApply(game: GameModel, statusEffectInfo: StatusEffectT, pos: CardPosModel): void {
		game.state.statusEffects.push(statusEffectInfo)
		const {player, opponentPlayer} = pos

		player.hooks.onTurnStart.add(statusEffectInfo.statusEffectInstance, () => {
			if (statusEffectInfo.duration === undefined) statusEffectInfo.duration = 1
			statusEffectInfo.duration += 1
		})

		player.hooks.onTurnEnd.add(statusEffectInfo.statusEffectInstance, () => {
			if (statusEffectInfo.duration !== 9) return

			let voiceLine: string
			if (Math.random() > 0.5) {
				// Discard the opponent's hand and have them draw one new card
				voiceLine = 'NINEDISCARD'
				game.battleLog.addEntry(
					player.id,
					`{$pYour$|$o${player.playerName}'s$} $eRules$ dictated that {$o${opponentPlayer.playerName}$|$pyou$} must discard {their|your} hand and draw a new card`
				)
				opponentPlayer.hand.forEach((card) => discardFromHand(opponentPlayer, card))
				const newCard = opponentPlayer.pile.shift()
				if (newCard) opponentPlayer.hand.push(newCard)
			} else {
				// Discard all cards attached to the opponent's active hermit
				voiceLine = 'NINEATTACHED'
				game.battleLog.addEntry(
					player.id,
					`{$pYour$|$o${player.playerName}'s$} $eRules$ dictated that {$o${opponentPlayer.playerName}$|$pyou$} must discard everything from {their|your} active Hermit`
				)
				const opponentActiveRow = getActiveRow(opponentPlayer)
				if (opponentActiveRow) {
					if (opponentActiveRow.effectCard && isRemovable(opponentActiveRow.effectCard))
						discardCard(game, opponentActiveRow.effectCard)

					opponentActiveRow.itemCards.forEach((itemCard) => itemCard && discardCard(game, itemCard))
				}
			}

			removeStatusEffect(game, pos, statusEffectInfo.statusEffectInstance)
			broadcast(game.getPlayers(), '@sound/VOICE_ANNOUNCE', {lines: [voiceLine]})
		})
	}

	override onRemoval(game: GameModel, ailmentInfo: StatusEffectT, pos: CardPosModel): void {
		const {player} = pos

		player.hooks.onTurnStart.remove(ailmentInfo.statusEffectInstance)
		player.hooks.onTurnEnd.remove(ailmentInfo.statusEffectInstance)
	}
}

export default ExBossNineStatusEffect
