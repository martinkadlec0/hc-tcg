import ProfaneWords from '../config/profanity-seed.json'

/* Config object used by `formatedText`. */
export type Config = {
	/* If true, censor the text using the list common/config/profanity-seed.json. */
	censor?: boolean
	/* If true, allow $$ formatting to be used. */
	'enable-$'?: boolean
}

export type Format =
	| 'player'
	| 'opponent'
	| 'effect'
	| 'item'
	| 'attack'
	| 'good'
	| 'bad'
	| 'italic'
	| 'bold'
	| 'keyword'

export type FormattedTextNode =
	| ListNode
	| EmptyNode
	| TextNode
	| FormatNode
	| DifferentTextNode
	| ProfanityNode
	| EmojiNode
	| LineBreakNode
	| LineNode
	| TabNode

export type ListNode = {
	TYPE: 'ListNode'

	nodes: FormattedTextNode[]
}
export function ListNode(nodes: FormattedTextNode[]): ListNode {
	return {
		TYPE: 'ListNode',
		nodes,
	}
}

export type EmptyNode = {
	TYPE: 'EmptyNode'
}
export function EmptyNode(): EmptyNode {
	return {TYPE: 'EmptyNode'}
}

export type TextNode = {
	TYPE: 'TextNode'

	text: string
}
export function TextNode(text: string): TextNode {
	return {TYPE: 'TextNode', text}
}

export type FormatNode = {
	TYPE: 'FormatNode'

	format: Format
	text: FormattedTextNode
}
export function FormatNode(format: Format, text: FormattedTextNode): FormatNode {
	return {
		TYPE: 'FormatNode',
		format,
		text,
	}
}

const formatDict: Record<string, Format> = {
	p: 'player',
	o: 'opponent',
	e: 'effect',
	m: 'item',
	v: 'attack',
	g: 'good',
	b: 'bad',
	k: 'keyword',
}
export function formatNodefromShorthand(
	formatShorthand: string,
	text: FormattedTextNode
): FormatNode {
	const format = formatDict[formatShorthand]
	if (format == undefined) {
		throw new Error(`Format ${format} not found.`)
	}
	return {TYPE: 'FormatNode', format, text}
}

export type DifferentTextNode = {
	TYPE: 'DifferentTextNode'

	playerText: FormattedTextNode
	opponentText: FormattedTextNode
}
export function DifferentTextNode(
	playerText: FormattedTextNode,
	opponentText: FormattedTextNode
): DifferentTextNode {
	return {
		TYPE: 'DifferentTextNode',
		playerText,
		opponentText,
	}
}

export type EmojiNode = {
	TYPE: 'EmojiNode'

	emoji: string
}
export function EmojiNode(emoji: string): EmojiNode {
	return {
		TYPE: 'EmojiNode',
		emoji,
	}
}

export type ProfanityNode = {
	TYPE: 'ProfanityNode'

	text: string
}
export function ProfanityNode(text: string): ProfanityNode {
	return {
		TYPE: 'ProfanityNode',
		text,
	}
}

export function censorProfanityNode(node: ProfanityNode) {
	return '*'.repeat(node.text.length)
}

export type LineBreakNode = {
	TYPE: 'LineBreakNode'
}
export function LineBreakNode(): LineBreakNode {
	return {TYPE: 'LineBreakNode'}
}

export type LineNode = {
	TYPE: 'LineNode'
}
export function LineBreak(): LineNode {
	return {TYPE: 'LineNode'}
}

export type TabNode = {
	TYPE: 'TabNode'
}
export function TabNode(): TabNode {
	return {TYPE: 'TabNode'}
}

// The special characters that can end an expression.
const SPECIAL_CHARACTERS = [...'${}|*:\n\t']

const messageParseOptions: Array<
	[
		(text: string, config: Config) => boolean,
		(text: string, config: Config) => [FormattedTextNode, string]
	]
