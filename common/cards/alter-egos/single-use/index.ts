import TridentSingleUseCard from './trident'
import SweepingEdgeSingleUseCard from './sweeping-edge'
import AnvilSingleUseCard from './anvil'
import PotionOfSlownessSingleUseCard from './potion-of-slowness'
import PotionOfWeaknessSingleUseCard from './potion-of-weakness'
import EggSingleUseCard from './egg'
import EnderPearlSingleUseCard from './ender-pearl'
import LadderSingleUseCard from './ladder'
import BadOmenSingleUseCard from './bad-omen'
import FireChargeSingleUseCard from './fire-charge'
import PistonSingleUseCard from './piston'
import SplashPotionOfHealingIISingleUseCard from './splash-potion-of-healing-ii'
import TargetBlockSingleUseCard from './target-block'
import Card from '../../base/card'

const singleUseCardClasses: Array<Card> = [
	new AnvilSingleUseCard(),
	new BadOmenSingleUseCard(),
	new EggSingleUseCard(),
	new EnderPearlSingleUseCard(),
	new FireChargeSingleUseCard(),
	new LadderSingleUseCard(),
	new PistonSingleUseCard(),
	new PotionOfSlownessSingleUseCard(),
	new PotionOfWeaknessSingleUseCard(),
	new SplashPotionOfHealingIISingleUseCard(),
	new SweepingEdgeSingleUseCard(),
	new TargetBlockSingleUseCard(),
	new TridentSingleUseCard(),
]

export default singleUseCardClasses
