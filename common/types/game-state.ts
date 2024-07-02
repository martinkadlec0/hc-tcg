import {CARDS} from '../cards'
import Card, {
	Attach,
	CardProps,
	HasHealth,
	Hermit,
	Item,
	SingleUse,
	WithoutFunctions,
	isAttach,
	isHealth,
	isHermit,
	isSingleUse,
} from '../cards/base/card'
import {AttackModel} from '../models/attack-model'
import {BattleLogModel} from '../models/battle-log-model'
import {SlotCondition} from '../slot'
import {FormattedTextNode} from '../utils/formatting'
import {HermitAttackType} from './attack'
import {EnergyT} from './cards'
import {GameHook, WaterfallHook} from './hooks'
import {LocalCardInstance, ModalRequest, PickInfo, PickRequest} from './server-requests'

export type PlayerId = string

export class CardInstance<Props extends CardProps = CardProps> {
	readonly card: Card<Props>
	readonly instance: string

	constructor(card: Card<Props>, instance: string) {
		this.card = card
		this.instance = instance
	}

	static fromLocalCardInstance(localCardInstance: LocalCardInstance) {
		return new CardInstance(CARDS[localCardInstance.props.id], localCardInstance.instance)
	}

	public toLocalCardInstance(): LocalCardInstance<Props> {
		return {
			props: this.card.props as WithoutFunctions<Props>,
			instance: this.instance,
		}
	}

	public get props(): Props {
		return this.card.props
	}

	public isItem(): this is CardInstance<Item> {
		return isHermit(this.props)
	}
	public isSingleUse(): this is CardInstance<SingleUse> {
		return isSingleUse(this.props)
	}
	public isAttach(): this is CardInstance<Attach> {
		return isAttach(this.props)
	}
	public isHealth(): this is CardInstance<HasHealth> {
		return isHealth(this.props)
	}
	public isHermit(): this is CardInstance<Hermit> {
		return isHermit(this.props)
	}
}

export type RowStateWithHermit = {
	hermitCard: CardInstance<HasHealth>
	effectCard: CardInstance<Attach> | null
	itemCards: Array<CardInstance<Item> | null>
	health: number
}

export type RowStateWithoutHermit = {
	hermitCard: null
	effectCard: null
	itemCards: Array<null>
	health: null
}

export function healHermit(row: RowState | null, amount: number) {
	if (!row || !row?.hermitCard) return

	if (!isHealth(row.hermitCard.props)) {
		return
	}
	row.health = Math.min(row.health + amount, row.hermitCard.props.health)
}

export type RowState = RowStateWithHermit | RowStateWithoutHermit

export type LocalRowState = {
	hermitCard: LocalCardInstance<HasHealth> | null
	effectCard: LocalCardInstance<Attach> | null
	itemCards: Array<LocalCardInstance<Item> | null>
	health: number | null
}

export type CoinFlipT = 'heads' | 'tails'

export type StatusEffectT = {
	/** The ID of the statusEffect. */
	statusEffectId: string
	/** The statusEffect's instance. */
	statusEffectInstance: string
	/** The target card's instance. */
	targetInstance: string
	/** The duration of the effect. If undefined, the effect is infinite. */
	duration?: number
	/** Whether the statusEffect is a damage effect or not. */
	damageEffect: boolean
}

export type CurrentCoinFlipT = {
	card: CardInstance
	opponentFlip: boolean
	name: string
	tosses: Array<CoinFlipT>
	amount: number
	delay: number
}

export type BattleLogT = {
	player: PlayerId
	description: string
}

