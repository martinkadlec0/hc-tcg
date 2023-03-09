import classnames from 'classnames'
import {useTransition, animated} from '@react-spring/web'
import {useRef} from 'react'
import CARDS from 'server/cards'
import {CardT} from 'common/types/game-state'
import Card from 'components/card'
import css from './card-list.module.css'
import {equalCard} from 'server/utils'

const SIZE = {
	medium: 200,
	small: 120,
}

type CardListProps = {
	cards: Array<CardT>
	selected?: CardT | null
	picked?: Array<CardT>
	stack?: boolean
	onClick?: (card: CardT) => void
	size: 'medium' | 'small'
	wrap?: boolean
}

type CardStack = {
	cardId: string
	cardInstances: Array<string>
}

const CardList = (props: CardListProps) => {
	const {
		stack = false,
		cards,
		wrap,
		onClick,
		selected,
		picked,
		size = 'medium',
	} = props
	const listRef = useRef<HTMLDivElement>(null)

	const transitions = useTransition(cards, {
		config: {duration: 200},
		key: (card: CardT) => card.cardInstance,
		from: {
			width: listRef.current ? 0 : SIZE[size],
			height: listRef.current ? 0 : SIZE[size],
		},
		enter: {width: SIZE[size], height: SIZE[size]},
		leave: {width: 0, height: 0},
	})

	const getCard = (card: CardT) => {
		const info = CARDS[card.cardId]
		if (!info) return null
		const isSelected = equalCard(card, selected)
		const isPicked = !!picked?.find((pickedCard) => equalCard(card, pickedCard))
		return (
			<Card
				onClick={onClick ? () => onClick(card) : undefined}
				card={info}
				selected={isSelected}
				picked={isPicked}
			/>
		)
	}

	const cardsOutput = transitions((style: any, card: CardT) => {
		return (
			<animated.div
				style={style}
				key={card.cardInstance}
				className={classnames(css.card, {[css.clickable]: !!onClick})}
			>
				{getCard(card)}
			</animated.div>
		)
	})

	const stackCards = (cards: Array<CardT>) => {
		const stack: CardStack[] = []

		cards.forEach((card) => {
			const cardId = card.cardId
			const cardStack = stack.find((cardStack) => cardStack.cardId === cardId)
			if (!cardStack) {
				stack.push({cardId, cardInstances: [card.cardInstance]})
			} else {
				cardStack.cardInstances.push(card.cardInstance)
			}
		})
		return stack
	}

	const getHeight = (
		value: number,
		istart: number,
		istop: number,
		ostart: number,
		ostop: number
	) => {
		if (value > istop) return ostop //security to avoid overflow
		return ostart + (ostop - ostart) * ((value - istart) / (istop - istart))
		//super calcul provided by https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
	}

	const cardsStackedOutput = stackCards(cards).map((card) => {
		if (card.cardInstances.length === 0) return null
		if (card.cardInstances.length === 1) {
			const cardObject: CardT = {
				cardId: card.cardId,
				cardInstance: card.cardInstances[0],
			}
			return (
				<div key={card.cardId} className={css.card}>
					{getCard(cardObject)}
				</div>
			)
		} else if (card.cardInstances.length < 6) {
			const cardList: any = []
			card.cardInstances.map((cardInstance, index) => {
				const cardObject: CardT = {
					cardId: card.cardId,
					cardInstance: cardInstance,
				}
				const y = getHeight(card.cardInstances.length, 2, 5, 80, 95) //y is the percentage of the card height : 80% for 2 card, 95% for 7+ cards
				const divStyle: React.CSSProperties = {
					position: 'relative',
					bottom: y * index + '%',
				}
				cardList.push(
					<div style={divStyle} className={css.card}>
						{getCard(cardObject)}
					</div>
				)
			})
			return (
				<div key={card.cardId} className={css.stackCard}>
					{cardList}
				</div>
			)
		} else {
			const cardObject: CardT = {
				cardId: card.cardId,
				cardInstance: card.cardInstances[0],
			}
			return (
				<div key={card.cardId}>
					<div className={css.card}>{getCard(cardObject)}</div>
					<div className={css.stackCardCount}>{card.cardInstances.length}</div>
				</div>
			)
		}
	})

	return (
		<div
			ref={listRef}
			className={classnames(
				css.cardList,
				css[size],
				wrap === false ? css.noWrap : null
			)}
		>
			{stack ? cardsStackedOutput : cardsOutput}
		</div>
	)
}

export default CardList
