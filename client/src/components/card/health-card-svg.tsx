import {useState, useRef, useMemo, useEffect, memo} from 'react'
import css from './health-card-svg.module.scss'
import classnames from 'classnames'

export type HealthCardProps = {
	health: number
}

function useCountdownAnimation(value: number, duration = 500) {
	const [displayValue, setDisplayValue] = useState(value)
	const oldValueRef = useRef(value)

	const animationFrame = useMemo(() => {
		return () => {
			const start = Date.now()
			const oldValue = oldValueRef.current

			const animate = () => {
				const elapsed = Date.now() - start
				const progress = Math.min(elapsed / duration, 1)
				const newValue = value
				const diff = (oldValue - newValue) * progress
				const currentValue = oldValue - diff
				setDisplayValue(currentValue)
				if (progress < 1) {
					requestAnimationFrame(animate)
				}
			}

			requestAnimationFrame(animate)
			oldValueRef.current = value
		}
	}, [value])

	useEffect(() => {
		animationFrame()
		return () => {
			setDisplayValue(value)
		}
	}, [animationFrame, value])

	return Math.round(displayValue)
}

const HealthCardModule = memo(({health}: HealthCardProps) => {
	const displayHealth = useCountdownAnimation(health)

	return (
		<svg
			className={classnames(css.card, {
				[css.healthy]: displayHealth >= 200,
				[css.damaged]: displayHealth < 200 && displayHealth >= 100,
				[css.dying]: displayHealth < 100,
			})}
			width="100%"
			height="100%"
			viewBox="0 0 400 400"
		>
			<rect className={css.cardBackground} x="10" y="10" width="380" height="380" rx="15" ry="15" />
			<g id="type">
				<rect
					className={css.typeBackground}
					x="20"
					y="20"
					width="360"
					height="75"
					rx="15"
					ry="15"
				/>
				<text
					x="200"
					y="33"
					className={css.type}
					textAnchor="middle"
					dominantBaseline="hanging"
					key={Math.random()}
				>
					HEALTH
				</text>
			</g>
			<g>
				<ellipse className={css.healthBackground} cx="200" cy="250" rx="205" ry="130" />
				<text
					x="200"
					y="200"
					className={css.health}
					textAnchor="middle"
					dominantBaseline="hanging"
					key={Math.random()}
				>
					{displayHealth}
				</text>
			</g>
		</svg>
	)
})

export default HealthCardModule
