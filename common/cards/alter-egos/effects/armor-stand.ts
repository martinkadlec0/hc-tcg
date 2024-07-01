import EffectCard from '../../base/effect-card'
import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {TurnActions} from '../../../types/game-state'
import {CanAttachResult} from '../../base/card'
import {hermitCardBattleLog} from '../../base/hermit-card'

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

		player.hooks.canAttach.add(instance, (result, pos) => {
			if (pos.row?.hermitCard?.cardInstance !== instance) return
			result.push('UNMET_CONDITION_SILENT')
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, slot, row} = pos
		if (slot && slot.type === 'hermit' && row) {
			row.health = null
			row.effectCard = null
			row.itemCards = row.itemCards.map(() => null)
		}

		game.battleLog.addEntry(player.id, `$pArmor Stand$ was knocked out`)

		player.hooks.blockedActions.remove(instance)
		player.hooks.afterAttack.remove(instance)
		player.hooks.canAttach.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
		delete player.custom[this.getInstanceKey(instance)]
	}

	override canAttach(game: GameModel, pos: CardPosModel) {
		const {slot} = pos
		const {currentPlayer} = game
		const result: CanAttachResult = []

		if (!slot || slot.type !== 'hermit') result.push('INVALID_SLOT')
		if (pos.player.id !== currentPlayer.id) result.push('INVALID_PLAYER')

		return result
	}

	public override getActions(game: GameModel): TurnActions {
		const {currentPlayer} = game

		// Is there a hermit slot free on the board
		const spaceForHermit = currentPlayer.board.rows.some((row) => !row.hermitCard)

		return spaceForHermit ? ['PLAY_HERMIT_CARD'] : []
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
