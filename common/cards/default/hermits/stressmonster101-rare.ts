import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import Card, {Hermit, hermit} from '../../base/card'

class StressMonster101RareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'stressmonster101_rare',
		numericId: 93,
		name: 'Stress',
		expansion: 'default',
		rarity: 'rare',
		tokens: 3,
		type: 'prankster',
		health: 300,
		primary: {
			name: 'Plonker',
			cost: ['prankster'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Yolo',
			cost: ['prankster', 'prankster', 'prankster'],
			damage: 0,
			power:
				"You and your opponent's active Hermit take damage equal to your active Hermit's health.\nAny damage this Hermit takes due to this ability can not be redirected.",
		},
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return
			const attacker = attack.getAttacker()
			if (!attacker) return

			const backlashAttack = new AttackModel({
				id: this.getInstanceKey(instance, 'selfAttack'),
				attacker,
				target: attacker,
				type: 'secondary',
				isBacklash: true,
				log: (values) => ` and took ${values.damage} backlash damage`,
			})
			const attackDamage = attacker.row.health
			attack.addDamage(this.props.id, attackDamage)
			backlashAttack.addDamage(this.props.id, attackDamage)

			attack.addNewAttack(backlashAttack)
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player} = pos
		// Remove hooks
		player.hooks.onAttack.remove(instance)
	}
}

export default StressMonster101RareHermitCard
