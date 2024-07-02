import {AttackModel} from '../models/attack-model'
import {WEAKNESS_DAMAGE} from '../const/damage'
import {CardPosModel, getCardPos} from '../models/card-pos-model'
import {EnergyT, RowPos} from '../types/cards'
import {DEBUG_CONFIG} from '../config'
import {GameModel} from '../models/game-model'
import {slot} from '../slot'
import { STRENGTHS } from '../const/strengths'

function executeAttack(attack: AttackModel) {
	const target = attack.getTarget()
	if (!target) return

	const {row} = target
	if (!row.hermitCard) return

	const currentHealth = row.health

	const weaknessAttack = createWeaknessAttack(attack)
	if (weaknessAttack) attack.addNewAttack(weaknessAttack)

	// Deduct and clamp health
	const newHealth = Math.max(currentHealth - attack.calculateDamage(), 0)
	row.health = Math.min(newHealth, currentHealth)
}

/**
 * Call before attack hooks for each attack that has an attacker
 */
function runBeforeAttackHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		const attacker = attack.getAttacker()
		if (!attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attacker.player

		if (DEBUG_CONFIG.disableDamage) {
			attack.multiplyDamage('debug', 0).lockDamage('debug')
		}

		// Call before attack hooks
		player.hooks.beforeAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

/**
 * Call before defence hooks, based on each attack's target
 */
function runBeforeDefenceHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		const target = attack.getTarget()
		if (!target) continue

		// The hooks we call are determined by the target of the attack
		const player = target.player

		// Call before defence hooks
		player.hooks.beforeDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

/**
 * Call attack hooks for each attack that has an attacker
 */
function runOnAttackHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		const attacker = attack.getAttacker()
		if (!attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attacker.player

		// Call on attack hooks
		player.hooks.onAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

/**
 * Call defence hooks, based on each attack's target
 */
function runOnDefenceHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		const target = attack.getTarget()
		if (!target) continue

		// The hooks we call are determined by the target of the attack
		const player = target.player

		// Call on defence hooks
		player.hooks.onDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

function runAfterAttackHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let i = 0; i < attacks.length; i++) {
		const attack = attacks[i]
		const attacker = attack.getAttacker()
		if (!attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attacker.player

		// Call after attack hooks
		player.hooks.afterAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

function runAfterDefenceHooks(game: GameModel, attacks: Array<AttackModel>) {
	for (let i = 0; i < attacks.length; i++) {
		const attack = attacks[i]
		const target = attack.getTarget()
		if (!target) continue

		// The hooks we call are determined by the source of the attack
		const player = target.player

		// Call after attack hooks
		player.hooks.afterDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, game, instance)
		})
	}
}

function shouldIgnoreCard(attack: AttackModel, game: GameModel, instance: string): boolean {
	const cardPos = getCardPos(game, instance)
	if (!cardPos) return false
	if (slot.some(...attack.shouldIgnoreSlots)(game, cardPos)) {
		return true
	}

	return false
}

export function executeAttacks(
	game: GameModel,
	attacks: Array<AttackModel>,
	withoutBlockingActions = false
) {
	// STEP 1 - Call before attack and defence for all attacks
	runBeforeAttackHooks(game, attacks)
	runBeforeDefenceHooks(game, attacks)

	// STEP 2 - Call on attack and defence for all attacks
	runOnAttackHooks(game, attacks)
	runOnDefenceHooks(game, attacks)

	// STEP 3 - Execute all attacks
	attacks.forEach((attack) => {
		executeAttack(attack)

		if (attack.nextAttacks.length > 0) {
			executeAttacks(game, attack.nextAttacks, withoutBlockingActions)
			// Only want to block actions after first attack
			withoutBlockingActions = true
		}
	})

	if (!withoutBlockingActions) {
		// STEP 5 - All attacks have been completed, mark actions appropriately
		game.addCompletedActions('SINGLE_USE_ATTACK', 'PRIMARY_ATTACK', 'SECONDARY_ATTACK')
		game.addBlockedActions(
			'game',
			'PLAY_HERMIT_CARD',
			'PLAY_ITEM_CARD',
			'PLAY_EFFECT_CARD',
			'PLAY_SINGLE_USE_CARD',
			'CHANGE_ACTIVE_HERMIT'
		)
	}

	// STEP 6 - After all attacks have been executed, call after attack and defence hooks
	runAfterAttackHooks(game, attacks)
	runAfterDefenceHooks(game, attacks)
}

export function executeExtraAttacks(
	game: GameModel,
	attacks: Array<AttackModel>,
	withoutBlockingActions = false
) {
	executeAttacks(game, attacks, withoutBlockingActions)

	attacks.forEach((attack) => {
		game.battleLog.addAttackEntry(attack, game.currentPlayer.coinFlips, null)
	})

	game.battleLog.sendLogs()
}

// Things not directly related to the attack loop

export function hasEnoughEnergy(energy: Array<EnergyT>, cost: Array<EnergyT>) {
	if (DEBUG_CONFIG.noItemRequirements) return true

	const remainingEnergy = energy.slice()

	const specificCost = cost.filter((item) => item !== 'any')
	const anyCost = cost.filter((item) => item === 'any')
	const hasEnoughSpecific = specificCost.every((costItem) => {
		// First try find the exact card
		let index = remainingEnergy.findIndex((energyItem) => energyItem === costItem)
		if (index === -1) {
			// Then try find an "any" card
			index = remainingEnergy.findIndex((energyItem) => energyItem === 'any')
			if (index === -1) return
		}
		remainingEnergy.splice(index, 1)
		return true
	})
	if (!hasEnoughSpecific) return false

	// check if remaining energy is enough to cover required "any" cost
	return remainingEnergy.length >= anyCost.length
}

/**
 * Returns true if the attack is targeting the card / row position
 */
export function isTargetingPos(attack: AttackModel, pos: CardPosModel | RowPos): boolean {
	const target = attack.getTarget()
	if (!target) return false
	const targetingPlayer = target.player.id === pos.player.id
	const targetingRow = target.rowIndex === pos.rowIndex

	return targetingPlayer && targetingRow
}

function createWeaknessAttack(attack: AttackModel): AttackModel | null {
	if (attack.createWeakness === 'never') return null
	if (attack.getDamage() * attack.getDamageMultiplier() === 0) return null

	const attacker = attack.getAttacker()
	const target = attack.getTarget()
	const attackId = attack.id

	if (!attacker || !target || !attackId) return null

	const attackerCardInfo = attacker.row.hermitCard.card
	const targetCardInfo = target.row.hermitCard.card

	if (
		!attackerCardInfo ||
		!targetCardInfo ||
		!attackerCardInfo.isHermit() ||
		!targetCardInfo.isHermit()
	)
		return null

	const strength = STRENGTHS[attackerCardInfo.props.type]
	if (attack.createWeakness !== 'always' && !strength.includes(targetCardInfo.props.type)) {
		return null
	}

	const weaknessAttack = new AttackModel({
		id: attackId + 'weakness',
		attacker,
		target,
		type: 'weakness',
	})

	weaknessAttack.addDamage(attackerCardInfo.props.id, WEAKNESS_DAMAGE)

	return weaknessAttack
}
