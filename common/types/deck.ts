import {CARDS} from '../cards'
import {WithoutFunctions} from '../cards/base/card'
import {LocalCardInstance} from './server-requests'

export type PlayerDeckT = {
	name: string
	icon:
		| 'any'
		| 'balanced'
		| 'builder'
		| 'explorer'
		| 'farm'
		| 'miner'
		| 'prankster'
		| 'pvp'
		| 'redstone'
		| 'speedrunner'
		| 'terraform'
	cards: Array<LocalCardInstance>
}

export type SavedDeckT = {
	name: string
	icon:
		| 'any'
		| 'balanced'
		| 'builder'
		| 'explorer'
		| 'farm'
		| 'miner'
		| 'prankster'
		| 'pvp'
		| 'redstone'
		| 'speedrunner'
		| 'terraform'
	cards: Array<{
		cardId: string
		cardInstance: string
	}>
}

export function deckToSavedDeck(deck: PlayerDeckT): SavedDeckT {
	let name = deck.name
	let icon = deck.icon

	let cards = deck.cards.map((card) => {
		console.log(card)
		return {cardId: card.props.id, cardInstance: card.instance}
	})

	return {
		name,
		icon,
		cards,
	}
}

export function loadSavedDeck(deck: SavedDeckT | null): PlayerDeckT | null {
	if (!deck) return null

	let name = deck.name
	let icon = deck.icon

	let cards = deck.cards.map((card) => {
		let cardInfo = CARDS[card.cardId]
		return {
			props: WithoutFunctions(cardInfo.props),
			instance: card.cardInstance,
		}
	})

	return {
		name,
		icon,
		cards,
	}
}
