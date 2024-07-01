import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {HermitAttackType} from '../../../types/attack'
import HermitCard from '../../base/hermit-card'

class RenbobRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'renbob_rare',
			numericId: 137,
			name: 'Renbob',
			rarity: 'rare',
			hermitType: 'explorer',
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
		})
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
		if (
			attack.type === 'secondary' &&
			pos.rowIndex !== null &&
			opponentPlayer.board.rows.length !== 1 // Renbob should not retarget if opponent can only play one Hermit
		) {
			const opponentPlayerRow = opponentPlayer.board.rows[pos.rowIndex]
			if (opponentPlayerRow.hermitCard) {
				attack.setTarget(this.id, {
					player: opponentPlayer,
					rowIndex: pos.rowIndex,
					row: opponentPlayerRow,
				})
			} else {
				attack.setTarget(this.id, null)
			}
		}

		return attack
	}

	override getExpansion() {
		return 'alter_egos'
	}

	override getPalette() {
		return 'alter_egos'
	}

	override getBackground() {
		return 'alter_egos_background'
	}
}

export default RenbobRareHermitCard
