import {
	PlayCardLog,
	CardRarityT,
	TypeT,
	HermitAttackInfo,
	ExpansionT,
	CardCategoryT,
} from '../../types/cards'
import {GameModel} from '../../models/game-model'
import {CardPosModel} from '../../models/card-pos-model'
import {FormattedTextNode, formatText} from '../../utils/formatting'
import {slot, SlotCondition} from '../../slot'
import {HermitAttackType} from '../../types/attack'
import {AttackModel} from '../../models/attack-model'

export type CanAttachError =
	| 'INVALID_PLAYER'
	| 'INVALID_SLOT'
	| 'UNMET_CONDITION'
	| 'UNMET_CONDITION_SILENT'
	| 'UNKNOWN_ERROR'

export type CanAttachResult = Array<CanAttachError>

/* A type to remove functions from.props to prevent issues when sending cards to the cient */
export type WithoutFunctions<Type extends CardProps> = {
	[Property in keyof Type]: Type[Property] extends Function ? never : Type[Property]
}
export function WithoutFunctions<T extends CardProps>(t: T): WithoutFunctions<T> {
	return t as WithoutFunctions<T>
}

export type CardProps = {
	id: string
	category: CardCategoryT
	expansion: ExpansionT
	numericId: number
	name: string
	shortName?: string
	rarity: CardRarityT
	tokens: number
	attachCondition: SlotCondition
	sidebarDescriptions?: Array<{type: string; name: string}>
	/** The battle log attached to this card */
	/** Set to string when the card should generate a log when played or applied, and null otherwise */
	log?: (values: PlayCardLog) => string
}

export type Item = CardProps & {
	item: null
	type: TypeT
}

export function isItem(props: WithoutFunctions<CardProps>): props is WithoutFunctions<Item>
export function isItem(props: CardProps): props is Item
export function isItem(props: CardProps | WithoutFunctions<CardProps> | null): props is Item {
	return props !== null && 'item' in props
}

export const item = {
	item: null,
	category: 'item' as CardCategoryT,
	attachCondition: slot.every(
		slot.player,
		slot.itemSlot,
		slot.empty,
		slot.rowHasHermit,
		slot.actionAvailable('PLAY_ITEM_CARD'),
		slot.not(slot.frozen)
	),
}

export type HasHealth = CardProps & {
	health: number
}

export function isHealth(props: WithoutFunctions<CardProps>): props is WithoutFunctions<HasHealth>
export function isHealth(props: CardProps): props is HasHealth
export function isHealth(
	props: CardProps | WithoutFunctions<CardProps> | null
): props is HasHealth {
	return props !== null && 'health' in props
}

export type Hermit = HasHealth & {
	hermit: null
	type: TypeT
	primary: HermitAttackInfo
	secondary: HermitAttackInfo
	palette?: 'alter_egos'
	background?: 'alter_egos'
}

export function isHermit(props: WithoutFunctions<CardProps>): props is WithoutFunctions<Hermit>
export function isHermit(props: CardProps): props is Hermit
export function isHermit(props: CardProps | WithoutFunctions<CardProps> | null): props is Hermit {
	return props !== null && 'hermit' in props
}

export const hermit = {
	hermit: null,
	category: 'hermit' as CardCategoryT,
	attachCondition: slot.every(
		slot.hermitSlot,
		slot.player,
		slot.empty,
		slot.actionAvailable('PLAY_HERMIT_CARD'),
		slot.not(slot.frozen)
	),
}

export type Attach = CardProps & {
	attachable: null
	description: string
}

export function isAttach(props: WithoutFunctions<CardProps>): props is WithoutFunctions<Attach>
export function isAttach(props: CardProps): props is Attach
export function isAttach(props: CardProps | WithoutFunctions<CardProps> | null): props is Attach {
	return props !== null && 'attachable' in props
}

export const attach = {
	attachable: null,
	category: 'attach' as CardCategoryT,
	attachCondition: slot.every(
		slot.player,
		slot.attachSlot,
		slot.empty,
		slot.rowHasHermit,
		slot.actionAvailable('PLAY_EFFECT_CARD'),
		slot.not(slot.frozen)
	),
	log: undefined,
}

export type SingleUse = CardProps & {
	singleUse: null
	showConfirmationModal: boolean
	hasAttack: boolean
	description: string
}

