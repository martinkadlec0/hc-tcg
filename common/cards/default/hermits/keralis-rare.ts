import {GameModel} from '../../../models/game-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {getActiveRow} from '../../../utils/board'
import {slot} from '../../../slot'
import Card, {Hermit, hermit} from '../../base/card'
import {healHermit} from '../../../types/game-state'

class KeralisRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'keralis_rare',
		numericId: 72,
		name: 'Keralis',
		expansion: 'default',
		rarity: 'rare',
		tokens: 1,
		type: 'terraform',
		health: 250,
		primary: {
			name: 'Booshes',
			cost: ['any'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Sweet Face',
			cost: ['terraform', 'terraform', 'any'],
			damage: 0,
			power: 'Heal any AFK Hermit 100hp.',
		},
	}

	pickCondition = slot.every(slot.not(slot.activeRow), slot.not(slot.empty), slot.hermitSlot)

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		const playerKey = this.getInstanceKey(instance, 'player')
		const rowKey = this.getInstanceKey(instance, 'row')

		// Pick the hermit to heal
		player.hooks.getAttackRequests.add(instance, (activeInstance, hermitAttackType) => {
			// Make sure we are attacking
			if (activeInstance !== instance) return

			// Only secondary attack
			if (hermitAttackType !== 'secondary') return

			// Make sure there is something to select
			if (!game.someSlotFulfills(this.pickCondition)) return

			game.addPickRequest({
				playerId: player.id,
				id: this.props.id,
				message: 'Pick an AFK Hermit from either side of the board',
				canPick: this.pickCondition,
				onResult(pickedSlot) {
					const rowIndex = pickedSlot.rowIndex
					if (!pickedSlot.card || pickedSlot.rowIndex === null) return

					// Store the info to use later
					player.custom[playerKey] = pickedSlot.player.id
					player.custom[rowKey] = rowIndex
				},
				onTimeout() {
					// We didn't pick anyone to heal, so heal no one
				},
			})
		})

		// Heals the afk hermit *before* we actually do damage
		player.hooks.onAttack.add(instance, (attack) => {
			const attackId = this.getInstanceKey(instance)
			if (attack.id !== attackId || attack.type !== 'secondary') return

			const pickedPlayer = game.state.players[player.custom[playerKey]]
			if (!pickedPlayer) return
			const pickedRowIndex = player.custom[rowKey]
			const pickedRow = pickedPlayer.board.rows[pickedRowIndex]
			if (!pickedRow || !pickedRow.hermitCard) return

			const activeHermit = getActiveRow(player)?.hermitCard
			if (!activeHermit) return

			if (pickedRow.hermitCard) {
				healHermit(pickedRow, 100)

				game.battleLog.addEntry(
					player.id,
					`$p${pickedRow.hermitCard.props.name} (${pickedRowIndex + 1})$ was healed $g100hp$ by $p${
						activeHermit.props.name
					}$`
				)
			}

			delete player.custom[playerKey]
			delete player.custom[rowKey]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.getAttackRequests.remove(instance)
		player.hooks.onAttack.remove(instance)

		delete player.custom[this.getInstanceKey(instance, 'player')]
		delete player.custom[this.getInstanceKey(instance, 'row')]
	}
}

export default KeralisRareHermitCard
