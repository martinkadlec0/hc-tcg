import cn from 'classnames'
import css from './card.module.scss'
import Tooltip from 'components/tooltip'
import CardInstanceTooltip from './card-tooltip'
import HermitCardModule, {HermitCardProps} from './hermit-card-svg'
import EffectCardModule, {EffectCardProps} from './effect-card-svg'
import ItemCardModule, {ItemCardProps} from './item-card-svg'
import HealthCardModule from './health-card-svg'
import {CardProps, WithoutFunctions} from 'common/cards/base/card'

interface CardReactProps
	extends React.DetailedHTMLProps<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	card: WithoutFunctions<CardProps>
	selected?: boolean
	picked?: boolean
	unpickable?: boolean
	tooltipAboveModal?: boolean
	onClick?: () => void
}

const Card = (props: CardReactProps) => {
	const {category} = props.card
	const {onClick, selected, picked, unpickable, ...otherProps} = props
	let card = null
	if (category === 'hermit') card = <HermitCardModule {...(otherProps as HermitCardProps)} />
	else if (category === 'item') card = <ItemCardModule {...(otherProps as ItemCardProps)} />
	else if (['attach', 'single_use'].includes(category))
		card = <EffectCardModule {...(otherProps as EffectCardProps)} />
	else if ('health' in otherProps.card) {
		let health = otherProps.card.health as number
		card = <HealthCardModule {...{health: health}} />
	} else throw new Error('Unsupported card type: ' + category)

	return (
		<Tooltip
			tooltip={<CardInstanceTooltip card={props.card} />}
			showAboveModal={props.tooltipAboveModal}
		>
			<button
				className={cn(props.className, css.card, {
					[css.selected]: selected,
					[css.picked]: picked,
					[css.unpickable]: unpickable,
				})}
				onClick={unpickable ? () => {} : onClick}
			>
				{card}
			</button>
		</Tooltip>
	)
}

export default Card
