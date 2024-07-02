import {CONFIG, DEBUG_CONFIG, EXPANSIONS} from '../config'
import {getDeckCost} from './ranks'
import {LocalCardInstance} from '../types/server-requests'

export function validateDeck(deckCards: Array<LocalCardInstance>) {
	if (DEBUG_CONFIG.disableDeckValidation) return

	const limits = CONFIG.limits

	// order validation by simplest problem first, so that a player can easily identify why their deck isn't valid

	// Contains disabled cards
	const hasDisabledCards = deckCards.some((card) =>
		EXPANSIONS.disabled.includes(card.props.expansion)
	)
	if (hasDisabledCards) return 'Deck must not include removed cards.'

	// less than one hermit
	const hasHermit = deckCards.some((card) => card.props.category === 'hermit')
	if (!hasHermit) return 'Deck must have at least one Hermit.'

	// more than max duplicates
	const tooManyDuplicates =
		limits.maxDuplicates &&
		deckCards.some((card) => {
			if (card.props.category === 'item') return false
			const duplicates = deckCards.filter((filterCard) => filterCard.props.id === card.props.id)
			return duplicates.length > limits.maxDuplicates
		})

	if (tooManyDuplicates)
		return `You cannot have more than ${limits.maxDuplicates} duplicate cards unless they are item cards.`

	// more than max tokens
	const deckCost = getDeckCost(deckCards)
	if (deckCost > limits.maxDeckCost)
		return `Deck cannot cost more than ${limits.maxDeckCost} tokens.`

	const exactAmount = limits.minCards === limits.maxCards
	const exactAmountText = `Deck must have exactly ${limits.minCards} cards.`

	if (deckCards.length < limits.minCards)
		return exactAmount ? exactAmountText : `Deck must have at least ${limits.minCards} cards.`
	if (deckCards.length > limits.maxCards)
		return exactAmount ? exactAmountText : `Deck can not have more than ${limits.maxCards} cards.`
}
