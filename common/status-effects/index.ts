import StatusEffect from './status-effect'
import FireStatusEffect from './fire'
import PoisonStatusEffect from './poison'
import SleepingStatusEffect from './sleeping'
import BadOmenStatusEffect from './badomen'
import SlownessStatusEffect from './slowness'
import WeaknessStatusEffect from './weakness'
import ProtectedStatusEffect from './protected'
import DyedStatusEffect from './dyed'
import MuseumCollectionStatusEffect from './museum-collection'
import SmeltingStatusEffect from './smelting'
import MelodyStatusEffect from './melody'
import ExBossNineStatusEffect from './exboss-nine'
import UsedClockStatusEffect from './used-clock'

const effectClasses: Array<StatusEffect> = [
	new FireStatusEffect(),
	new PoisonStatusEffect(),
	new SleepingStatusEffect(),
	new BadOmenStatusEffect(),
	new SlownessStatusEffect(),
	new WeaknessStatusEffect(),
	new ProtectedStatusEffect(),
	new DyedStatusEffect(),
	new MuseumCollectionStatusEffect(),
	new SmeltingStatusEffect(),
	new MelodyStatusEffect(),
	new ExBossNineStatusEffect(),
	new UsedClockStatusEffect(),
]

export const STATUS_EFFECT_CLASSES: Record<string, StatusEffect> = effectClasses.reduce(
	(result: Record<string, StatusEffect>, card) => {
		result[card.id] = card
		return result
	},
	{}
)
