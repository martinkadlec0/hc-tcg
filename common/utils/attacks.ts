import {STRENGTHS} from '../const/strengths'
import {HERMIT_CARDS} from '../cards'
import {AttackModel} from '../models/attack-model'
import {WEAKNESS_DAMAGE} from '../const/damage'
import {CardPosModel} from '../models/card-pos-model'
import {EnergyT, RowPos} from '../types/cards'
import {DEBUG_CONFIG} from '../config'
import {GameModel} from '../models/game-model'

function executeAttack(attack: AttackModel) {
	const {target} = attack
	if (!target) return

	const {row} = target
	if (!row.hermitCard) return

	const targetHermitInfo = HERMIT_CARDS[row.hermitCard.cardId]

	const currentHealth = row.health
	let maxHealth = currentHealth // Armor Stand
	if (targetHermitInfo) {
		maxHealth = targetHermitInfo.health
	}

	// Deduct and clamp health
	const newHealth = Math.max(currentHealth - attack.calculateDamage(), 0)
	row.health = Math.min(newHealth, maxHealth)
}

/**
 * Call before attack hooks for each attack that has an attacker
 */
function runBeforeAttackHooks(attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		if (!attack.attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attack.attacker.player

		if (DEBUG_CONFIG.disableDamage) {
			attack.multiplyDamage('debug', 0).lockDamage()
		}

		// Call before attack hooks
		player.hooks.beforeAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

/**
 * Call before defence hooks, based on each attack's target
 */
function runBeforeDefenceHooks(attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		if (!attack.target) continue

		// The hooks we call are determined by the target of the attack
		const player = attack.target.player

		// Call before defence hooks
		player.hooks.beforeDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

/**
 * Call attack hooks for each attack that has an attacker
 */
function runOnAttackHooks(attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		if (!attack.attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attack.attacker.player

		// Call on attack hooks
		player.hooks.onAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

/**
 * Call defence hooks, based on each attack's target
 */
function runOnDefenceHooks(attacks: Array<AttackModel>) {
	for (let attackIndex = 0; attackIndex < attacks.length; attackIndex++) {
		const attack = attacks[attackIndex]
		if (!attack.target) continue

		// The hooks we call are determined by the target of the attack
		const player = attack.target.player

		// Call on defence hooks
		player.hooks.onDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

function runAfterAttackHooks(attacks: Array<AttackModel>) {
	for (let i = 0; i < attacks.length; i++) {
		const attack = attacks[i]
		if (!attack.attacker) continue

		// The hooks we call are determined by the source of the attack
		const player = attack.attacker.player

		// Call after attack hooks
		player.hooks.afterAttack.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

function runAfterDefenceHooks(attacks: Array<AttackModel>) {
	for (let i = 0; i < attacks.length; i++) {
		const attack = attacks[i]
		if (!attack.target) continue

		// The hooks we call are determined by the source of the attack
		const player = attack.target.player

		// Call after attack hooks
		player.hooks.afterDefence.callSome([attack], (instance) => {
			return shouldIgnoreCard(attack, instance)
		})
	}
}

function shouldIgnoreCard(attack: AttackModel, instance: string): boolean {
	for (let i = 0; i < attack.shouldIgnoreCards.length; i++) {
		const shouldIgnore = attack.shouldIgnoreCards[i]
		if (shouldIgnore(instance)) return true
	}
	return false
}

export function executeAttacks(
	game: GameModel,
	attacks: Array<AttackModel>,
	withoutBlockingActions = false
) {
	const allAttacks: Array<AttackModel> = []

	// Main attack loop
	while (attacks.length > 0) {
		// STEP 1 - Call before attack and defence for all attacks
		runBeforeAttackHooks(attacks)
		runBeforeDefenceHooks(attacks)

		// STEP 2 - Call on attack and defence for all attacks
		runOnAttackHooks(attacks)
		runOnDefenceHooks(attacks)

		// STEP 3 - Execute all attacks
		for (let i = 0; i < attacks.length; i++) {
			executeAttack(attacks[i])

			// Add this attack to the final list
			allAttacks.push(attacks[i])
		}

		// STEP 4 - Get all the next attacks, and repeat the process
		const newAttacks: Array<AttackModel> = []
		for (let i = 0; i < attacks.length; i++) {
			newAttacks.push(...attacks[i].nextAttacks)
		}
		attacks = newAttacks
	}

	if (!withoutBlockingActions) {
		// STEP 5 - All attacks have been completed, mark actions appropriately
		game.addCompletedActions('SINGLE_USE_ATTACK', 'PRIMARY_ATTACK', 'SECONDARY_ATTACK')
		game.addBlockedActions(
			null,
			'PLAY_HERMIT_CARD',
			'PLAY_ITEM_CARD',
			'PLAY_EFFECT_CARD',
			'PLAY_SINGLE_USE_CARD',
			'CHANGE_ACTIVE_HERMIT'
		)
	}

	// STEP 6 - Finally, after all attacks have been executed, call after attack and defence hooks
	runAfterAttackHooks(allAttacks)
	runAfterDefenceHooks(allAttacks)
}

export function executeExtraAttacks(
	game: GameModel,
	attacks: Array<AttackModel>,
	type: string,
	withoutBlockingActions = false
) {
	attacks.map((attack) => {
		game.battleLog.addOutOfPhaseAttackEntry(attack, type)
	})

	executeAttacks(game, attacks, withoutBlockingActions)
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
	if (!attack.target) return false
	const targetingPlayer = attack.target.player.id === pos.player.id
	const targetingRow = attack.target.rowIndex === pos.rowIndex

	return targetingPlayer && targetingRow
}

// @TODO check this to se if it's ok
export function createWeaknessAttack(attack: AttackModel): AttackModel | null {
	if (!attack.attacker || !attack.target) return null
	const {target, attacker} = attack
	const attackerCardInfo = HERMIT_CARDS[attacker.row.hermitCard.cardId]
	const targetCardInfo = HERMIT_CARDS[target.row.hermitCard.cardId]
	if (!attackerCardInfo || !targetCardInfo) return null

	const attackId = attackerCardInfo.getInstanceKey(attacker.row.hermitCard.cardInstance, 'weakness')

	const strength = STRENGTHS[attackerCardInfo.hermitType]
	if (!strength.includes(targetCardInfo.hermitType)) return null

	const weaknessAttack = new AttackModel({
		id: attackId,
		attacker,
		target,
		type: 'weakness',
	})

	weaknessAttack.addDamage(attackerCardInfo.id, WEAKNESS_DAMAGE)

	return weaknessAttack
}
