import Card from './base/card'
import EffectCard from './base/effect-card'
import HermitCard from './base/hermit-card'
import ItemCard from './base/item-card'
import SingleUseCard from './base/single-use-card'
import defaultEffectCards from './default/effects'
import alterEgosEffectCards from './alter-egos/effects'
import adventOfTcgEffectCards from './advent-of-tcg/effects'
import defaultHermitCards from './default/hermits'
import alterEgosHermitCards from './alter-egos/hermits'
import adventOfTcgHermitCards from './advent-of-tcg/hermits'
import bossHermitCards from './boss/hermits'
import defaultItemCards from './default/items'
import defaultSingleUseCards from './default/single-use'
import alterEgosSingleUseCards from './alter-egos/single-use'
import adventOfTcgSingleUseCards from './advent-of-tcg/single-use'
import alterEgosIIHermitCards from './alter-egos-ii/hermits/index'

const effectCardClasses: Array<EffectCard> = [
	...defaultEffectCards,
	...alterEgosEffectCards,
	...adventOfTcgEffectCards,
]

const hermitCardClasses: Array<HermitCard> = [
	...defaultHermitCards,
	...alterEgosHermitCards,
	...adventOfTcgHermitCards,
	...bossHermitCards,
	...alterEgosIIHermitCards,
]

const itemCardClasses: Array<ItemCard> = [...defaultItemCards]

const singleUseCardClasses: Array<SingleUseCard> = [
	...defaultSingleUseCards,
	...alterEgosSingleUseCards,
	...adventOfTcgSingleUseCards,
]

const allCardClasses: Array<Card> = [
	...effectCardClasses,
	...hermitCardClasses,
	...itemCardClasses,
	...singleUseCardClasses,
]

export const CARDS: Record<string, Card> = allCardClasses.reduce(
	(result: Record<string, Card>, card) => {
		result[card.id] = card
		return result
	},
	{}
)

export const EFFECT_CARDS: Record<string, EffectCard> = effectCardClasses.reduce(
	(result: Record<string, EffectCard>, card) => {
		result[card.id] = card
		return result
	},
	{}
)

export const HERMIT_CARDS: Record<string, HermitCard> = hermitCardClasses.reduce(
	(result: Record<string, HermitCard>, card) => {
		result[card.id] = card
		return result
	},
	{}
)

export const ITEM_CARDS: Record<string, ItemCard> = itemCardClasses.reduce(
	(result: Record<string, ItemCard>, card) => {
		result[card.id] = card
		return result
	},
	{}
)

export const SINGLE_USE_CARDS: Record<string, SingleUseCard> = singleUseCardClasses.reduce(
	(result: Record<string, SingleUseCard>, card) => {
		result[card.id] = card
		return result
	},
	{}
)
