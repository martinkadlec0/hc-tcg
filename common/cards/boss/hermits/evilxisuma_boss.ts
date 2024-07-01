import {ITEM_CARDS} from '../..'
import {AttackModel} from '../../../models/attack-model'
import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {AttackLog, HermitAttackType} from '../../../types/attack'
import {PickRequest} from '../../../types/server-requests'
import {
	applyStatusEffect,
	getActiveRow,
	getNonEmptyRows,
	removeStatusEffect,
} from '../../../utils/board'
import {isCardType, isRemovable} from '../../../utils/cards'
import {discardCard} from '../../../utils/movement'
import EvilXisumaRareHermitCard from '../../alter-egos/hermits/evilxisuma_rare'

type PRIMARY_ATTACK = '50DMG' | '70DMG' | '90DMG'
type SECONDARY_ATTACK = 'HEAL150' | 'ABLAZE' | 'DOUBLE'
type TERTIARY_ATTACK = 'EFFECTCARD' | 'AFK20' | 'ITEMCARD'

export type BOSS_ATTACK = [PRIMARY_ATTACK, SECONDARY_ATTACK?, TERTIARY_ATTACK?]

const attackLog = (bossAttack: BOSS_ATTACK): ((values: AttackLog) => string) | undefined => {
	let attackName: string
	if (bossAttack.length === 1) attackName = `$v${bossAttack[0]}$`
	else {
		const items = bossAttack.map((attack) => `$v${attack}$`)
		const last = items.pop()
		attackName = items.join(', ') + ' and ' + last
	}

	const baseLog = (values: AttackLog) =>
		`${values.attacker} attacked ${values.target} with ${attackName} for ${values.damage} damage`
	let footer: string
	switch (bossAttack[2]) {
		case 'ITEMCARD':
			footer = ' and forced {them|you} to discard an attached item card'
			break
		case 'EFFECTCARD':
			footer = " and discarded {their|your} active's attached effect card"
			break
		case 'AFK20':
			footer = ' and attacked all {their|your} AFK hermits'
			break
		default:
			footer = ''
	}

	switch (bossAttack[1]) {
		case 'HEAL150':
			return (values) => baseLog(values) + `${footer ? ',' : ' and'} healed for $g150hp$${footer}`
		case 'ABLAZE':
			return (values) =>
				baseLog(values) +
				`${footer ? ',' : ' and'} set {${values.opponent}'s|your} active hermit $bablaze$${footer}`
		case 'DOUBLE':
			return (values) => baseLog(values) + footer
	}
	return baseLog
}

class EvilXisumaBossHermitCard extends EvilXisumaRareHermitCard {
	constructor() {
		super()
		this.id = 'evilxisuma_boss'
		this.health = 300
	}

	/** Determines whether the player attempting to use this is the boss */
	private isBeingImitated(pos: CardPosModel) {
		return pos.player.board.rows.length !== 1
	}

	override getAttack(
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	) {
		// Players who imitate this card should use regular attacks and not the boss'
		if (this.isBeingImitated(pos)) {
			return super.getAttack(game, instance, pos, hermitAttackType)
		}

		if (pos.rowIndex === null || !pos.row || !pos.row.hermitCard) return null

		const {player, row, rowIndex, opponentPlayer} = pos
		const targetIndex = opponentPlayer.board.activeRow
		if (targetIndex === null) return null

		const targetRow = opponentPlayer.board.rows[targetIndex]
		if (!targetRow.hermitCard) return null

		const bossAttack: BOSS_ATTACK = player.custom['BOSS_ATTACK']

		// Create an attack with 0 damage
		const attack = new AttackModel({
			id: this.getInstanceKey(instance),
			attacker: {
				player,
				rowIndex,
				row,
			},
			target: {
				player: opponentPlayer,
				rowIndex: targetIndex,
				row: targetRow,
			},
			type: hermitAttackType,
			log: attackLog(bossAttack),
		})

		const disabledKey = this.getInstanceKey(instance, 'disabled')
		const disabled = game.getAllBlockedActions().some((blockedAction) => {
			return blockedAction == 'PRIMARY_ATTACK' || blockedAction == 'SECONDARY_ATTACK'
		})
		player.custom[disabledKey] = disabled

		if (bossAttack[2] === 'EFFECTCARD') {
			// Remove effect card before attack is executed to mimic Curse of Vanishing
			if (targetRow.effectCard && isRemovable(targetRow.effectCard))
				discardCard(game, targetRow.effectCard)
		}

		// If the opponent blocks EX's "attack", then EX can not deal damage or set opponent on fire
		if (disabled) {
			attack.multiplyDamage(this.id, 0).lockDamage(this.id)
		} else {
			attack.addDamage(this.id, Number(bossAttack[0].substring(0, 2)))

			if (bossAttack[1] === 'DOUBLE') attack.multiplyDamage(this.id, 2)

			if (bossAttack[2] === 'AFK20') {
				const opponentRows = getNonEmptyRows(opponentPlayer, true)
				for (const opponentRow of opponentRows) {
					if (!opponentRow || opponentRow.rowIndex == opponentPlayer.board.activeRow) continue
					const newAttack = new AttackModel({
						id: this.getInstanceKey(instance, 'inactive'),
						attacker: {player, rowIndex, row},
						target: opponentRow,
						type: hermitAttackType,
						log: (values) => `, ${values.damage} damage to ${values.target}`,
					}).addDamage(this.id, 20)
					attack.addNewAttack(newAttack)
				}
			}
		}

		return attack
	}

	override onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		if (this.isBeingImitated(pos)) {
			super.onAttach(game, instance, pos)
			return
		}

