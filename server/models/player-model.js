import {getStarterPack} from '../utils/state-gen'
import profanityFilter from '../utils/profanity'
import {validateDeck} from '../utils'
import CARDS from '../cards'

/**
 * @typedef {import('socket.io').Socket} Socket
 */

// @TODO store playerState on player.state, instead of game.state.players, to avoid confusion?

export class PlayerModel {
	/**
	 * @param {string} playerName
	 * @param {Socket} socket
	 */
	constructor(playerName, socket) {
		// create a new player

		// @TODO remove "player" in values everywhere, e.g. player.id and player.secret, rather than player.playerId and player.playerSecret
		// need to make sure it's done everywhere tho
		/** @type {string} */
		this.playerId = Math.random().toString()

		/** @type {string} */
		this.playerSecret = Math.random().toString()

		/** @type {Array<string>} */
		this.playerDeck = getStarterPack()

		/** @type {string} */
		this.playerName = playerName

		/** @type {string} */
		this.censoredPlayerName = profanityFilter(playerName)

		/** @type {Socket} */
		this.socket = socket
	}

	getPlayerInfo() {
		return {
			playerId: this.playerId,
			playerSecret: this.playerSecret,
			playerDeck: this.playerDeck,
			playerName: this.playerName,
			censoredPlayerName: this.censoredPlayerName,
		}
	}

	setPlayerDeck(newDeck) {
		if (!newDeck || !Array.isArray(newDeck)) return
		newDeck = newDeck.filter((cardId) => cardId in CARDS)
		const validationMessage = validateDeck(newDeck)
		if (validationMessage) return
		this.playerDeck = newDeck
	}
}
