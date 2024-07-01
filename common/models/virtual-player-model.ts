import {CardT} from '../types/game-state'
import {PlayerDeckT} from '../types/deck'
import {validateDeck} from '../utils/validation'
import {censorString} from '../utils/formatting'
import {encode, decode} from 'js-base64'
import {CARDS} from '../cards'

export class VirtualPlayerModel {
	private internalId: string
	private internalSecret: string
	private internalDeck: {
		name: string
		icon: string
		cards: Array<CardT>
	}
	public name: string
	public minecraftName: string
	public censoredName: string
	public socket: null
	public ai: string

	constructor(playerName: string, minecraftName: string, ai: string) {
		this.internalId = Math.random().toString()
		this.internalSecret = Math.random().toString()

		// always generate a starter deck as the default
		this.internalDeck = {
			name: 'virtual',
			icon: '',
			cards: this.getHashFromDeck(
				this.possibleDecks[Math.floor(Math.random() * this.possibleDecks.length)]
			),
		}

		this.name = playerName
		this.minecraftName = minecraftName
		this.censoredName = censorString(playerName)

		this.socket = null
		this.ai = ai
	}

	private possibleDecks = ['woHCgcKBUVFRwojCiMKVwpUODg4YGDw8PDs7Ozs7Ozs7Ozs7Ozs7wogjI8KWGTsaGgca']

	private getHashFromDeck(hash: string): Array<CardT> {
		try {
			var b64 = decode(hash)
				.split('')
				.map((char) => char.charCodeAt(0))
		} catch (err) {
			return []
		}
		const deck = []
		for (let i = 0; i < b64.length; i++) {
			const cardId = Object.values(CARDS).find((value) => value.numericId === b64[i])?.id
			if (!cardId) continue
			deck.push({
				cardId: cardId,
				cardInstance: Math.random().toString(),
			})
		}
		const deckCards = deck.filter((card: CardT) => CARDS[card.cardId])
		return deckCards
	}

	public get id() {
		return this.internalId
	}
	public get secret() {
		return this.internalSecret
	}
	public get deck() {
		return this.internalDeck
	}

	getPlayerInfo() {
		return {
			playerId: this.id,
			playerSecret: this.secret,
			playerDeck: this.deck,
			playerName: this.name,
			minecraftName: this.minecraftName,
			censoredPlayerName: this.censoredName,
		}
	}

	setPlayerDeck(newDeck: PlayerDeckT) {
		if (!newDeck || !newDeck.cards) return
		const validationMessage = validateDeck(newDeck.cards.map((card) => card.cardId))
		if (validationMessage) return
		this.internalDeck = newDeck
	}

	setMinecraftName(name: string) {
		this.minecraftName = name
	}
}