		// Apply an ailment to act on EX's ninth turn
		applyStatusEffect(game, 'exboss-nine', instance)

		const {player, opponentPlayer, row} = pos

		// If opponent gave EX any extra cards on turn 1, remove all of them
		player.hand = []
		player.pile = []

		// Let EX use secondary attack in case opponent blocks primary
		player.hooks.availableEnergy.add(instance, (availableEnergy) => {
			return availableEnergy.length ? availableEnergy : ['balanced', 'balanced']
		})

		const disabledKey = this.getInstanceKey(instance, 'disabled')
		player.hooks.onAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance)) return
			if (attack.type !== 'primary' && attack.type !== 'secondary') return

			const bossAttack: BOSS_ATTACK = player.custom['BOSS_ATTACK']

			if (bossAttack[1] !== undefined) {
				const opponentActiveRow = getActiveRow(opponentPlayer)

				switch (bossAttack[1]) {
					case 'HEAL150':
						// Heal for 150 damage
						if (pos.row && pos.row.health) {
							const row = pos.row
							row.health = Math.min(row.health + 150, 300)
						}
						break
					case 'ABLAZE':
						// Set opponent ablaze
						if (opponentActiveRow && opponentActiveRow.hermitCard && !player.custom[disabledKey])
							applyStatusEffect(game, 'fire', opponentActiveRow.hermitCard.cardInstance)
						break
				}
			}

			delete player.custom[disabledKey]
		})

		player.hooks.afterAttack.add(instance, (attack) => {
			if (attack.id !== this.getInstanceKey(instance)) return
			if (attack.type !== 'primary' && attack.type !== 'secondary') return

			const bossAttack: BOSS_ATTACK = player.custom['BOSS_ATTACK']
			if (bossAttack[2] === 'ITEMCARD') {
				// Remove an item card attached to the opponent's active Hermit
				const opponentActiveRow = getActiveRow(opponentPlayer)
				if (
					opponentActiveRow &&
					opponentActiveRow.health &&
					opponentActiveRow.itemCards.find((card) => isCardType(card, 'item'))
				) {
					game.addPickRequest({
						playerId: opponentPlayer.id,
						id: this.id,
						message: 'Choose an item to discard from your active Hermit.',
						onResult(pickResult) {
							if (pickResult.playerId !== opponentPlayer.id) return 'FAILURE_INVALID_PLAYER'

							const rowIndex = pickResult.rowIndex
							if (rowIndex === undefined) return 'FAILURE_INVALID_SLOT'
							if (rowIndex !== opponentPlayer.board.activeRow) return 'FAILURE_INVALID_SLOT'

							if (pickResult.slot.type !== 'item') return 'FAILURE_INVALID_SLOT'
							if (!pickResult.card) return 'FAILURE_INVALID_SLOT'

							const itemCard = ITEM_CARDS[pickResult.card.cardId]
							if (!itemCard) return 'FAILURE_INVALID_SLOT'

							discardCard(game, pickResult.card)

							return 'SUCCESS'
						},
						onTimeout() {
							// Discard the first available item card
							const activeRow = getActiveRow(opponentPlayer)
							if (!activeRow) return
							const itemCard = activeRow.itemCards.find((card) => isCardType(card, 'item'))
							if (!itemCard) return
							discardCard(game, itemCard)
						},
					})
				}
			}
			delete player.custom['BOSS_ATTACK']
		})

		// EX is immune to poison, fire, and slowness
		const IMMUNE_STATUS_EFFECTS = new Set(['poison', 'fire', 'slowness'])
		opponentPlayer.hooks.afterApply.add(instance, () => {
			// If opponent plays Dropper, remove the Fletching Tables added to the draw pile
			if (player.pile.length) player.pile = []

			if (!row) return
			const ailmentsToRemove = game.state.statusEffects.filter((ail) => {
				return (
					ail.targetInstance === row.hermitCard?.cardInstance &&
					IMMUNE_STATUS_EFFECTS.has(ail.statusEffectId)
				)
			})
			ailmentsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})
		})
		player.hooks.onDefence.add(instance, (_) => {
			if (!row) return
			const statusEffectsToRemove = game.state.statusEffects.filter((ail) => {
				return (
					ail.targetInstance === row.hermitCard?.cardInstance &&
					IMMUNE_STATUS_EFFECTS.has(ail.statusEffectId)
				)
			})
			statusEffectsToRemove.forEach((ail) => {
				removeStatusEffect(game, pos, ail.statusEffectInstance)
			})
		})

		// EX manually updates lives so it doesn't leave the board and trigger an early end
		player.hooks.afterDefence.addBefore(instance, () => {
			if (!row || row.health === null || row.health > 0) return

			if (player.lives > 1) {
				game.battleLog.addDeathEntry(player, row)

				row.health = 300
				player.lives -= 1

				const rewardCard = opponentPlayer.pile.shift()
				if (rewardCard) opponentPlayer.hand.push(rewardCard)
			} else {
				player.hooks.afterDefence.remove(instance)
			}
		})
	}

	override onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		if (this.isBeingImitated(pos)) {
			super.onDetach(game, instance, pos)
			return
		}

		const {player, opponentPlayer} = pos
		player.hooks.availableEnergy.remove(instance)
		player.hooks.onAttack.remove(instance)
		player.hooks.afterAttack.remove(instance)
		opponentPlayer.hooks.afterApply.remove(instance)
		player.hooks.onDefence.remove(instance)
		opponentPlayer.hooks.afterAttack.remove(instance)
	}

	override getExpansion() {
		return 'boss'
	}
}

export default EvilXisumaBossHermitCard
