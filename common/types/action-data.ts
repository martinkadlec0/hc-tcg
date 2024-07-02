import {HermitAttackType} from './attack'
import {SlotTypeT} from './cards'
import {AttackAction, PlayCardAction} from './game-state'
import {LocalCardInstance, PickInfo} from './server-requests'

export const slotToPlayCardAction: Record<SlotTypeT, PlayCardAction | null> = {
	hermit: 'PLAY_HERMIT_CARD',
	item: 'PLAY_ITEM_CARD',
	attach: 'PLAY_EFFECT_CARD',
	single_use: 'PLAY_SINGLE_USE_CARD',
	health: null,
	hand: null,
}
export const attackToAttackAction: Record<HermitAttackType, AttackAction> = {
	'single-use': 'SINGLE_USE_ATTACK',
	primary: 'PRIMARY_ATTACK',
	secondary: 'SECONDARY_ATTACK',
}
export const attackActionToAttack: Record<AttackAction, HermitAttackType> = {
	SINGLE_USE_ATTACK: 'single-use',
	PRIMARY_ATTACK: 'primary',
	SECONDARY_ATTACK: 'secondary',
}

// @TODO long term all data types that can be sent to server should be here
export type PlayCardActionData = {
	type: PlayCardAction
	payload: {
		pickInfo: PickInfo
		card: LocalCardInstance
	}
}

export type ChangeActiveHermitActionData = {
	type: 'CHANGE_ACTIVE_HERMIT'
	payload: {
		pickInfo: PickInfo
	}
}

export type AttackActionData = {
	type: AttackAction
	payload: {
		playerId: string
	}
}

export type PickCardActionData = {
	type: 'PICK_REQUEST'
	payload: {
		pickResult: PickInfo
	}
}

export type AnyActionData =
	| PlayCardActionData
	| ChangeActiveHermitActionData
	| AttackActionData
	| PickCardActionData
