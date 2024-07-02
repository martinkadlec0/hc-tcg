import React from 'react'
import {TypeT} from 'common/types/cards'
import {
	Attach,
	CardProps,
	SingleUse,
	WithoutFunctions,
	isAttach,
	isHermit,
	isItem,
	isSingleUse,
} from 'common/cards/base/card'
import css from './card-tooltip.module.scss'
import {STRENGTHS} from 'common/const/strengths'
import {getCardRank} from 'common/utils/ranks'
import {EXPANSIONS} from 'common/config'
import classNames from 'classnames'
import {STATUS_EFFECT_CLASSES} from 'common/status-effects'
import {GLOSSARY} from 'common/glossary'
import {useSelector} from 'react-redux'
import {getSettings} from 'logic/local-settings/local-settings-selectors'
import {FormattedText} from 'components/formatting/formatting'
import {formatText} from 'common/utils/formatting'

const HERMIT_TYPES: Record<string, string> = {
	balanced: 'Balanced',
	builder: 'Builder',
	speedrunner: 'Speedrunner',
	redstone: 'Redstone',
	farm: 'Farm',
	pvp: 'PvP',
	terraform: 'Terraform',
	prankster: 'Prankster',
	miner: 'Miner',
	explorer: 'Explorer',
}

type Props = {
	card: WithoutFunctions<CardProps>
}

const getDescription = (card: WithoutFunctions<Attach | SingleUse>): React.ReactNode => {
	return FormattedText(formatText(card.description))
}

const joinJsx = (array: Array<React.ReactNode>) => {
	if (array.length === 0) return <span>None</span>
	if (array.length < 2) return array
	return array.reduce((prev: any, curr: any): any => [prev, ' ', curr])
}

const getStrengthsAndWeaknesses = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (!isHermit(card)) return null

	const strengths = STRENGTHS[card.type]
	const weaknesses = Object.entries(STRENGTHS)
		.filter(([, value]) => value.includes(card.type))
		.map(([key]) => key) as Array<TypeT>

	const result = (
		<div className={css.strengthsAndWeaknesses}>
			<div className={css.strengths}>
				<span className={css.swTitle}>Strengths: </span>
				{joinJsx(
					strengths.map((type) => (
						<span key={type} className={css[type]}>
							{HERMIT_TYPES[type]}
						</span>
					))
				)}
			</div>
			<div className={css.weaknesses}>
				<span className={css.swTitle}>Weaknesses: </span>
				{joinJsx(
					weaknesses.map((type) => (
						<span key={type} className={css[type]}>
							{HERMIT_TYPES[type]}
						</span>
					))
				)}
			</div>
		</div>
	)
	return result
}

const getName = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (isItem(card)) {
		return <div className={classNames(css.name, css[card.type])}>{card.name}</div>
	}
	return <div className={css.name}>{card.name}</div>
}

const getRank = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	const name = getCardRank(card.tokens)
	const highlight = name === 'stone' || name === 'iron' ? '■' : '★'
	return (
		<div className={classNames(css.rank, css[name])}>
			{highlight} {name.charAt(0).toUpperCase() + name.slice(1)} Rank {highlight}
		</div>
	)
}

const getExpansion = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (card.expansion !== 'default') {
		const expansion = card.expansion as 'default' | 'alter_egos' | 'advent_of_tcg' | 'alter_egos_ii'
		return (
			<div className={classNames(css.expansion, css[expansion])}>
				■ {EXPANSIONS.expansions[expansion]} Card ■
			</div>
		)
	}
}

const getAttach = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (!isAttach(card)) return null
	return <div className={css.attach}>Attach</div>
}

const getSingleUse = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (!isSingleUse(card)) return null
	return <div className={css.singleUse}>Single Use</div>
}

const gettype = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	if (isHermit(card)) {
		return (
			<div className={classNames(css.type, css[card.type])}>
				{HERMIT_TYPES[card.type] || card.type} Type
			</div>
		)
	}
	return null
}

const getSidebarDescriptions = (card: WithoutFunctions<CardProps>): React.ReactNode => {
	return (card.sidebarDescriptions || []).map((description, i) => {
		if (description.type === 'statusEffect') {
			const statusEffect = description.name
			return (
				<div key={i} className={classNames(css.cardTooltip, css.small)}>
					<b>
						<u>{STATUS_EFFECT_CLASSES[statusEffect].name}</u>
					</b>
					<p>{STATUS_EFFECT_CLASSES[statusEffect].description}</p>
				</div>
			)
		}
		if (description.type === 'glossary') {
			const glossaryItem = description.name
			return (
				<div key={i} className={classNames(css.cardTooltip, css.small)}>
					<b>
						<u>{GLOSSARY[glossaryItem].name}</u>
					</b>
					<p>{GLOSSARY[glossaryItem].description}</p>
				</div>
			)
		}
	})
}

const CardInstanceTooltip = ({card}: Props) => {
	const settings = useSelector(getSettings)

	return (
		<div className={css.cardTooltipContainer}>
			{settings.showAdvancedTooltips === 'on' && (
				<div className={css.tooltipBelow}>{getSidebarDescriptions(card)}</div>
			)}
			<div className={css.cardTooltip}>
				<div className={css.topLine}>
					{getName(card)}
					{gettype(card)}
					{getAttach(card)}
					{getSingleUse(card)}
				</div>
				<div className={css.description}>
					{getExpansion(card)}
					{getRank(card)}
					{getStrengthsAndWeaknesses(card)}
					{(isAttach(card) || isSingleUse(card)) && getDescription(card)}
				</div>
				<div></div>
			</div>
		</div>
	)
}

export default CardInstanceTooltip