export type PlayerState = {
	id: PlayerId
	playerName: string
	minecraftName: string
	playerDeck: Array<CardInstance>
	censoredPlayerName: string
	coinFlips: Array<CurrentCoinFlipT>
	custom: Record<string, any>
	hand: Array<CardInstance>
	lives: number
	pile: Array<CardInstance>
	discarded: Array<CardInstance>
	hasPlacedHermit: boolean

	pickableSlots: Array<PickInfo> | null
	cardsCanBePlacedIn: Array<[CardInstance, Array<PickInfo>]>

	board: {
		activeRow: number | null
		singleUseCard: CardInstance<SingleUse> | null
		singleUseCardUsed: boolean
		rows: Array<RowState>
	}

	hooks: {
		/** Hook that modifies and returns available energy from item cards */
		availableEnergy: WaterfallHook<(availableEnergy: Array<EnergyT>) => Array<EnergyT>>

		/** Hook that modifies and returns blockedActions */
		blockedActions: WaterfallHook<(blockedActions: TurnActions) => TurnActions>

		/** Hook called when a card is attached */
		onAttach: GameHook<(instance: string) => void>
		/** Hook called when a card is detached */
		onDetach: GameHook<(instance: string) => void>

		/** Hook called before a single use card is applied */
		beforeApply: GameHook<() => void>
		/** Hook called when a single use card is applied */
		onApply: GameHook<() => void>
		/** Hook called after a single use card is applied */
		afterApply: GameHook<() => void>

		/**
		 * Hook called once before each attack loop.
		 *
		 * This is the place to add pick/modal requests if they need to be resolved before the attack loop.
		 */
		getAttackRequests: GameHook<
			(activeInstance: string, hermitAttackType: HermitAttackType) => void
		>

		/** Hook that returns attacks to execute */
		getAttack: GameHook<() => AttackModel | null>
		/** Hook called before the main attack loop, for every attack from our side of the board */
		beforeAttack: GameHook<(attack: AttackModel) => void>
		/** Hook called before the main attack loop, for every attack targeting our side of the board */
		beforeDefence: GameHook<(attack: AttackModel) => void>
		/** Hook called for every attack from our side of the board */
		onAttack: GameHook<(attack: AttackModel) => void>
		/** Hook called for every attack that targets our side of the board */
		onDefence: GameHook<(attack: AttackModel) => void>
		/**
		 * Hook called after the main attack loop is completed, for every attack from our side of the board.
		 * Attacks added from this hook will not be executed.
		 *
		 * This is called after actions are marked as completed and blocked
		 */
		afterAttack: GameHook<(attack: AttackModel) => void>
		/**
		 * Hook called after the main attack loop, for every attack targeting our side of the board
		 *
		 * This is called after actions are marked as completed and blocked
		 */
		afterDefence: GameHook<(attack: AttackModel) => void>

		/**
		 * Hook called at the start of the turn
		 *
		 * This is a great place to add blocked actions for the turn, as it's called before actions are calculated
		 */
		onTurnStart: GameHook<() => void>
		/** Hook called at the end of the turn */
		onTurnEnd: GameHook<(drawCards: Array<CardInstance | null>) => void>

		/** Hook called when the player flips a coin */
		onCoinFlip: GameHook<(card: CardInstance, coinFlips: Array<CoinFlipT>) => Array<CoinFlipT>>

		// @TODO eventually to simplify a lot more code this could potentially be called whenever anything changes the row, using a helper.
		/** Hook called before the active row is changed. Returns whether or not the change can be completed. */
		beforeActiveRowChange: GameHook<(oldRow: number | null, newRow: number | null) => boolean>
		/** Hook called when the active row is changed. */
		onActiveRowChange: GameHook<(oldRow: number | null, newRow: number | null) => void>
		/** Hook called when the `slot.locked` combinator is called.
		 * Returns a combinator that verifies if the slot is locked or not.
		 * Locked slots cannot be chosen in some combinator expressions.
		 */
		freezeSlots: GameHook<() => SlotCondition>
	}
}

export type GenericActionResult =
	| 'SUCCESS'
	| 'FAILURE_INVALID_DATA'
	| 'FAILURE_NOT_APPLICABLE'
	| 'FAILURE_ACTION_NOT_AVAILABLE'
	| 'FAILURE_CANNOT_COMPLETE'
	| 'FAILURE_UNKNOWN_ERROR'

export type PlayCardActionResult =
	| 'FAILURE_INVALID_PLAYER'
	| 'FAILURE_INVALID_SLOT'
	| 'FAILURE_UNMET_CONDITION'
	| 'FAILURE_UNMET_CONDITION_SILENT'

export type PickCardActionResult =
	| 'FAILURE_INVALID_PLAYER'
	| 'FAILURE_INVALID_SLOT'
	| 'FAILURE_WRONG_PICK'

export type ActionResult = GenericActionResult | PlayCardActionResult | PickCardActionResult

