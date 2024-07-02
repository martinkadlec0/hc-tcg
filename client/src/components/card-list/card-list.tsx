import cn from 'classnames'
import CardComponent from 'components/card'
import css from './card-list.module.scss'

import {CSSTransition, TransitionGroup} from 'react-transition-group'
import {equalCard} from 'common/utils/cards'
import {LocalCardInstance} from 'common/types/server-requests'

type CardListProps = {
	cards: Array<LocalCardInstance>
	disabled?: Array<string>
	unpickable?: Array<LocalCardInstance>
	selected?: Array<LocalCardInstance | null>
	picked?: Array<LocalCardInstance>
	onClick?: (card: LocalCardInstance) => void
	wrap?: boolean
	tooltipAboveModal?: boolean
	enableAnimations?: boolean
}

const CardList = (props: CardListProps) => {
	const {wrap, onClick, cards, disabled, unpickable, selected, picked, enableAnimations} = props

	const cardsOutput = cards.map((card) => {
		const isSelected = selected
			? selected.some((selectedCard) => equalCard(card, selectedCard))
			: false
		const isPicked = !!picked?.find((pickedCard) => equalCard(card, pickedCard))
		const isDisabled = !!disabled?.find((id) => id == card.props.id)
		const isUnpickable = !!unpickable?.find((findCard) => findCard.instance === card.instance)

		const cssClasses =
			enableAnimations !== false
				? {
						enter: css.enter,
						enterActive: css.enterActive,
						enterDone: css.enterDone,
						exit: css.exit,
						exitActive: css.exitActive,
				  }
				: {}

		return (
			<CSSTransition key={card.instance} timeout={250} unmountOnExit={true} classNames={cssClasses}>
				<CardComponent
					key={card.instance}
					className={cn(css.card, {
						[css.clickable]: !!onClick && !isDisabled,
					})}
					onClick={onClick && !isDisabled ? () => onClick(card) : undefined}
					card={card.props}
					unpickable={isUnpickable}
					disabled={isDisabled}
					selected={isSelected}
					picked={isPicked}
					tooltipAboveModal={props.tooltipAboveModal}
				/>
			</CSSTransition>
		)
	})

	return (
		<TransitionGroup className={cn(css.cardList, {[css.wrap]: wrap})}>
			{cardsOutput}
		</TransitionGroup>
	)
}

export default CardList
