import {HERMIT_CARDS} from '../cards'
import {MessageTextT} from '../types/game-state'

/**
 * Guide to symbols
 * Player A - Player that generated the log | Player B - other player
 * {A|B} A shows to player A, B shows to player B
 * $h Highlight
 * $p Player A highlight
 * $o Player B highlight
 * $i Inline image
 */

function createEntry(
	text: string,
	format: MessageTextT['format'],
	condition?: 'player' | 'opponent'
): MessageTextT {
	return {
		text: text,
		censoredText: text,
		format: format,
		condition: condition ? condition : undefined,
	}
}

type MessageTreeNode = {
	getText: (
		format: MessageTextT['format'],
		condition: MessageTextT['condition']
	) => Array<MessageTextT>
}

class TextMessageTreeNode {
	private text: string

	constructor(text: string) {
		this.text = text
	}

	public getText(
		format: MessageTextT['format'],
		condition: MessageTextT['condition']
	): Array<MessageTextT> {
		return [createEntry(this.text, format, condition)]
	}
}

class FormattedMessageTreeNode {
	private format: MessageTextT['format']
	private text: MessageTreeNode

	private formatDict: Record<string, MessageTextT['format']> = {
		p: 'player',
		o: 'opponent',
		h: 'highlight',
		i: 'image',
	}

	constructor(format: string, text: MessageTreeNode) {
		this.format = this.formatDict[format]
		if (this.format == undefined) {
			throw new Error(`Format ${format} not found.`)
		}

		this.text = text
	}

	public getText(
		_: MessageTextT['format'],
		condition: MessageTextT['condition']
	): Array<MessageTextT> {
		return this.text.getText(this.format, condition)
	}
}

class CurlyBracketMessageTreeNode {
	private playerText: MessageTreeNode
	private opponentText: MessageTreeNode

	constructor(playerText: MessageTreeNode, opponentText: MessageTreeNode) {
		this.playerText = playerText
		this.opponentText = opponentText
	}

	public getText(
		format: MessageTextT['format'],
		_: MessageTextT['condition']
	): Array<MessageTextT> {
		return [
			...this.playerText.getText(format, 'player'),
			...this.opponentText.getText(format, 'opponent'),
		]
	}
}

const messageParseOptions: Record<string, (text: string) => [MessageTreeNode, string]> = {
	$: (text: string) => {
		// Expecting the format $fFormat Node$ where f is a format character
		let format = text[1]
		text = text.slice(2)

		const [innerNode, remaining] = parseSingleMessageTreeNode(text)

		if (remaining[0] !== '$') {
			throw new Error('Expected $ to close expression.')
		}

		return [new FormattedMessageTreeNode(format, innerNode), remaining.slice(1)]
	},
	'{': (text: string) => {
		// expecting the format {MesageTreeNode,|MessageTreeNode,}
		let remaining = text.slice(1)

		let firstNode;
		[firstNode, remaining] = parseSingleMessageTreeNode(remaining)

		if (remaining[0] !== '|') {
			throw new Error('Expected |')
		}

		remaining = remaining.slice(1)

		let secondNode;
		[secondNode, remaining] = parseSingleMessageTreeNode(remaining)

		if (remaining[0] !== '}') {
			throw new Error('Expected } to close expression.')
		}

		remaining = remaining.slice(1)

		return [new CurlyBracketMessageTreeNode(firstNode, secondNode), remaining]
	},
	':': (text: string) => {
		let remaining = text.slice(1)

		let emojiText: string;
		[emojiText, remaining] = parseUntil(remaining, [':'])

		if (remaining[0] !== ':') {
			throw new Error('Expected : to close expression.')
		}

		const cardInfo = Object.values(HERMIT_CARDS).find((card) => card.name === emojiText)

		if (!cardInfo) {
			return [new TextMessageTreeNode(emojiText), remaining.slice(1)]
		}

		emojiText = `images/hermits-emoji/${cardInfo.id.split('_')[0]}.png`

		return [
			new FormattedMessageTreeNode('i', new TextMessageTreeNode(emojiText)),
			remaining.slice(1),
		]
	},
}

// Parse the raw text that is part of a text mode or emoji node. Handles escape
// sequences.
function parseUntil(text: string, until: Array<string>): [string, string] {
	// We take characters until we get to something that is probably a parser
	let out = ''
	let i = 0

	let isEscaped = false;
	let nextChar: string | undefined  = text[0];
	
	while (true) {
		if (!isEscaped) {
			out += nextChar
		}
		i++;

		if (i >= text.length) {
			break
		}
		nextChar = text.at(i)
		if (nextChar == undefined) {
			break;
		}

		if (!isEscaped && until.includes(nextChar)) {
			break;
		}

		isEscaped = (nextChar === '\\');
	}

	return [out, text.slice(i)]
}

// Parse a TextMessageTreeNode
function parseTextNode(text: string): [TextMessageTreeNode, string] {
	let until = Object.keys(messageParseOptions)
	until.push(...['|', '}'])
	let remaining;
	[text, remaining] = parseUntil(text, until)
	return [new TextMessageTreeNode(text), remaining]
}

// Parse a single MessageTreeNode
function parseSingleMessageTreeNode(text: string): [MessageTreeNode, string] {
	let parser = messageParseOptions[text[0]] || parseTextNode
	return parser(text)
}

// Parse all MessageTreeNodes until the end of the string.
function parseNodesUntilEmpty(text: string): Array<MessageTreeNode> {
	let remaining = text
	let nodes = []

	while (remaining.length >= 1) {
		let node
		;[node, remaining] = parseSingleMessageTreeNode(remaining)
		nodes.push(node)
	}

	return nodes
}

export function formatLogEntry(text: string, mode?: 'log' | 'chat'): Array<MessageTextT> {
	let nodes = parseNodesUntilEmpty(text)

	let messageTextParts
	try {
		messageTextParts = nodes.flatMap((node) => node.getText('plain', undefined))
	} catch (e) {
		// TODO: Improve error format
		return [createEntry('There was a formatting error', 'plain', undefined)]
	}

	return messageTextParts
}
