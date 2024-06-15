import EffectCard from '../../base/effect-card'
import {isTargetingPos} from '../../../utils/attacks'
import {GameModel} from '../../../models/game-model'
import {discardCard} from '../../../utils/movement'
import {CardPosModel} from '../../../models/card-pos-model'
import {TurnActions} from '../../../types/game-state'
import {hermitCardBattleLog} from '../../base/hermit-card'
import {slot} from '../../../slot'

class ArmorStandEffectCard extends EffectCard {
	constructor() {
		super({
			id: 'armor_stand',
			numericId: 118,
			name: 'Armour Stand',
			rarity: 'ultra_rare',
			description:
				'Use like a Hermit card with a maximum 50hp.\nYou can not attach any cards to this card. While this card is active, you can not attack, or use damaging effect cards.\nIf this card is knocked out, it does not count as a knockout.',
			log: hermitCardBattleLog('Armour Stand'),
		})
	}

	override attachCondition = slot.every(slot.player, slot.hermitSlot)

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, row} = pos
		if (!row) return

		row.health = 50
		if (player.board.activeRow === null) {
			game.changeActiveRow(player, pos.rowIndex)
		}

		// The menu won't show up but just in case someone tries to cheat
		player.hooks.blockedActions.add(instance, (blockedActions) => {
			if (player.board.activeRow === pos.rowIndex) {
				blockedActions.push('PRIMARY_ATTACK')
				blockedActions.push('SECONDARY_ATTACK')
				blockedActions.push('SINGLE_USE_ATTACK')
			}

			return blockedActions
		})

		player.hooks.afterAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (!row.health && attacker && isTargetingPos(attack, pos)) {
				// Discard to prevent losing a life
				discardCard(game, row.hermitCard)

				const activeRow = player.board.activeRow
				const isActive = activeRow !== null && activeRow == pos.rowIndex
				if (isActive && attacker.player.id !== player.id) {
					// Reset the active row so the player can switch
					game.changeActiveRow(player, null)
				}
			}
		})

		opponentPlayer.hooks.afterAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (!row.health && attacker && isTargetingPos(attack, pos)) {
				// Discard to prevent losing a life
				discardCard(game, row.hermitCard)
				game.battleLog.addEntry(player.id, `$p${this.name}$ was knocked out`)

				const activeRow = player.board.activeRow
				const isActive = activeRow !== null && activeRow == pos.rowIndex
				if (isActive && attacker.player.id !== player.id) {
					// Reset the active row so the player can switch
					game.changeActiveRow(player, null)
				}
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, slot, row} = pos
		if (slot && slot.type === 'hermit' && row) {
			row.health = null
			row.effectCard = null
			row.itemCards = []
		}

		player.hooks.blockedActions.remove(instance)
		player.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
		delete player.custom[this.getInstanceKey(instance)]
	}

	override getExpansion() {
		return 'alter_egos'
	}

	override showAttachTooltip() {
		return false
	}

	override sidebarDescriptions() {
		return [
			{
				type: 'glossary',
				name: 'knockout',
			},
		]
	}
}

export default ArmorStandEffectCard
