import {GameModel} from './models/game-model'
import {SlotInfo} from './types/cards'
import {TurnAction} from './types/game-state'

export type SlotCondition = (game: GameModel, pos: SlotInfo) => boolean

export namespace slot {
	/** Used for debugging. Print a message provided by the msg function. */
	export const trace = (
		msg: (game: GameModel, pos: SlotInfo, result: boolean) => any,
		combinator: SlotCondition
	): SlotCondition => {
		return (game, pos) => {
			const returnValue = combinator(game, pos)
			console.info(msg(game, pos, returnValue))
			return returnValue
		}
	}

	/** Always return true */
	export const anything: SlotCondition = (game, pos) => {
		return true
	}

	/** Always return false */
	export const nothing: SlotCondition = (game, pos) => {
		return false
	}

	/**
	 * Return true if the card is attachable to a slot that fulfills all of the parameters.
	 *
	 * ```js
	 * every(player, hermit)
	 * ```
	 *
	 */
	export function every(...options: Array<SlotCondition>): SlotCondition {
		return (game, pos) => {
			return options.reduce((place, combinator) => place && combinator(game, pos), true)
		}
	}

	/**
	 * Return true if the card is attachable to a slot that fulfills any of the parameters.
	 *
	 * ```js
	 * every(opponent, some(effect, item))
	 * ```
	 *
	 */
	export function some(...options: Array<SlotCondition>): SlotCondition {
		return (game, pos) => {
			return options.reduce((place, combinator) => place || combinator(game, pos), false)
		}
	}

	/** Return the opposite of the condition*/
	export const not = (condition: SlotCondition): SlotCondition => {
		return (game, pos) => {
			return !condition(game, pos)
		}
	}

	/** Return true if the card is attached to the player's side. */
	export const player: SlotCondition = (game, pos) => {
		return pos.player.id === game.currentPlayer.id
	}

	/** Return true if the card is attached to the opponents side. */
	export const opponent: SlotCondition = (game, pos) => {
		return pos.player.id === game.opponentPlayer.id
	}

	/** Return true if the spot is empty. */
	export const empty: SlotCondition = (game, pos) => {
		return pos.card === null
	}

	/** Return true if the card is attached to a hermit slot. */
	export const hermitSlot: SlotCondition = (game, pos) => {
		return pos.type === 'hermit'
	}

	/** Return true if the card is attached to an effect slot. */
	export const attachSlot: SlotCondition = (game, pos) => {
		return pos.type === 'attach'
	}

	/** Return true if the card is attached to a single use slot. */
	export const singleUseSlot: SlotCondition = (game, pos) => {
		return pos.type === 'single_use'
	}

	/** Return true if the card is attached to an item slot. */
	export const itemSlot: SlotCondition = (game, pos) => {
		return pos.type === 'item'
	}

	/** Return true if the card is attached to the active row. */
	export const activeRow: SlotCondition = (game, pos) => {
		return pos.player.board.activeRow === pos.rowIndex
	}

	/* Return true if the card is in a player's hand */
	export const hand: SlotCondition = (game, pos) => {
		return [game.currentPlayer, game.opponentPlayer].some((player) => {
			return player.hand.some((card) => card.instance === pos.card?.instance)
		})
	}

	export const rowHasHermit: SlotCondition = (game, pos) => {
		return pos.row !== null && pos.row.hermitCard !== null
	}

	export const playerHasActiveHermit: SlotCondition = (game, pos) => {
		return pos.player.board.activeRow !== null
	}

	export const opponentHasActiveHermit: SlotCondition = (game, pos) => {
		return game.opponentPlayer.board.activeRow !== null
	}

	export const rowIndex = (rowIndex: number | null): SlotCondition => {
		return (game, pos) => rowIndex !== null && pos.rowIndex === rowIndex
	}

	export const index = (index: number | null): SlotCondition => {
		return (game, pos) => index !== null && pos.index === index
	}

	/** Return true if the spot contains the specified card instance. */
	export const hasInstance = (cardInstance: string): SlotCondition => {
		return (game, pos) => {
			return pos.card !== null && pos.card.instance === cardInstance
		}
	}

	/** Return true if the spot contains any of the card IDs. */
	export const hasId = (...cardIds: Array<string>): SlotCondition => {
		return (game, pos) => {
			return cardIds.some((cardId) => {
				return pos.card !== null && pos.card.card.props.id === pos.card.card.props.id
			})
		}
	}

	/** Return true if the hermit in a slot has a certian status effect */
	export const hasStatusEffect = (statusEffect: string): SlotCondition => {
		return (game, pos) => {
			return game.state.statusEffects.some(
				(effect) =>
					effect.targetInstance == pos.card?.instance && effect.statusEffectId == statusEffect
			)
		}
	}

	/**
	 * Returns if a slot is marked as frozen through the `freezeSlots` hook
	 * A frozen slot is a slot that can not have card placed in it or removed from it.
	 */
	export const frozen: SlotCondition = (game, pos) => {
		if (pos.type === 'single_use' || pos.type === 'hand') return false
		if (pos.rowIndex === null || !pos.type) return false

		const playerResult = game.currentPlayer.hooks.freezeSlots
			.call()
			.some((result) => result(game, pos))

		pos = {
			...pos,
			player: pos.opponentPlayer,
			opponentPlayer: pos.player,
		}

		const opponentResult = game.opponentPlayer.hooks.freezeSlots
			.call()
			.some((result) => result(game, pos))

		return playerResult || opponentResult
	}

	export const actionAvailable = (action: TurnAction): SlotCondition => {
		return (game, pos) => game.state.turn.availableActions.includes(action)
	}

	/** Return true if a slot on the board exists that fullfils the condition given by the predicate */
	export const someSlotFulfills =
		(predicate: SlotCondition): SlotCondition =>
		(game, pos) => {
			return game.someSlotFulfills(predicate)
		}

	/* *Returns true if an adjacent row to a given slot fulfills the condition given by the predicate. */
	export const adjacentTo = (predicate: SlotCondition): SlotCondition => {
		return (game, pos) => {
			if (pos.rowIndex === null) return false
			return (
				game.filterSlots(predicate).filter((pickedPos) => {
					if (pos.rowIndex === null || pickedPos.rowIndex === null) return false
					return [pos.rowIndex - 1, pos.rowIndex + 1].includes(pickedPos.rowIndex)
				}).length >= 1
			)
		}
	}
}
