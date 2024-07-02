import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import Card, {SingleUse, singleUse} from '../../base/card'

class AnvilSingleUseCard extends Card {
	props: SingleUse = {
		...singleUse,
		id: 'anvil',
		numericId: 138,
		name: 'Anvil',
		expansion: 'alter_egos',
		rarity: 'rare',
		tokens: 0,
		description:
			'Do 30hp damage to the Hermit card directly opposite your active Hermit on the game board and 10hp damage to each Hermit below it.',
		hasAttack: true,
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.getAttack.add(instance, () => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return null
			const activeIndex = activePos.rowIndex

			const opponentRows = opponentPlayer.board.rows

			const attack = opponentRows.reduce((r: null | AttackModel, row, rowIndex) => {
				if (!row || !row.hermitCard) return r
				if (rowIndex < activeIndex) return r
				const newAttack = new AttackModel({
					id: this.getInstanceKey(instance, activeIndex === rowIndex ? 'active' : 'inactive'),
					attacker: activePos,
					target: {
						player: opponentPlayer,
						rowIndex: rowIndex,
						row: row,
					},
					type: 'effect',
					log: (values) =>
						rowIndex === activeIndex
							? `${values.defaultLog} to attack ${values.target} for ${values.damage} damage`
							: `, ${values.target} for ${values.damage} damage`,
				}).addDamage(this.props.id, rowIndex === activeIndex ? 30 : 10)

				if (r) return r.addNewAttack(newAttack)

				return newAttack
			}, null)

			return attack
		})

		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance, 'active')
			const inactiveAttackId = this.getInstanceKey(instance, 'active')
			if (attack.id !== attackId && attackId !== inactiveAttackId) return

			applySingleUse(game)

			player.hooks.onAttack.remove(instance)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.getAttack.remove(instance)
		player.hooks.onAttack.remove(instance)
	}
}

export default AnvilSingleUseCard