> = [
	[
		(text: string, config: Config) => {
			if (config['enable-$'] === undefined || config['enable-$'] === true) {
				return text.startsWith('$')
			}
			return false
		},
		(text: string, config: Config) => {
			// Expecting the format $fFormat Node$ where f is a format character
			const format = text[1]
			text = text.slice(2)

			const [node, remaining] = parseNodesUntil(
				text,
				(remaining) => remaining.startsWith('$'),
				config
			)

			if (node.TYPE === 'EmptyNode') {
				throw new Error('Expected an expression, not $')
			}

			if (remaining.length == 0 || remaining[0] != '$') {
				throw new Error('Expected $')
			}

			return [formatNodefromShorthand(format, node), remaining.slice(1)]
		},
	],
	[
		(text: string, _: Config) => text.startsWith('{'),
		(text: string, config: Config) => {
			// expecting the format {MesageTreeNode,|Node,}
			let remaining = text.slice(1)

			let firstNode
			;[firstNode, remaining] = parseSingleNode(remaining, config)

			if (remaining[0] !== '|') {
				throw new Error('Expected |')
			}

			remaining = remaining.slice(1)

			let secondNode
			;[secondNode, remaining] = parseSingleNode(remaining, config)

			if (remaining[0] !== '}') {
				throw new Error('Expected } to close expression.')
			}

			remaining = remaining.slice(1)

			return [DifferentTextNode(firstNode, secondNode), remaining]
		},
	],
	[
		(text: string, _: Config) => text.startsWith('**'),
		(text: string, config: Config) => {
			// There is no bold because the string isn't long enough.
			if (text.length == 2) {
				return parseTextNode(text, config)
			}

			// If there is no set of ** in the rest of the message, continue like this is regular text
			if (!includesNotEscaped(text.slice(2), '**')) {
				return parseTextNode(text, config)
			}

			// Otherwise lets parse a bold node list
			let [nodes, remaining] = parseNodesUntil(
				text.slice(2),
				(remaining) => remaining.startsWith('**'),
				config
			)
			remaining = remaining.slice(2)
			return [FormatNode('bold', nodes || EmptyNode()), remaining]
		},
	],
	[
		(text: string) => text.startsWith('*'),
		(text: string, config: Config) => {
			// There is no italic because the string isn't long enough.
			if (text.length == 1) {
				return parseTextNode(text, config)
			}

			// If there is no * in the rest of the message, continue like this is regular text
			if (!includesNotEscaped(text.slice(1), '*')) {
				return parseTextNode(text, config)
			}

			// Otherwise we parse a italic node list.
			let [nodes, remaining] = parseNodesUntil(
				text.slice(1),
				(remaining) => remaining.startsWith('*'),
				config
			)
			remaining = remaining.slice(1)
			return [FormatNode('italic', nodes || EmptyNode()), remaining]
		},
	],
	[
		(text: string, _: Config) => text.startsWith(':'),
		(text: string, _: Config) => {
			let remaining = text.slice(1)

			let emojiText: string
			;[emojiText, remaining] = parseUntil(remaining, [':'])

			if (remaining[0] !== ':') {
				throw new Error('Expected : to close expression.')
			}

			return [EmojiNode(emojiText), remaining.slice(1)]
		},
	],
	[
		(text: string, _: Config) => text.startsWith('\n'),
		(text: string, _: Config) => {
			return [LineBreakNode(), text.slice(1)]
		},
	],
	[
		(text: string, _: Config) => text.startsWith('\t'),
		(text: string, _: Config) => {
			return [TabNode(), text.slice(1)]
		},
	],
	[(_) => true, parseTextNode],
]

function includesNotEscaped(text: string, sequence: string): boolean {
	const index = text.indexOf(sequence)
	if (index == -1) {
		return false
	}

	if (index == 0) {
		return true
	}

	if (text[index - 1] == '\\') {
		return false
	}

	return true
}

function isAlphanumeric(char: string) {
	const charCode = char.charCodeAt(0)
	return (
		(charCode > 47 && charCode < 58) ||
		(charCode > 64 && charCode < 91) ||
		(charCode > 96 && charCode < 123)
	)
}

function createCensoredTextNodes(text: string): TextNode | ProfanityNode | ListNode {
	const nodes = []

	let lowercaseText = text.toLowerCase()

	for (const word of ProfaneWords) {
		while (true) {
			const startIndex = lowercaseText.indexOf(word)

			if (startIndex == -1) {
				break
			}

			let isSpaceBefore = true
			if (startIndex >= 1) {
				if (isAlphanumeric(text[startIndex - 1])) {
					isSpaceBefore = false
				}
			}

			let isSpaceAfter = true
			if (startIndex + word.length <= text.length - 1) {
				if (isAlphanumeric(text[startIndex + word.length])) {
					isSpaceAfter = false
				}
			}

			const textBefore = text.slice(0, startIndex)

			if (isSpaceBefore && isSpaceAfter) {
				if (textBefore.length > 0) {
					nodes.push(TextNode(textBefore))
				}
				nodes.push(ProfanityNode(text.slice(startIndex, startIndex + word.length)))
			} else {
				nodes.push(TextNode(text.slice(0, startIndex + word.length)))
			}

			text = text.slice(startIndex + word.length)
			lowercaseText = lowercaseText.slice(startIndex + word.length)
		}
	}

	if (nodes.length != 0) {
		if (text.length !== 0) {
			nodes.push(TextNode(text))
		}
		if (nodes.length === 1) {
			return nodes[0]
		}
		return ListNode(nodes)
	}

	return TextNode(text)
}

