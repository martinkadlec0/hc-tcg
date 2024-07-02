import {PlayerModel} from './player-model'
import {
	TurnAction,
	GameState,
	ActionResult,
	TurnActions,
	PlayerState,
	Message,
	CardInstance,
} from '../types/game-state'
import {getGameState} from '../utils/state-gen'
import {ModalRequest, PickInfo, PickRequest, PickedSlotType} from '../types/server-requests'
import {BattleLogModel} from './battle-log-model'
import {SlotCondition} from '../slot'
import {SlotInfo} from '../types/cards'
import {getCardPos} from './card-pos-model'

export class GameModel {
	private internalCreatedTime: number
	private internalId: string
	private internalCode: string | null

	public chat: Array<Message>
	public battleLog: BattleLogModel
	public players: Record<string, PlayerModel>
	public task: any
	public state: GameState

	public endInfo: {
		deadPlayerIds: Array<string>
		winner: string | null
		outcome: 'timeout' | 'forfeit' | 'tie' | 'player_won' | 'error' | null
		reason: 'hermits' | 'lives' | 'cards' | 'time' | null
	}

	constructor(player1: PlayerModel, player2: PlayerModel, code: string | null = null) {
		this.internalCreatedTime = Date.now()
		this.internalId = 'game_' + Math.random().toString()
		this.internalCode = code
		this.chat = []
		this.battleLog = new BattleLogModel(this)

		this.task = null

		this.endInfo = {
			deadPlayerIds: [],
			winner: null,
			outcome: null,
			reason: null,
		}

		this.players = {
			[player1.id]: player1,
			[player2.id]: player2,
		}

		this.state = getGameState(this)
	}

	public get currentPlayerId() {
		return this.state.order[(this.state.turn.turnNumber + 1) % 2]
	}

	public get opponentPlayerId() {
		return this.state.order[this.state.turn.turnNumber % 2]
	}

	public get currentPlayer() {
		return this.state.players[this.currentPlayerId]
	}

	public get opponentPlayer() {
		return this.state.players[this.opponentPlayerId]
	}

	public get activeRow() {
		const player = this.currentPlayer
		return player.board.activeRow !== null ? player.board.rows[player.board.activeRow] : null
	}

	public get opponentActiveRow() {
		const player = this.opponentPlayer
		return player.board.activeRow !== null ? player.board.rows[player.board.activeRow] : null
	}

	public getPlayerIds() {
		return Object.keys(this.players)
	}

	public getPlayers() {
		return Object.values(this.players)
	}

	public get createdTime() {
		return this.internalCreatedTime
	}

	public get id() {
		return this.internalId
	}

	public get code() {
		return this.internalCode
	}

	// Functions

	/** Set actions as completed so they cannot be done again this turn */
	public addCompletedActions(...actions: TurnActions) {
		for (let i = 0; i < actions.length; i++) {
			const action = actions[i]
			if (!this.state.turn.completedActions.includes(action)) {
				this.state.turn.completedActions.push(action)
			}
		}
	}
	/** Remove action from the completed list so they can be done again this turn */
	public removeCompletedActions(...actions: TurnActions) {
		for (let i = 0; i < actions.length; i++) {
			this.state.turn.completedActions = this.state.turn.completedActions.filter(
				(action) => !actions.includes(action)
			)
		}
	}

