import {PlayerDeckT, SavedDeckT, deckToSavedDeck, loadSavedDeck} from 'common/types/deck'
import {validateDeck} from 'common/utils/validation'

export const getActiveDeckName = () => {
	return localStorage.getItem('activeDeck')
}

export const setActiveDeck = (name: string) => {
	localStorage.setItem('activeDeck', name)
}

export const isActiveDeckValid = () => {
	const activeDeckName = getActiveDeckName()
	const activeDeck = activeDeckName ? getSavedDeck(activeDeckName)?.cards : null
	const activeDeckValid = !!activeDeck && !validateDeck(activeDeck)
	return activeDeckValid
}

export const getSavedDeck = (name: string) => {
	const hash = localStorage.getItem('Deck_' + name)

	let deck: SavedDeckT | null = null
	if (hash != null) {
		deck = JSON.parse(hash)
	}

	return loadSavedDeck(deck)
}

export const saveDeck = (deck: PlayerDeckT) => {
	const hash = 'Deck_' + deck.name
	localStorage.setItem(hash, JSON.stringify(deckToSavedDeck(deck)))
}

export const deleteDeck = (name: string) => {
	const hash = 'Deck_' + name
	localStorage.removeItem(hash)
}

export const getSavedDecks = () => {
	let lsKey
	const decks = []

	for (let i = 0; i < localStorage.length; i++) {
		lsKey = localStorage.key(i)

		if (lsKey?.includes('Deck_')) {
			const key = localStorage.getItem(lsKey)
			decks.push(key || '')
		}
	}
	return decks.sort()
}

export const getSavedDeckNames = () => {
	return getSavedDecks().map((name) => JSON.parse(name || '')?.name || '')
}

export const getLegacyDecks = () => {
	for (let i = 0; i < localStorage.length; i++) {
		const lsKey = localStorage.key(i)

		if (lsKey?.includes('Loadout_')) return true
	}
	return false
}
export const convertLegacyDecks = (): number => {
	let conversionCount = 0
	for (let i = 0; i < localStorage.length; i++) {
		const lsKey = localStorage.key(i)

		if (lsKey?.includes('Loadout_')) {
			conversionCount = conversionCount + 1
			const legacyName = lsKey.replace('Loadout_', '[Legacy] ')
			const legacyDeck = localStorage.getItem(lsKey)

			const convertedDeck = {
				name: legacyName,
				icon: 'any',
				cards: JSON.parse(legacyDeck || ''),
			}

			localStorage.setItem(`Deck_${legacyName}`, JSON.stringify(convertedDeck))

			localStorage.removeItem(lsKey)
			console.log(`Converted deck:`, lsKey, legacyName)
		}
	}

	return conversionCount
}
