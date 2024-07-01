import {VirtualAI} from './virtual-action'
import ExBossAI from './exboss-ai'

const aiClasses: Array<VirtualAI> = [new ExBossAI()]

export const AI_CLASSES: Record<string, VirtualAI> = aiClasses.reduce(
	(result: Record<string, VirtualAI>, ai) => {
		result[ai.id] = ai
		return result
	},
	{}
)

export {default as virtualPlayerActionSaga} from './virtual-action'
