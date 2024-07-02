import {CARDS} from '../cards'
import Card from '../cards/base/card'
import {PlayerState} from '../types/game-state'

export function hasActive(playerState: PlayerState): boolean {
	return playerState.board.activeRow !== null
}

export function getFormattedName(cardId: string, opponent: boolean) {
	const cardInfo = CARDS[cardId]

	const getFormatting = (cardInfo: Card, opponent: boolean): string | null => {
		if (cardInfo.props.category === 'hermit') return opponent ? '$o' : '$p'
		if (cardInfo.props.category === 'single_use') return '$e'
		if (cardInfo.props.category === 'attach') return '$e'
		if (cardInfo.props.category === 'item') return '$m'
		return null
	}

	const formatting = getFormatting(cardInfo, opponent)
	if (!formatting) return ''

	return `${formatting}${cardInfo.props.name}$`
}
