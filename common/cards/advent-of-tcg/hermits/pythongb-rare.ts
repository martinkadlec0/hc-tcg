import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import HermitCard from '../../base/hermit-card'

class PythonGBRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'pythongb_rare',
			numericId: 216,
			name: 'Python',
			rarity: 'rare',
			type: 'redstone',
			health: 250,
			primary: {
				name: 'Say Whaatt',
				cost: ['any'],
				damage: 30,
				power: null,
			},
			secondary: {
				name: 'The Logfellas',
				cost: ['redstone', 'redstone'],
				damage: 40,
				power: 'For each of your adjacent Rendogs or Xisumas, attack damage doubles.',
			},
		})
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			const activeRow = player.board.activeRow
			if (activeRow === null) return

			const logfellaAmount = player.board.rows.filter(
				(row, index) =>
					row.hermitCard &&
					(index === activeRow - 1 || index === activeRow + 1) &&
					['xisumavoid_common', 'xisumavoid_rare', 'rendog_common', 'rendog_rare'].includes(
						row.hermitCard.cardId
					)
			).length

			attack.multiplyDamage(this.id, Math.pow(2, logfellaAmount))
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
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

export default PythonGBRareHermitCard
