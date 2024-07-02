import {CARDS} from '../cards'
import {CardCategoryT} from '../types/cards'
import {CardInstance} from '../types/game-state'
import {LocalCardInstance} from '../types/server-requests'

/**
 * Returns true if the two cards are equal
 */
export function equalCard(
	card1: CardInstance | LocalCardInstance | null,
	card2: CardInstance | LocalCardInstance | null
) {
	if (!card1 && !card2) return true
	if (!card1 || !card2) return false

	let id1, id2
	if ('card' in card1) {
		id1 = card1.card.props.id
	} else {
		id1 = card1.props.id
	}
	if ('card' in card2) {
		id2 = card2.card.props.id
	} else {
		id2 = card2.props.id
	}

	return id1 === id2 && card1.instance === card2.instance
}

/**
 * Check if card is the type of card
 */
export function isCardInstanceType(card: LocalCardInstance | null, type: CardCategoryT): boolean {
	if (!card) return false
	return card.props.category == type
}
