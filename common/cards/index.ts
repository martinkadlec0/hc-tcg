import Card from './base/card'
import defaultEffectCards from './default/effects'
import alterEgosEffectCards from './alter-egos/effects'
// import adventOfTcgEffectCards from './advent-of-tcg/effects'
import defaultHermitCards from './default/hermits'
import alterEgosHermitCards from './alter-egos/hermits'
// import adventOfTcgHermitCards from './advent-of-tcg/hermits'
import defaultItemCards from './default/items'
import defaultSingleUseCards from './default/single-use'
import alterEgosSingleUseCards from './alter-egos/single-use'
// import adventOfTcgSingleUseCards from './advent-of-tcg/single-use'
import alterEgosIIHermitCards from './alter-egos-ii/hermits/index'

const effectCardClasses: Array<Card> = [
	...defaultEffectCards,
	...alterEgosEffectCards,
	// ...adventOfTcgEffectCards,
]

const hermitCardClasses: Array<Card> = [
	...defaultHermitCards,
	...alterEgosHermitCards,
	// 	...adventOfTcgHermitCards,
	...alterEgosIIHermitCards,
]

const itemCardClasses: Array<Card> = [...defaultItemCards]

const singleUseCardClasses: Array<Card> = [
	...defaultSingleUseCards,
	...alterEgosSingleUseCards,
	// ...adventOfTcgSingleUseCards,
]

const allCardClasses: Array<Card> = [
	...effectCardClasses,
	...hermitCardClasses,
	...itemCardClasses,
	...singleUseCardClasses,
]

export const CARDS: Record<string, Card> = allCardClasses.reduce(
	(result: Record<string, Card>, card) => {
		result[card.props.id] = card
		return result
	},
	{}
)
