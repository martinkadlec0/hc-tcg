import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {flipCoin} from '../../../utils/coinFlips'
import Card, {Hermit, hermit} from '../../base/card'

/*
- Beef confirmed that double damage condition includes other rare mumbos.
*/
class MumboJumboRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'mumbojumbo_rare',
		numericId: 81,
		name: 'Mumbo',
		expansion: 'default',
		rarity: 'rare',
		tokens: 3,
		type: 'prankster',
		health: 290,
		primary: {
			name: 'Moustache',
			cost: ['prankster'],
			damage: 60,
			power: null,
		},
		secondary: {
			name: 'Quite Simple',
			cost: ['prankster', 'prankster'],
			damage: 40,
			power:
				'Flip a coin twice. Do an additional 20hp damage for every heads. Total attack damage doubles if you have at least one other AFK Prankster.',
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			const attacker = attack.getAttacker()
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary' || !attacker)
				return

			const coinFlip = flipCoin(player, attacker.row.hermitCard, 2)
			const headsAmount = coinFlip.filter((flip) => flip === 'heads').length
			const pranksterAmount = player.board.rows.filter(
				(row, index) =>
					row.hermitCard &&
					index !== player.board.activeRow &&
					row.hermitCard.isHermit() &&
					row.hermitCard.props.type === 'prankster'
			).length

			attack.addDamage(this.props.id, headsAmount * 20)
			if (pranksterAmount > 0) attack.multiplyDamage(this.props.id, 2)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default MumboJumboRareHermitCard
