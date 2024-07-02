import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import HermitCard from '../../base/hermit-card'

class PixlriffsRareHermitCard extends HermitCard {
	constructor() {
		super({
			id: 'pixlriffs_rare',
			numericId: 215,
			name: 'Pixl',
			rarity: 'rare',
			type: 'explorer',
			health: 290,
			primary: {
				name: 'Lore Keeper',
				cost: ['explorer'],
				damage: 60,
				power: null,
			},
			secondary: {
				name: 'World Build',
				cost: ['explorer', 'explorer', 'any'],
				damage: 90,
				power:
					'If this Hermit has moved since the start of your turn, World Build deals 40hp more damage.',
			},
		})
	}

	public override onAttach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)
		player.custom[instanceKey] = pos.player.board.activeRow

		player.hooks.onTurnStart.add(instance, () => {
			player.custom[instance] = player.board.activeRow
		})

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			if (player.custom[instance] !== player.board.activeRow) attack.addDamage(this.id, 40)
			delete player.custom[instance]
		})
	}

	public override onDetach(game: GameModel, instance: string, pos: CardPosModel): void {
		const {player} = pos
		const instanceKey = this.getInstanceKey(instance)

		player.hooks.onAttack.remove(instance)
		delete player.custom[instanceKey]
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

export default PixlriffsRareHermitCard