export function isSingleUse(
	props: WithoutFunctions<CardProps>
): props is WithoutFunctions<SingleUse>
export function isSingleUse(props: CardProps): props is SingleUse
export function isSingleUse(
	props: CardProps | WithoutFunctions<CardProps> | null
): props is SingleUse {
	return props !== null && 'singleUse' in props
}

export const singleUse = {
	singleUse: null,
	showConfirmationModal: false,
	hasAttack: false,
	category: 'single_use' as CardCategoryT,
	attachCondition: slot.every(
		slot.singleUseSlot,
		slot.playerHasActiveHermit,
		slot.actionAvailable('PLAY_SINGLE_USE_CARD')
	),
}

export function hermitBattleLog(name: string) {
	return (values: PlayCardLog) =>
		`$p{You|${values.player}}$ placed $p${name}$ on row #${values.pos.rowIndex}`
}

abstract class Card<Props extends CardProps = CardProps> {
	public abstract props: Props
	private log: Array<(values: PlayCardLog) => string>

	constructor() {
		this.log = []
	}

	public getKey(keyName: string) {
		return this.props.id + ':' + keyName
	}

	public getInstanceKey(instance: string, keyName: string = '') {
		return this.props.id + ':' + instance + ':' + keyName
	}

	/**
	 * Called when an instance of this card is attached to the board
	 */
	public onAttach(game: GameModel, instance: string, pos: CardPosModel) {
		// default is do nothing
	}

	/**
	 * Called when an instance of this card is removed from the board
	 */
	public onDetach(game: GameModel, instance: string, pos: CardPosModel) {
		// default is do nothing
	}

	public isItem(): this is Card<CardProps & Item> {
		return isItem(this.props)
	}

	public getEnergy(
		this: Card<Item>,
		game: GameModel,
		instance: string,
		pos: CardPosModel
	): Array<TypeT> {
		return []
	}

	public isHealth(): this is Card<CardProps & HasHealth> {
		return isHealth(this.props)
	}

	public isHermit(): this is Card<CardProps & Hermit> {
		return isHermit(this.props)
	}

	public getAttack(
		this: Card<Hermit>,
		game: GameModel,
		instance: string,
		pos: CardPosModel,
		hermitAttackType: HermitAttackType
	): AttackModel | null {
		if (pos.rowIndex === null || !pos.row || !pos.row.hermitCard) return null

		const {opponentPlayer: opponentPlayer} = game
		const targetIndex = opponentPlayer.board.activeRow
		if (targetIndex === null) return null

		const targetRow = opponentPlayer.board.rows[targetIndex]
		if (!targetRow.hermitCard) return null

		// Create an attack with default damage
		const attack = new AttackModel({
			id: this.getInstanceKey(instance),
			attacker: {
				player: pos.player,
				rowIndex: pos.rowIndex,
				row: pos.row,
			},
			target: {
				player: opponentPlayer,
				rowIndex: targetIndex,
				row: targetRow,
			},
			type: hermitAttackType,
			createWeakness: 'ifWeak',
			log: (values) =>
				`${values.attacker} ${values.coinFlip ? values.coinFlip + ', then ' : ''} attacked ${
					values.target
				} with ${values.attackName} for ${values.damage} damage`,
		})

		if (attack.type === 'primary') {
			attack.addDamage(this.props.id, this.props.primary.damage)
		} else if (attack.type === 'secondary') {
			attack.addDamage(this.props.id, this.props.secondary.damage)
		}

		return attack
	}

	public hasAttacks(this: Card<HasHealth>): this is Card<Props & Hermit> {
		return 'primary' in this.props && 'secondary' in this.props
	}

	public isAttach(): this is Card<CardProps & Attach> {
		return isAttach(this.props)
	}

	public isSingleUse(): this is Card<CardProps & SingleUse> {
		return isSingleUse(this.props)
	}

	public getFormattedDescription(this: Card<Attach | SingleUse>): FormattedTextNode {
		return formatText(this.props.description)
	}

	/** Updates the log entry*/
	public updateLog(logEntry: (values: PlayCardLog) => string) {
		if (logEntry === null) return
		this.log.push(logEntry)
	}

	private consolidateLogs(values: PlayCardLog, logIndex: number) {
		if (logIndex > 0) {
			values.previousLog = this.consolidateLogs(values, logIndex - 1)
		}
		return this.log[logIndex](values)
	}

	/** Gets the log entry for this attack*/
	public getLog(values: PlayCardLog) {
		if (this.log.length === 0) {
			return ''
		}
		return this.consolidateLogs(values, this.log.length - 1)
	}
}

export default Card
