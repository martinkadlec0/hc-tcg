import cn from 'classnames'
import {CARDS} from 'common/cards'
import {CardT} from 'common/types/game-state'
import CardComponent from 'components/card'
import css from './card-list.module.scss'

import Card from 'common/cards/base/card'
import {equalCard} from 'common/utils/cards'

type CardListProps = {
	cards: Array<CardT>
	disabled?: Array<string>
	selected?: Array<CardT | null>
	picked?: Array<CardT>
	onClick?: (card: CardT) => void
	wrap?: boolean
	tooltipAboveModal?: boolean
}

const CardList = (props: CardListProps) => {
	const {wrap, onClick, cards, disabled, selected, picked} = props

	const cardsOutput = cards.map((card) => {
		const info = CARDS[card.cardId] as Card
		if (!info) return null
		const isSelected = selected
			? selected.some((selectedCard) => equalCard(card, selectedCard))
			: false
		const isPicked = !!picked?.find((pickedCard) => equalCard(card, pickedCard))
		const isDisabled = !!disabled?.find((id) => card.cardId === id)

		return (
			<li>
				<CardComponent
					key={card.cardId}
					className={cn(css.card, {
						[css.clickable]: !!onClick && !isDisabled,
					})}
					onClick={onClick && !isDisabled ? () => onClick(card) : undefined}
					card={info}
					disabled={isDisabled}
					selected={isSelected}
					picked={!!isPicked}
					tooltipAboveModal={props.tooltipAboveModal}
				/>
			</li>
		)
	})

	return <ul className={cn(css.cardList, {[css.wrap]: wrap})}>{cardsOutput}</ul>
}

export default CardList
