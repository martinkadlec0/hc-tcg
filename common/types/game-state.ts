import {CanAttachResult} from '../cards/base/card'
import {AttackModel} from '../models/attack-model'
import {BattleLogModel} from '../models/battle-log-model'
import {CardPosModel} from '../models/card-pos-model'
import {FormattedTextNode} from '../utils/formatting'
import {HermitAttackType} from './attack'
import {EnergyT, Slot, SlotPos} from './cards'
import {GameHook, WaterfallHook} from './hooks'
import {ModalRequest, PickRequest, PickInfo} from './server-requests'

export type PlayerId = string

export type CardT = {
	cardId: string
	cardInstance: string
}

export type RowStateWithHermit = {
	hermitCard: CardT
	effectCard: CardT | null
	itemCards: Array<CardT | null>
	health: number
}

export type RowStateWithoutHermit = {
	hermitCard: null
	effectCard: null
	itemCards: Array<null>
	health: null
}

export type RowState = RowStateWithHermit | RowStateWithoutHermit

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
	cardId: string
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
	playerType: 'real' | 'virtual'
	minecraftName: string
	playerDeck: Array<CardT>
	censoredPlayerName: string
	coinFlips: Array<CurrentCoinFlipT>
	custom: Record<string, any>
	hand: Array<CardT>
	lives: number
	pile: Array<CardT>
	discarded: Array<CardT>
	board: {
		activeRow: number | null
		singleUseCard: CardT | null
		singleUseCardUsed: boolean
		rows: Array<RowState>
	}

	hooks: {
		/** Hook that modifies and returns available energy from item cards */
		availableEnergy: WaterfallHook<(availableEnergy: Array<EnergyT>) => Array<EnergyT>>

		/** Hook that modifies and returns blockedActions */
		blockedActions: WaterfallHook<(blockedActions: TurnActions) => TurnActions>

		/** Hook called when checking if a card can be attached. The result can be modified and will be stored */
		canAttach: GameHook<(canAttach: CanAttachResult, pos: CardPosModel) => void>
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
		onTurnEnd: GameHook<(drawCards: Array<CardT | null>) => void>

		/** Hook called when the player flips a coin */
		onCoinFlip: GameHook<(card: CardT, coinFlips: Array<CoinFlipT>) => Array<CoinFlipT>>

		// @TODO eventually to simplify a lot more code this could potentially be called whenever anything changes the row, using a helper.
		/** Hook called before the active row is changed. Returns whether or not the change can be completed. */
		beforeActiveRowChange: GameHook<(oldRow: number | null, newRow: number | null) => boolean>
		/** Hook called when the active row is changed. */
		onActiveRowChange: GameHook<(oldRow: number | null, newRow: number | null) => void>
		// @TODO replace with canDetach, we already have canAttach
		/** Hook called when a card attemps to move or rows are swapped. Returns whether the card in this position can be moved, or if the slot is empty, if it can be moved to. */
		onSlotChange: GameHook<(slot: SlotPos) => boolean>
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

	isBossGame: boolean
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
	/** Prevents game from awarding reward cards when checking Hermit health */
	disableRewardCards?: boolean
	/** Prevents virtual players from losing when out of cards to draw */
	disableVirtualDeckOut?: boolean
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
		singleUseCard: CardT | null
		singleUseCardUsed: boolean
		rows: Array<RowState>
	}
}

export type LocalGameState = {
	turn: LocalTurnState
	order: Array<PlayerId>
	statusEffects: Array<StatusEffectT>

	// personal data
	hand: Array<CardT>
	pileCount: number
	discarded: Array<CardT>

	// ids
	playerId: PlayerId
	opponentPlayerId: PlayerId

	lastActionResult: {
		action: TurnAction
		result: ActionResult
	} | null

	currentPickMessage: string | null
	currentModalData: ModalData | null

	players: Record<string, LocalPlayerState>

	timer: {
		turnStartTime: number
		turnRemaining: number
	}

	isBossGame: boolean
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

	selectedCard: CardT | null
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
	startHand1: string[]
	startHand2: string[]
	startTimestamp: number
	startDeck: string
}
