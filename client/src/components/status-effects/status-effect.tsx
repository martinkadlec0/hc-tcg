import cn from 'classnames'
import css from './status-effect.module.scss'
import Tooltip from 'components/tooltip'
import StatusEffectTooltip from './status-effect-tooltip'
import StatusEffectClass from 'common/status-effects/status-effect'

interface StatusEffectProps
	extends React.DetailedHTMLProps<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	statusEffect: StatusEffectClass
	duration?: number | undefined
}

const StatusEffect = (props: StatusEffectProps) => {
	const {id, damageEffect, visible} = props.statusEffect

	const extension = ['sleeping', 'poison', 'fire', 'exboss-nine'].includes(id) ? '.gif' : '.png'
	const statusEffectClass =
		damageEffect == true ? css.damageStatusEffectImage : css.statusEffectImage

	return (
		<Tooltip
			tooltip={<StatusEffectTooltip statusEffect={props.statusEffect} duration={props.duration} />}
		>
			<div className={css.statusEffect}>
				<img className={statusEffectClass} src={'/images/status/' + id + extension}></img>
				{props.duration !== undefined && <p className={css.durationIndicator}>{props.duration}</p>}
			</div>
		</Tooltip>
	)
}

export default StatusEffect
