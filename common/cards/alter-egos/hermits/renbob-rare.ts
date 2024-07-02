import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {HermitAttackType} from '../../../types/attack'
import Card, {Hermit, hermit} from '../../base/card'

class RenbobRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'renbob_rare',
		numericId: 137,
		name: 'Renbob',
		expansion: 'alter_egos',
		palette: 'alter_egos',
		background: 'alter_egos',
		rarity: 'rare',
		tokens: 2,
		type: 'explorer',
		health: 300,
		primary: {
			name: 'Loose Change',
			cost: ['any'],
			damage: 40,
			power: null,
		},
		secondary: {
			name: 'Hyperspace',
			cost: ['explorer', 'explorer'],
			damage: 80,
			power: 'Attack the Hermit card directly opposite this card on the game board.',
		},
	}

	override getAttack(
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	) {
		const {opponentPlayer} = pos

		let attack = super.getAttack(game, instance, pos, hermitAttackType)
		if (!attack) return null
		if (attack.type === 'secondary' && pos.rowIndex !== null) {
			const opponentPlayerRow = opponentPlayer.board.rows[pos.rowIndex]
			if (opponentPlayerRow.hermitCard) {
				attack.setTarget(this.props.id, {
					player: opponentPlayer,
					rowIndex: pos.rowIndex,
					row: opponentPlayerRow,
				})
			} else {
				attack.setTarget(this.props.id, null)
			}
		}

		return attack
	}
}

export default RenbobRareHermitCard
