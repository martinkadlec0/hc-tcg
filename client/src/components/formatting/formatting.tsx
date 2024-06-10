import {FormattedTextNode, censorProfanityNode} from 'common/utils/formatting'
import css from './formatting.module.scss'
import classNames from 'classnames'

type DisplaySettings = {
	isSelectable?: boolean
	isOpponent?: boolean
	censorProfanity?: boolean
}

function nodeToHtml(node: FormattedTextNode, settings: DisplaySettings) {
	const textCssClasses = []

	if (settings.isSelectable != false) {
		textCssClasses.push(css['selectable'])
	}

	if (node.TYPE == 'ListNode') {
		const html = []

		for (const child of node.nodes) {
			html.push(nodeToHtml(child, settings))
		}
		return <span>{html}</span>
	} else if (node.TYPE == 'EmptyNode') {
		return <div />
	} else if (node.TYPE == 'TextNode') {
		return <span className={classNames(...textCssClasses)}>{node.text}</span>
	} else if (node.TYPE == 'FormatNode') {
		return (
			<span
				className={classNames(
					css[node.format],
					settings.isOpponent ? css.viewedByOpponent : '',
					...textCssClasses
				)}
			>
				{nodeToHtml(node.text, settings)}
			</span>
		)
	} else if (node.TYPE == 'DifferentTextNode') {
		return (
			<span className={classNames(...textCssClasses)}>
				{settings.isOpponent
					? nodeToHtml(node.opponentText, settings)
					: nodeToHtml(node.playerText, settings)}
			</span>
		)
	} else if (node.TYPE == 'ProfanityNode') {
		if (settings.censorProfanity) {
			return <span className={classNames(...textCssClasses)}> {censorProfanityNode(node)} </span>
		}
		return <span className={classNames(...textCssClasses)}>{node.text}</span>
	} else if (node.TYPE == 'EmojiNode') {
		const link = `/images/hermits-emoji/${node.emoji.toLowerCase()}.png`
		const alt = `:${node.emoji}:`

		return <img className={classNames(css.emoji, ...textCssClasses)} src={link} alt={alt} />
	} else if (node.TYPE == 'LineBreakNode') {
		return <br />
	} else if (node.TYPE == 'TabNode') {
		return <span className={css.tab}></span>
	} else if (node.TYPE == 'LineNode') {
		return <span className={css.line} />
	}
}

export const FormattedText = (text: FormattedTextNode | undefined, settings?: DisplaySettings) => {
	settings = settings || {}
	if (!text) return <span />

	return nodeToHtml(text, settings)
}
