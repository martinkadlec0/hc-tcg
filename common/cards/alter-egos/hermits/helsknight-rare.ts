import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import {moveCardInstanceoHand} from '../../../utils/movement'
import Card, {Hermit, hermit} from '../../base/card'

class HelsknightRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'helsknight_rare',
		numericId: 130,
		name: 'Helsknight',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'rare',
		tokens: 2,
		type: 'pvp',
		health: 270,
		primary: {
			name: 'Pitiful',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Trap Hole',
			cost: ['pvp', 'pvp', 'pvp'],
			damage: 100,
			power:
				'If your opponent uses a single use effect card on their next turn, flip a coin.\nIf heads, you take that card after its effect is applied and add it to your hand.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary' || !attacker)
				return

			const attackerHermit = attacker.row.hermitCard
			opponentPlayer.hooks.onApply.add(instance, () => {
				if (!opponentPlayer.board.singleUseCard) return
				const coinFlip = flipCoin(player, attackerHermit, 1, opponentPlayer)

				if (coinFlip[0] == 'heads') {
					moveCardInstanceoHand(game, opponentPlayer.board.singleUseCard, player)

					opponentPlayer.board.singleUseCardUsed = false

					game.battleLog.addEntry(
						player.id,
						`$p{Helsknight}$ flipped $pheads$ and took $e${opponentPlayer.board.singleUseCard.props.name}$`
					)
				} else {
					game.battleLog.addEntry(player.id, `$p{Helsknight}$ flipped $btails$b`)
				}
			})

			opponentPlayer.hooks.onTurnEnd.add(instance, () => {
				opponentPlayer.hooks.onApply.remove(instance)
				opponentPlayer.hooks.onTurnEnd.remove(instance)
			})
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		player.hooks.onAttack.remove(instance)
	}
}

export default HelsknightRareHermitCard