/* Parse the raw text that is part of a text mode or emoji node, handling escape sequences. */
function parseUntil(text: string, until: Array<string>): [string, string] {
	// We take characters until we get to something that is probably a parser
	let out = ''
	let i = 0

	let isEscaped = text[0] == '\\'
	let nextChar: string | undefined = text[0]

	while (true) {
		if (!isEscaped) {
			out += nextChar
		}
		i++

		if (i >= text.length) {
			break
		}
		nextChar = text.at(i)
		if (nextChar == undefined) {
			break
		}

		if (!isEscaped && until.includes(nextChar)) {
			break
		}

		isEscaped = nextChar === '\\'
	}

	if (text[text.length - 1] == '\\') {
		out += '\\'
	}

	return [out, text.slice(i)]
}

// Parse nodes until a predicate matches, or there is an error
function parseNodesWhile(
	text: string,
	matches: (remaining: string) => boolean,
	config: Config
): [FormattedTextNode, string] {
	let remaining = text
	const nodes: FormattedTextNode[] = []

	try {
		while (true) {
			if (!matches(remaining)) {
				break
			}

			if (remaining.length === 0) {
				throw new Error('Ran out of text when parsing (Unexpected EOF).')
			}

			let node
			;[node, remaining] = parseSingleNode(remaining, config)
			nodes.push(node)
		}
	} catch (e) {
		if (remaining.length != 0) {
			nodes.push(TextNode(remaining))
			remaining = ''
		}
	}

	let formatNode: FormattedTextNode
	if (nodes.length == 0) {
		formatNode = EmptyNode()
	} else if (nodes.length == 1) {
		formatNode = nodes[0]
	} else {
		formatNode = ListNode(nodes)
	}

	return [formatNode, remaining]
}

function parseNodesUntil(
	text: string,
	matches: (remaining: string) => boolean,
	config: Config
): [FormattedTextNode, string] {
	return parseNodesWhile(text, (remaining) => !matches(remaining), config)
}

/* Parse all Nodes until the end of the string. */
function parseNodesUntilEmpty(text: string, config: Config): FormattedTextNode {
	const [nodes, _] = parseNodesWhile(text, (remaining) => remaining.length >= 1, config)
	return nodes
}

/* Parse a TextNode */
function parseTextNode(text: string, config: Config): [FormattedTextNode, string] {
	let remaining
	;[text, remaining] = parseUntil(text, SPECIAL_CHARACTERS)

	let textNodes: FormattedTextNode
	if (config.censor) {
		textNodes = createCensoredTextNodes(text)
	} else {
		textNodes = TextNode(text)
	}

	return [textNodes, remaining]
}

/* Parse text into a single node */
function parseSingleNode(text: string, config: Config): [FormattedTextNode, string] {
	for (const [condition, parser] of messageParseOptions) {
		if (condition(text, config)) {
			return parser(text, config)
		}
	}
	throw new Error(`No matching parser found for \`${text}\``)
}

/**
 * Format a text
 *
 * Guide to symbols
 * Player A - Player that generated the log | Player B - other player
 * {A|B} A shows to player A, B shows to player B
 * $p Player
 * $o Opponent
 * $e Effect card
 * $m Item card
 * $v Hermit attack
 * $g Good (healing, heads)
 * $b Bad (damage, tails)
 * $i Image
 * $k Keyword
 *
 * All symbols can be escaped with backslash.
 *
 * @param text - The text to format
 * @param config - The config as a dict.
 * @return The formatted text.
 */
export function formatText(text: string, config?: Config): FormattedTextNode {
	config = config || {}

	try {
		return parseNodesUntilEmpty(text, config)
	} catch (e) {
		return TextNode('There was a unrecoverable formatting error')
	}
}

/* Censor a string using `common/config/profanity-seed.json`. */
export function censorString(text: string) {
	const node = createCensoredTextNodes(text)

	if (node.TYPE === 'TextNode') {
		return node.text
	} else if (node.TYPE === 'ProfanityNode') {
		return censorProfanityNode(node)
	}

	const outputText = []

	const listNode = node as ListNode
	for (const textNode of listNode.nodes) {
		if (textNode.TYPE === 'TextNode') {
			outputText.push(textNode.text)
		} else if (textNode.TYPE === 'ProfanityNode') {
			outputText.push(censorProfanityNode(textNode))
		}
	}

	return outputText.join('')
}

/* Concat a list of formatted `FormattedTextNode` into a single `FormattedTextNode */
export function concatFormattedTextNodes(...nodes: Array<FormattedTextNode>): ListNode {
	return ListNode(nodes)
}
