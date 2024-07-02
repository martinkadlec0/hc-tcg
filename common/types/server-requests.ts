import {CardProps, WithoutFunctions} from '../cards/base/card'
import {SlotCondition} from '../slot'
import {SlotInfo, SlotTypeT} from './cards'
import {ActionResult, ModalData} from './game-state'

export type LocalCardInstance<Props extends CardProps = CardProps> = {
	readonly props: WithoutFunctions<Props>
	readonly instance: string
}

export type PickedSlotType = SlotTypeT | 'hand'

export type PickInfo = {
	playerId: string
	rowIndex: number | null // This will be null for the hand
	card: LocalCardInstance | null
	type: SlotTypeT
	index: number | null
}

export type PickRequest = {
	/** The id of the player to request the pick from */
	playerId: string
	/** The id of the card that called the pick request */
	id: string
	/** The message to display to the player */
	message: string
	/** A function that returns if the card can be attached to a specific slot */
	canPick: SlotCondition
	/** The function that will be called when we receive a pick result. This will return whether this was a success or not*/
	onResult: (pickedSlot: SlotInfo) => void //
	/** Called when the pick request is cancelled. This can only occur with a single use card */
	onCancel?: () => void
	/** Called when the pick request times out before being resolved successfully */
	onTimeout?: () => void
}

export type ModalRequest = {
	/** The id of the player to request the pick from */
	playerId: string
	/** The id of the custom modal, used to reference it at a later date */
	data: ModalData
	/** The function that will be called when we receive a modal result. This will return whether this was a success or not*/
	onResult: (modalResult: any) => ActionResult
	/** Called when the modal request times out before being resolved successfully */
	onTimeout: () => void
}
