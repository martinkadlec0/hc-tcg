import classnames from 'classnames'
import CardComponent from 'components/card'
import {LocalRowState} from 'common/types/game-state'
import css from './board.module.scss'
import {StatusEffectT} from 'common/types/game-state'
import StatusEffect from 'components/status-effects/status-effect'
import {STATUS_EFFECT_CLASSES} from 'common/status-effects'
import {SlotTypeT} from 'common/types/cards'
import {useSelector} from 'react-redux'
import {
	getCardsCanBePlacedIn,
	getGameState,
	getPickRequestPickableSlots,
	getSelectedCard,
} from 'logic/game/game-selectors'
import {
	Attach,
	CardProps,
	HasHealth,
	Hermit,
	Item,
	SingleUse,
	WithoutFunctions,
} from 'common/cards/base/card'
import {LocalCardInstance} from 'common/types/server-requests'

export type SlotProps = {
	type: SlotTypeT
	rowIndex?: number
	index?: number
	playerId: string
	onClick?: () => void
	card: LocalCardInstance | null
	rowState?: LocalRowState
	active?: boolean
	cssId?: string
	statusEffects: Array<StatusEffectT>
}
const Slot = ({
	type,
	rowIndex,
	index,
	playerId,
	onClick,
	card,
	rowState,
	active,
	cssId,
	statusEffects,
}: SlotProps) => {
	const cardsCanBePlacedIn = useSelector(getCardsCanBePlacedIn)
	const pickRequestPickableCard = useSelector(getPickRequestPickableSlots)
	const selectedCard = useSelector(getSelectedCard)
	const localGameState = useSelector(getGameState)

	let cardInfo = card?.props
		? (card.props as WithoutFunctions<Hermit | Item | Attach | SingleUse | CardProps>)
		: null
	if (type === 'health' && rowState?.health) {
		// @ts-ignore SORRY, I have no idea how to fix this
		cardInfo = {
			category: 'health',
			id: 'health',
			expansion: 'default',
			numericId: -1,
			tokens: -1,
			name: 'Health Card',
			rarity: 'common',
			health: rowState?.health,
		} as HasHealth
	}
	const renderStatusEffects = (cleanedStatusEffects: StatusEffectT[]) => {
		return (
			<div className={css.statusEffectContainer}>
				{cleanedStatusEffects.map((a) => {
					const statusEffect = STATUS_EFFECT_CLASSES[a.statusEffectId]
					if (!statusEffect || !statusEffect.visible) return null
					if (statusEffect.damageEffect == true) return null
					return <StatusEffect statusEffect={statusEffect} duration={a.duration} />
				})}
			</div>
		)
	}
	const renderDamageStatusEffects = (cleanedStatusEffects: StatusEffectT[] | null) => {
		return (
			<div className={css.damageStatusEffectContainer}>
				{cleanedStatusEffects
					? cleanedStatusEffects.map((a) => {
							const statusEffect = STATUS_EFFECT_CLASSES[a.statusEffectId]
							if (!statusEffect || !statusEffect.visible) return null
							if (statusEffect.damageEffect == false) return null
							return <StatusEffect statusEffect={statusEffect} />
					  })
					: null}
			</div>
		)
	}

	const hermitStatusEffects = Array.from(
		new Set(
			statusEffects
				.filter((a) => rowState?.hermitCard && a.targetInstance == rowState.hermitCard.instance)
				.map((a) => a) || []
		)
	)
	const effectStatusEffects = Array.from(
		new Set(
			statusEffects.filter(
				(a) => rowState?.effectCard && a.targetInstance == rowState.effectCard.instance
			) || []
		)
	)
	const frameImg = type === 'hermit' ? '/images/game/frame_glow.png' : '/images/game/frame.png'

	const getPickableSlots = () => {
		if (pickRequestPickableCard !== null && pickRequestPickableCard !== undefined) {
			return pickRequestPickableCard
		}

		if (!cardsCanBePlacedIn || !selectedCard) return []

		return cardsCanBePlacedIn.filter(([card, _]) => card?.instance == selectedCard.instance)[0][1]
	}

	const getIsPickable = () => {
		for (const slot of getPickableSlots()) {
			if (
				slot.type === type &&
				slot.rowIndex == rowIndex &&
				slot.index == index &&
				slot.playerId == playerId
			) {
				return true
			}
		}
		return false
	}

	let isPickable = false
	let somethingPickable = false
	let isClickable = false

	if (
		(localGameState && localGameState.playerId === localGameState.turn.currentPlayerId) ||
		pickRequestPickableCard !== null
	) {
		isPickable = getIsPickable()
		somethingPickable = selectedCard !== null || pickRequestPickableCard !== null
		isClickable = somethingPickable && isPickable
	}

	if (card !== null) {
		isClickable = true
	}

	return (
		<div
			onClick={isClickable ? onClick : () => {}}
			id={css[cssId || 'slot']}
			className={classnames(css.slot, {
				[css.pickable]: isPickable && somethingPickable,
				[css.unpickable]: !isPickable && somethingPickable,
				[css.available]: isClickable,
				[css[type]]: true,
				[css.empty]: !cardInfo,
				[css.hermitSlot]: type == 'hermit',
				[css.afk]: !active && type !== 'single_use',
			})}
		>
			{cardInfo ? (
				<div className={css.cardWrapper}>
					<CardComponent card={cardInfo} />
					{type === 'health'
						? renderStatusEffects(hermitStatusEffects)
						: type === 'attach'
						? renderStatusEffects(effectStatusEffects)
						: null}
					{type === 'health'
						? renderDamageStatusEffects(hermitStatusEffects)
						: type === 'attach'
						? renderDamageStatusEffects(effectStatusEffects)
						: renderDamageStatusEffects(null)}
				</div>
			) : type === 'health' ? null : (
				<img draggable="false" className={css.frame} src={frameImg} />
			)}
		</div>
	)
}

export default Slot
