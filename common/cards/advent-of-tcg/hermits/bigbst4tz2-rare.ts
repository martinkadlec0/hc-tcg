import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import HermitCard from '../../base/hermit-card'
import {flipCoin} from '../../../utils/coinFlips'
import {AttackModel} from '../../../models/attack-model'
import {executeAttacks} from '../../../utils/attacks'
import {getActiveRow} from '../../../utils/board'
import {RowPos} from '../../../types/cards'

class BigBSt4tzRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'bigbst4tz2_rare',
			numericId: 207,
			name: 'BigB',
			rarity: 'rare',
			type: 'speedrunner',
			health: 270,
			primary: {
				name: 'Terry',
				cost: ['speedrunner'],
				damage: 50,
				power: null,
			},
			secondary: {
				name: 'Soulmate',
				cost: ['speedrunner', 'speedrunner'],
				damage: 80,
				power: "When BigB is knocked out, deal 140 damage to the opponent's active Hermit.",
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer, row} = pos
		const dealDamageNextTurn = this.getInstanceKey(instance, 'dealDamageNextTurn')

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			player.custom[dealDamageNextTurn] = true
		})

		// Add before so health can be checked reliably
		opponentPlayer.hooks.afterAttack.addBefore(instance, () => {
			if (player.custom[dealDamageNextTurn]) {
				if (!row || row.health === null || row.health > 0) return

				const activeRowIndex = player.board.activeRow
				const opponentActiveRowIndex = opponentPlayer.board.activeRow

				const activeRow = getActiveRow(player)
				const opponentActiveRow = getActiveRow(opponentPlayer)
				if (activeRowIndex === null || opponentActiveRowIndex === null) return
				if (!activeRow || !opponentActiveRow) return

				const sourceRow: RowPos = {
					player: player,
					rowIndex: activeRowIndex,
					row: activeRow,
				}

				const targetRow: RowPos = {
					player: opponentPlayer,
					rowIndex: opponentActiveRowIndex,
					row: opponentActiveRow,
				}

				const statusEffectAttack = new AttackModel({
					id: this.getInstanceKey(instance),
					attacker: sourceRow,
					target: targetRow,
					type: 'status-effect',
				})
				statusEffectAttack.addDamage(this.id, 140)

				opponentPlayer.hooks.afterAttack.remove(instance)
				executeAttacks(game, [statusEffectAttack], true)
			}
		})

		player.hooks.onTurnStart.add(instance, () => {
			delete player.custom[dealDamageNextTurn]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const dealDamageNextTurn = this.getInstanceKey(instance, 'dealDamageNextTurn')

		player.hooks.onAttack.remove(instance)
		opponentPlayer.hooks.onAttack.remove(instance)
		opponentPlayer.hooks.onTurnEnd.remove(instance)
		delete player.custom[dealDamageNextTurn]
	}

	override getExpansion() {
		return 'advent_of_tcg'
	}

	override getPalette() {
		return 'advent_of_tcg'
	}

	override getBackground() {
		return 'advent_of_tcg'
	}
}

export default BigBSt4tzRareHermitCard
