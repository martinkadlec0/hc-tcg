import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {slot} from '../../../slot'
import {getActiveRowPos} from '../../../utils/board'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

class EvilXisumaRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'evilxisuma_rare',
		numericId: 128,
		name: 'Evil X',
		rarity: 'rare',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		tokens: 4,
		type: 'balanced',
		health: 280,
		primary: {
			name: 'Evil Inside',
			cost: [],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Derpcoin',
			cost: ['balanced', 'balanced'],
			damage: 80,
			power:
				"Flip a coin.\nIf heads, choose one attack of your opponent's current active Hermit to disable on their next turn.",
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const disableKey = this.getInstanceKey(instance, 'disable')

		player.hooks.afterAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance)) return
			const attacker = attack.getAttacker()
			if (attack.type !== 'secondary' || !attacker) return

			const opponentActiveRow = getActiveRowPos(opponentPlayer)
			if (!opponentActiveRow) return
			if (opponentActiveRow.row.health <= 0) return

			const coinFlip = flipCoin(player, attacker.row.hermitCard)

			if (coinFlip[0] !== 'heads') return

			game.addModalRequest({
				playerId: player.id,
				data: {
					modalId: 'copyAttack',
					payload: {
						modalName: 'Evil X: Disable an attack for 1 turn',
						modalDescription: "Which of the opponent's attacks do you want to disable?",
						cardPos: game.findSlot(slot.hasInstance(opponentActiveRow.row.hermitCard.instance)),
					},
				},
				onResult(modalResult) {
					if (!modalResult || !modalResult.pick) return 'FAILURE_INVALID_DATA'

					player.custom[disableKey] = modalResult.pick

					return 'SUCCESS'
				},
				onTimeout() {
					// Disable the secondary attack if we didn't choose one
					player.custom[disableKey] = 'secondary'
				},
			})

			opponentPlayer.hooks.onTurnStart.add(instance, () => {
				const disable = player.custom[disableKey]
				if (!disable) return

				const activeRow = opponentPlayer.board.activeRow
				if (activeRow === null) return

				const actionToBlock = disable === 'primary' ? 'PRIMARY_ATTACK' : 'SECONDARY_ATTACK'
				// This will add a blocked action for the duration of their turn
				game.addBlockedActions(this.props.id, actionToBlock)

				opponentPlayer.hooks.onTurnStart.remove(instance)
				delete player.custom[disableKey]
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.afterAttack.remove(instance)
	}
}

export default EvilXisumaRareHermitCard
