import classnames from 'classnames'
import HermitCard from '../../../../common/cards/base/hermit-card'
import css from './hermit-card-svg.module.scss'
import {useSelector} from 'react-redux'
import {getGameState} from 'logic/game/game-selectors'
import {getCardRank} from 'common/utils/ranks'
import {EXPANSIONS, PERMIT_RANKS} from 'common/config'

export type HermitCardProps = {
	card: HermitCard
	canShowAsGray: boolean
	obtainedPermits: Array<string>
}

const COST_PAD = 20
const COST_SIZE = 28
const COST_X = [
	[COST_PAD + COST_SIZE],
	[COST_PAD + COST_SIZE / 2, COST_PAD + COST_SIZE + COST_SIZE / 2],
	[COST_PAD, COST_PAD + COST_SIZE, COST_PAD + COST_SIZE * 2],
]

function getRank(cardId: string) {
	if (PERMIT_RANKS.diamond.includes(cardId)) return 'diamond'
	if (PERMIT_RANKS.gold.includes(cardId)) return 'gold'
	if (PERMIT_RANKS.iron.includes(cardId)) return 'iron'
	return 'free'
}

const HermitCardModule = ({card, canShowAsGray, obtainedPermits}: HermitCardProps) => {
	const hermitFullName = card.id.split('_')[0]

	const palette = card.getPalette()
	const backgroundName = card.getBackground()
	const nameLength = card.name.length

	const thisRank = getRank(card.id)
	const disabled =
		thisRank === 'free' || obtainedPermits.includes(card.id) || !canShowAsGray
			? 'enabled'
			: 'disabled'

	return (
		<svg className={classnames(css.card)} width="100%" height="100%" viewBox="0 0 400 400">
			<defs>
				<clipPath id="myClip">
					<rect x="55" y="70" width="290" height="178" />
				</clipPath>
			</defs>
			<g id="real-card" className={classnames(css[disabled])}>
				<rect
					className={classnames(css.cardBackground, css[palette])}
					x="10"
					y="10"
					width="380"
					height="380"
					rx="15"
					ry="15"
				/>
				<text
					x="45"
					y="20"
					textLength={nameLength > 7 ? '180px' : ''}
					lengthAdjust="spacingAndGlyphs"
					className={classnames(css.name, css[palette])}
					dominantBaseline="hanging"
					key={Math.random()}
				>
					{card.name}
				</text>
				<text
					x="310"
					y="20"
					className={css.health}
					textAnchor="middle"
					dominantBaseline="hanging"
					key={Math.random()}
				>
					{card.health}
				</text>
				<g id="hermit-image">
					<rect x="45" y="60" fill="white" width="310" height="196" />
					<image
						href={`/images/backgrounds/${backgroundName}.png`}
						x="55"
						y="70"
						width="290"
						clipPath="url(#myClip)"
					/>
					<image
						className={css.hermitImage}
						href={`/images/hermits-nobg/${hermitFullName}.png`}
						x="55"
						y="70"
						width="290"
						clipPath="url(#myClip)"
					/>
				</g>
				<g id="hermit-type">
					<rect
						className={css.hermitTypeBackground}
						x="315"
						y="-5"
						width="100"
						height="100"
						rx="50"
						ry="50"
					/>
					<image
						x="327"
						y="12"
						width="68"
						height="68"
						href={`/images/types/type-${card.hermitType}.png`}
						className={css.hermitType}
					/>
				</g>
				<g id="hermit-attacks" className={css.hermitAttacks}>
					<g>
						{card.primary.cost.map((type: string, i: number) => (
							<image
								key={i}
								href={`/images/types/type-${type}.png`}
								x={COST_X[card.primary.cost.length - 1][i]}
								y="273"
								width={COST_SIZE}
								height={COST_SIZE}
								className={classnames(css.attackItems, css[palette], css[type])}
							/>
						))}
					</g>
					<text
						x="200"
						y="272"
						className={classnames(css.attackName, css[palette])}
						textAnchor="middle"
						dominantBaseline="hanging"
						key={Math.random()}
					>
						{card.primary.name}
					</text>
					<text
						x="380"
						y="270"
						className={classnames(css.attackDamage, css[palette], {
							[css.specialMove]: !!card.primary.power,
						})}
						textAnchor="middle"
						dominantBaseline="hanging"
						key={Math.random()}
					>
						{card.primary.damage === 0 ? '00' : card.primary.damage}
					</text>
					<rect x="20" y="315" width="360" height="10" fill="white" />
					{card.secondary.cost.map((type: string, i: number) => (
						<image
							key={i}
							href={`/images/types/type-${type}.png`}
							x={COST_X[card.secondary.cost.length - 1][i]}
							y="343"
							width={COST_SIZE}
							height={COST_SIZE}
							className={classnames(css.attackItems, css[palette], css[type])}
						/>
					))}
					<text
						x="200"
						y="342"
						className={classnames(css.attackName, css[palette], css[palette], {
							[css.specialMove]: !!card.secondary.power,
						})}
						textAnchor="middle"
						dominantBaseline="hanging"
						key={Math.random()}
					>
						{card.secondary.name}
					</text>
					<text
						x="380"
						y="340"
						className={classnames(css.attackDamage, css[palette], {
							[css.specialMove]: !!card.secondary.power,
						})}
						textAnchor="middle"
						dominantBaseline="hanging"
						key={Math.random()}
					>
						{card.secondary.damage === 0 ? '00' : card.secondary.damage}
					</text>
				</g>
			</g>
			{thisRank !== 'free' ? (
				<g>
					<image
						x="68"
						y="80"
						width="70"
						height="140"
						href={`/images/ranks/${thisRank}_banner.png`}
						className={css.rank}
					/>
				</g>
			) : null}
		</svg>
	)
}

export default HermitCardModule
