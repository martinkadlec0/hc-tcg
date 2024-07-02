import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {removeStatusEffect} from '../../../utils/board'
import Card, {Hermit, hermit} from '../../base/card'

class GoodTimesWithScarRareHermitCard extends Card {
	props: Hermit = {
		...hermit,
		id: 'goodtimeswithscar_rare',
		numericId: 33,
		name: 'Scar',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'builder',
		health: 270,
		primary: {
			name: 'Scarred For Life',
			cost: ['builder'],
			damage: 50,
			power: null,
		},
		secondary: {
			name: 'Deathloop',
			cost: ['builder', 'any'],
			damage: 70,
			power:
				'If this Hermit is knocked out before the start of your next turn, they are revived with 50hp.\nDoes not count as a knockout. This Hermit can only be revived once using this ability.',
		},
		sidebarDescriptions: [
			{
				type: 'glossary',
				name: 'knockout',
			},
		],
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos

		const canRevives: {[key: string]: boolean} = (player.custom[this.getKey('reviveNextTurn')] ||=
			{}) // Singleton pattern so a player has one persistent Deathloop record

		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance) || attack.type !== 'secondary') return

			const attackerInstance = attack.getAttacker()?.row.hermitCard.instance
			if (!attackerInstance) return
			// If this instance is not blocked from reviving, make possible next turn
			if (canRevives[attackerInstance] === undefined) canRevives[attackerInstance] = true
		})

		// Add before so health can be checked reliably
		opponentPlayer.hooks.afterAttack.addBefore(instance, (attack) => {
			const targetInstance = attack.getTarget()?.row.hermitCard.instance
			if (!targetInstance || !canRevives[targetInstance]) return
			const row = attack.getTarget()?.row
			if (!row || row.health === null || row.health > 0) return

			row.health = 50

			game.state.statusEffects.forEach((ail) => {
				if (ail.targetInstance === targetInstance) {
					removeStatusEffect(game, pos, ail.statusEffectInstance)
				}
			})

			game.battleLog.addEntry(
				player.id,
				`Using $vDeathloop$, $p${row.hermitCard.props.name}$ revived with $g50hp$`
			)

			// Prevents hermits from being revived more than once by Deathloop
			canRevives[targetInstance] = false
		})

		player.hooks.onTurnStart.add(instance, () => {
			Object.entries(canRevives).forEach(([cardInstance, wasNotRevived]) => {
				if (wasNotRevived) delete canRevives[cardInstance]
			})
		})

		player.hooks.afterDefence.add(instance, (attack) => {
			const targetRow = attack.getTarget()?.row
			const targetInstance = targetRow?.hermitCard.instance
			if (!targetInstance || canRevives[targetInstance] !== false) return
			if (!targetRow || targetRow.health === null || targetRow.health > 0) return
			// Remove revived hermits after they died, if a hermit is replayed after being discarded it should be able to revive again
			delete canRevives[targetInstance]
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		const {player, opponentPlayer} = pos
		const canRevives = player.custom[this.getKey('reviveNextTurn')]
		const canCleanUp = () => !Object.keys(canRevives).length
		// Remove hooks
		player.hooks.onAttack.remove(instance)

		if (canCleanUp()) {
			opponentPlayer.hooks.afterAttack.remove(instance)
			player.hooks.onTurnStart.remove(instance)
			player.hooks.afterDefence.remove(instance)
		} else {
			// Reassign hooks to detach when canRevives is empty
			player.hooks.onTurnStart.add(instance, () => {
				Object.entries(canRevives).forEach(([cardInstance, wasNotRevived]) => {
					if (wasNotRevived) delete canRevives[cardInstance]
				})

				opponentPlayer.hooks.afterAttack.remove(instance)
				player.hooks.onTurnStart.remove(instance)
				if (canCleanUp()) player.hooks.afterDefence.remove(instance)
			})
			player.hooks.afterDefence.add(instance, (attack) => {
				const targetRow = attack.getTarget()?.row
				const targetInstance = targetRow?.hermitCard.instance
				if (!targetInstance || canRevives[targetInstance] !== false) return
				if (!targetRow || targetRow.health === null || targetRow.health > 0) return
				delete canRevives[targetInstance]

				if (canCleanUp()) player.hooks.afterDefence.remove(instance)
			})
		}
	}
}

export default GoodTimesWithScarRareHermitCard