	/** Set actions as blocked so they cannot be done this turn */
	public addBlockedActions(sourceId: string, ...actions: TurnActions) {
		const key = sourceId
		const turnState = this.state.turn
		if (!turnState.blockedActions[key]) {
			turnState.blockedActions[key] = []
		}

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i]
			if (!turnState.blockedActions[key].includes(action)) {
				turnState.blockedActions[key].push(action)
			}
		}
	}
	/** Remove action from the completed list so they can be done again this turn */
	public removeBlockedActions(sourceId: string, ...actions: TurnActions) {
		const key = sourceId
		const turnState = this.state.turn
		if (!turnState.blockedActions[key]) return

		for (let i = 0; i < actions.length; i++) {
			turnState.blockedActions[key] = turnState.blockedActions[key].filter(
				(action) => !actions.includes(action)
			)
		}

		if (turnState.blockedActions[key].length <= 0) {
			delete turnState.blockedActions[key]
		}
	}

	/** Returns true if the current blocked actions list includes the given action */
	public isActionBlocked(action: TurnAction, excludeIds?: Array<string>) {
		const turnState = this.state.turn
		const allBlockedActions: TurnActions = []
		Object.keys(turnState.blockedActions).forEach((sourceId) => {
			if (excludeIds?.includes(sourceId)) return

			const actions = turnState.blockedActions[sourceId]
			allBlockedActions.push(...actions)
		})
		return allBlockedActions.includes(action)
	}

	/** Get all actions blocked with the source id. */
	public getBlockedActions(sourceId: string) {
		const key = sourceId || ''
		const turnState = this.state.turn
		const blockedActions = turnState.blockedActions[key]
		if (!blockedActions) return []

		return blockedActions
	}
	public getAllBlockedActions() {
		const turnState = this.state.turn
		const allBlockedActions: TurnActions = []
		Object.values(turnState.blockedActions).forEach((actions) => {
			allBlockedActions.push(...actions)
		})
		return allBlockedActions
	}

	public setLastActionResult(action: TurnAction, result: ActionResult) {
		this.state.lastActionResult = {action, result}
	}

	public addPickRequest(newRequest: PickRequest, before = false) {
		if (before) {
			this.state.pickRequests.unshift(newRequest)
		} else {
			this.state.pickRequests.push(newRequest)
		}
	}
	public removePickRequest(index = 0, timeout = true) {
		if (this.state.pickRequests[index] !== undefined) {
			const request = this.state.pickRequests.splice(index, 1)[0]
			if (timeout) {
				request.onTimeout?.()
			}
		}
	}
	public cancelPickRequests() {
		if (this.state.pickRequests[0]?.playerId === this.currentPlayerId) {
			// Cancel and clear pick requests
			for (let i = 0; i < this.state.pickRequests.length; i++) {
				this.state.pickRequests[i].onCancel?.()
			}
			this.state.pickRequests = []
		}
	}

	public addModalRequest(newRequest: ModalRequest, before = false) {
		if (before) {
			this.state.modalRequests.unshift(newRequest)
		} else {
			this.state.modalRequests.push(newRequest)
		}
	}
	public removeModalRequest(index = 0, timeout = true) {
		if (this.state.modalRequests[index] !== undefined) {
			const request = this.state.modalRequests.splice(index, 1)[0]
			if (timeout) {
				request.onTimeout()
			}
		}
	}

	public hasActiveRequests(): boolean {
		return this.state.pickRequests.length > 0 || this.state.modalRequests.length > 0
	}

	/** Update the cards that the players are able to select */
	public updateCardsCanBePlacedIn() {
		const getCardsCanBePlacedIn = (player: PlayerState) => {
			return player.hand.reduce((cards, card) => {
				cards.push([card, this.getPickableSlots(card.card.props.attachCondition)])
				return cards
			}, [] as Array<[CardInstance, Array<PickInfo>]>)
		}

		this.currentPlayer.cardsCanBePlacedIn = getCardsCanBePlacedIn(this.currentPlayer)
		this.opponentPlayer.cardsCanBePlacedIn = getCardsCanBePlacedIn(this.opponentPlayer)
	}

	/** Helper method to change the active row. Returns whether or not the change was successful. */
	public changeActiveRow(player: PlayerState, newRow: number | null): boolean {
		const currentActiveRow = player.board.activeRow

		// Can't change to existing active row
		if (newRow === currentActiveRow) return false

		// Call before active row change hooks - if any of the results are false do not change
		const results = player.hooks.beforeActiveRowChange.call(currentActiveRow, newRow)
		if (results.includes(false)) return false

		// Create battle log entry
		if (newRow !== null) {
			const newHermit = player.board.rows[newRow].hermitCard
			const oldHermit =
				currentActiveRow !== null ? player.board.rows[currentActiveRow].hermitCard : null
			this.battleLog.addChangeRowEntry(player, newRow, oldHermit, newHermit)
		}

		// Change the active row
		player.board.activeRow = newRow

		// Call on active row change hooks
		player.hooks.onActiveRowChange.call(currentActiveRow, newRow)

		return true
	}

	/**Helper method to swap the positions of two rows on the board. Returns whether or not the change was successful. */
	public swapRows(player: PlayerState, oldRow: number, newRow: number): boolean {
		const activeRowChanged = this.changeActiveRow(player, newRow)
		if (!activeRowChanged) return false

		const oldRowState = player.board.rows[oldRow]
		player.board.rows[oldRow] = player.board.rows[newRow]
		player.board.rows[newRow] = oldRowState

		return true
	}

	/** Return the slots that fullfil a condition given by the predicate */
	public filterSlots(predicate: SlotCondition): Array<SlotInfo> {
		let pickableSlots: Array<SlotInfo> = []

		for (const player of Object.values(this.state.players)) {
			const opponentPlayer = Object.values(this.state.players).filter(
				(opponent) => opponent.id !== player.id
			)[0]

			for (let rowIndex = 0; rowIndex < player.board.rows.length; rowIndex++) {
				const row = player.board.rows[rowIndex]

				const appendAttachCondition = (
					type: PickedSlotType,
					index: number,
					cardInstance: CardInstance | null
				) => {
					const slotInfo = {
						player,
						opponentPlayer,
						type,
						index,
						rowIndex,
						row,
						card: cardInstance,
					}
					if (predicate(this, slotInfo)) {
						pickableSlots.push(slotInfo)
					}
				}

				for (const [index, item] of row.itemCards.entries()) {
					appendAttachCondition('item', index, item)
				}
				appendAttachCondition('attach', 3, row.effectCard)
				appendAttachCondition('hermit', 4, row.hermitCard)
			}

			for (const card of player.hand) {
				const slotInfo: SlotInfo = {
					player: player,
					opponentPlayer: opponentPlayer,
					type: 'hand',
					index: null,
					rowIndex: null,
					row: null,
					card,
				}
				if (predicate(this, slotInfo)) pickableSlots.push(slotInfo)
			}
		}

		const singleUseSlotInfo: SlotInfo = {
			player: this.currentPlayer,
			opponentPlayer: this.opponentPlayer,
			type: 'single_use',
			index: null,
			rowIndex: null,
			row: null,
			card: this.currentPlayer.board.singleUseCard,
		}

		if (predicate(this, singleUseSlotInfo)) {
			pickableSlots.push(singleUseSlotInfo)
		}

		return pickableSlots
	}

	public findSlot(prediate: SlotCondition): SlotInfo | null {
		return this.filterSlots(prediate)[0]
	}

	/**
	 * Swaps the positions of two cards on the board.
	 * This function does not check whether the cards can be placed in the other card's slot.
	 */
	public swapSlots(
		slotA: SlotInfo | null,
		slotB: SlotInfo | null,
		withoutDetach: boolean = false
	): void {
		if (!slotA || !slotB) return
		if (slotA.type !== slotB.type) return
		if (!slotA.row || !slotB.row) return

		// Swap
		if (slotA.type === 'hermit') {
			let tempCard = slotA.row?.hermitCard
			slotA.row.hermitCard = slotB.row.hermitCard
			slotB.row.hermitCard = tempCard
		} else if (slotA.type === 'attach') {
			let tempCard = slotA.row.effectCard
			slotA.row.effectCard = slotB.row.effectCard
			slotB.row.effectCard = tempCard
		} else if (slotA.type === 'item') {
			if (slotA.index === null || slotB.index === null) return
			let tempCard = slotA.row.itemCards[slotA.index]
			slotA.row.itemCards[slotA.index] = slotB.row.itemCards[slotB.index]
			slotB.row.itemCards[slotB.index] = tempCard
		}

		if (!withoutDetach) {
			// onAttach
			;[slotA, slotB].forEach((slot) => {
				if (!slot.card) return
				const cardPos = getCardPos(this, slot.card.instance)
				if (!cardPos) return

				slot.card.card.onAttach(this, slot.card.instance, cardPos)

				cardPos.player.hooks.onAttach.call(slot.card.instance)
			})
		}
	}

	public getPickableSlots(predicate: SlotCondition): Array<PickInfo> {
		return this.filterSlots(predicate).map((slot) => {
			return {
				playerId: slot.player.id,
				rowIndex: slot.rowIndex,
				card: slot.card?.toLocalCardInstance() || null,
				type: slot.type,
				index: slot.index,
			}
		})
	}

	public someSlotFulfills(predicate: SlotCondition) {
		return this.filterSlots(predicate).length !== 0
	}
}
