import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {getActiveRow} from '../../../utils/board'
import {slot} from '../../../slot'
import {healHermit} from '../../../types/game-state'
import Card, {Hermit, hermit} from '../../base/card'

class PotatoBoyRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'potatoboy_rare',
		numericId: 135,
		name: 'Potato Boy',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'rare',
		tokens: 1,
		type: 'farm',
		health: 270,
		primary: {
			name: 'Peace & Love',
			cost: ['farm'],
			damage: 0,
			power: 'Heal all Hermits that are adjacent to your active Hermit 40hp.',
		},
		secondary: {
			name: 'Volcarbo',
			cost: ['farm', 'farm', 'any'],
			damage: 90,
			power: null,
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'primary') return

			const activeRow = player.board.activeRow
			if (activeRow === null) return

			const rows = player.board.rows

			const activeHermit = getActiveRow(player)?.hermitCard
			if (!activeHermit) return

			game
				.filterSlots(
					slot.every(slot.adjacentTo(slot.activeRow), slot.hermitSlot, slot.not(slot.empty))
				)
				.forEach(({row, rowIndex, card}) => {
					if (!card || !rowIndex) return
					healHermit(row, 40)
					game.battleLog.addEntry(
						player.id,
						`$p${card.props.name} (${rowIndex + 1})$ was healed $g40hp$ by $p${
							activeHermit.props.name
						}$`
					)
				})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default PotatoBoyRareHermitCard