export type ModalData = {
	modalId: string
	payload?: any
}

export type TurnState = {
	turnNumber: number
	currentPlayerId: string
	availableActions: TurnActions
	opponentAvailableActions: TurnActions
	completedActions: TurnActions
	/** Map of source id of the block, to the actual blocked action */
	blockedActions: Record<string, TurnActions>

	currentAttack: HermitAttackType | null
}

export type LocalTurnState = {
	turnNumber: number
	currentPlayerId: string
	availableActions: TurnActions
}

export type GameState = {
	turn: TurnState
	order: Array<PlayerId>
	players: Record<string, PlayerState>
	statusEffects: Array<StatusEffectT>

	pickRequests: Array<PickRequest>
	modalRequests: Array<ModalRequest>

	lastActionResult: {
		action: TurnAction
		result: ActionResult
	} | null

	timer: {
		turnStartTime: number
		turnRemaining: number
		opponentActionStartTime: number | null
	}
}

export type PlayCardAction =
	| 'PLAY_HERMIT_CARD'
	| 'PLAY_ITEM_CARD'
	| 'PLAY_SINGLE_USE_CARD'
	| 'PLAY_EFFECT_CARD'

export type AttackAction = 'SINGLE_USE_ATTACK' | 'PRIMARY_ATTACK' | 'SECONDARY_ATTACK'

export type TurnAction =
	| PlayCardAction
	| AttackAction
	| 'END_TURN'
	| 'APPLY_EFFECT'
	| 'REMOVE_EFFECT'
	| 'CHANGE_ACTIVE_HERMIT'
	| 'PICK_REQUEST'
	| 'MODAL_REQUEST'
	| 'WAIT_FOR_TURN'
	| 'WAIT_FOR_OPPONENT_ACTION'

export type GameRules = {
	disableTimer: boolean
}

export type TurnActions = Array<TurnAction>

export type GameEndOutcomeT =
	| 'client_crash'
	| 'server_crash'
	| 'timeout'
	| 'forfeit_win'
	| 'forfeit_loss'
	| 'leave_win'
	| 'leave_loss'
	| 'tie'
	| 'unknown'
	| 'you_won'
	| 'you_lost'
	| null

export type GameEndReasonT = 'hermits' | 'lives' | 'cards' | 'time' | null

export type LocalPlayerState = {
	id: PlayerId
	playerName: string
	minecraftName: string
	censoredPlayerName: string
	coinFlips: Array<CurrentCoinFlipT>
	custom: Record<string, any>
	lives: number
	board: {
		activeRow: number | null
		singleUseCard: LocalCardInstance | null
		singleUseCardUsed: boolean
		rows: Array<LocalRowState>
	}
}

export type LocalGameState = {
	turn: LocalTurnState
	order: Array<PlayerId>
	statusEffects: Array<StatusEffectT>

	// personal data
	hand: Array<LocalCardInstance>
	pileCount: number
	discarded: Array<LocalCardInstance>

	// ids
	playerId: PlayerId
	opponentPlayerId: PlayerId

	lastActionResult: {
		action: TurnAction
		result: ActionResult
	} | null

	currentCardsCanBePlacedIn: Array<[LocalCardInstance, Array<PickInfo>]> | null
	currentPickableSlots: Array<PickInfo> | null
	currentPickMessage: string | null
	currentModalData: ModalData | null

	players: Record<string, LocalPlayerState>

	timer: {
		turnStartTime: number
		turnRemaining: number
	}
}

export type Message = {
	sender: PlayerId
	systemMessage: boolean
	message: FormattedTextNode
	createdAt: number
}

// state sent to client
export type LocalGameRoot = {
	localGameState: LocalGameState | null
	time: number

	selectedCard: LocalCardInstance | null
	openedModal: {
		id: string
		info: null
	} | null
	endGameOverlay: {
		reason: GameEndReasonT
		outcome: GameEndOutcomeT
	} | null
	chat: Array<Message>
	battleLog: BattleLogModel | null
	currentCoinFlip: CurrentCoinFlipT | null
	opponentConnected: boolean
}

export type GameLog = {
	type: 'public' | 'private'
	startHand1: Array<CardInstance>
	startHand2: Array<CardInstance>
	startTimestamp: number
	startDeck: string
}
