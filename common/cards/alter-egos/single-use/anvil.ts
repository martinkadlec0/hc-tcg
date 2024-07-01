import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {applySingleUse, getActiveRowPos} from '../../../utils/board'
import {hasActive} from '../../../utils/game'
import SingleUseCard from '../../base/single-use-card'

class AnvilSingleUseCard extends SingleUseCard {
	constructor() {
		super({
			id: 'anvil',
			numericId: 138,
			name: 'Anvil',
			rarity: 'rare',
			description:
				'Do 30hp damage to the Hermit card directly opposite your active Hermit on the game board and 10hp damage to each Hermit below it.',
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.getAttack.add(instance, () => {
			const activePos = getActiveRowPos(player)
			if (!activePos) return null
			const activeIndex = activePos.rowIndex

			const opponentRows = opponentPlayer.board.rows

			// If opponent only has 1 rowState, Anvil should always attack that row
			if (opponentRows.length == 1 && opponentRows[0].hermitCard) {
				return new AttackModel({
					id: this.getInstanceKey(instance, 'active'),
					attacker: activePos,
					target: {
						player: opponentPlayer,
						rowIndex: 0,
						row: opponentRows[0],
					},
					type: 'effect',
					log: (values) =>
						`${values.defaultLog} to attack ${values.target} for ${values.damage} damage`,
				}).addDamage(this.id, 30)
			}

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
				}).addDamage(this.id, rowIndex === activeIndex ? 30 : 10)

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

	override canAttach(game: GameModel, pos: CardPosModel) {
		const result = super.canAttach(game, pos)

		const {player} = pos
		if (!hasActive(player)) result.push('UNMET_CONDITION')

		return result
	}

	override getExpansion() {
		return 'alter_egos'
	}

	override canAttack() {
		return true
	}
}

export default AnvilSingleUseCard
