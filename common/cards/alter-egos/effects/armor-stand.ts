import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {slot} from '../../../slot'
import Card, {Attach, attach, hermit, hermitBattleLog} from '../../base/card'

class ArmorStandEffectCard extends Card {
	props: Attach = {
		...attach,
		id: 'armor_stand',
		numericId: 118,
		name: 'Armour Stand',
		expansion: 'alter_egos',
		rarity: 'ultra_rare',
		tokens: 2,
		description:
			'Use like a Hermit card with a maximum 50hp.\nYou can not attach any cards to this card. While this card is active, you can not attack, or use damaging effect cards.\nIf this card is knocked out, it does not count as a knockout.',
		sidebarDescriptions: [
			{
				type: 'glossary',
				name: 'knockout',
			},
		],
		attachCondition: hermit.attachCondition,
		log: hermitBattleLog('Armour Stand'),
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, row} = pos
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

		player.hooks.freezeSlots.add(instance, () => {
			return slot.every(slot.player, slot.rowIndex(pos.rowIndex))
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		game.battleLog.addEntry(player.id, `$pArmor Stand$ was knocked out`)

		player.hooks.blockedActions.remove(instance)
		player.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
		player.hooks.freezeSlots.remove(instance)
		delete player.custom[this.getInstanceKey(instance)]
	}
}

export default ArmorStandEffectCard
