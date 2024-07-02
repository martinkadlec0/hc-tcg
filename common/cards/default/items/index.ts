import BuilderCommonItemCard from './builder-common'
import BuilderRareItemCard from './builder-rare'
import BalancedCommonItemCard from './balanced-common'
import BalancedRareItemCard from './balanced-rare'
import RedstoneCommonItemCard from './redstone-common'
import RedstoneRareItemCard from './redstone-rare'
import PranksterCommonItemCard from './prankster-common'
import PranksterRareItemCard from './prankster-rare'
import ExplorerCommonItemCard from './explorer-common'
import ExplorerRareItemCard from './explorer-rare'
import FarmCommonItemCard from './farm-common'
import FarmRareItemCard from './farm-rare'
import PvPCommonItemCard from './pvp-common'
import PvPRareItemCard from './pvp-rare'
import SpeedrunnerCommonItemCard from './speedrunner-common'
import SpeedrunnerRareItemCard from './speedrunner-rare'
import TerraformCommonItemCard from './terraform-common'
import TerraformRareItemCard from './terraform-rare'
import MinerCommonItemCard from './miner-common'
import MinerRareItemCard from './miner-rare'
import Card from '../../base/card'

const itemCardClasses: Array<Card> = [
	new BuilderCommonItemCard(),
	new BuilderRareItemCard(),
	new BalancedCommonItemCard(),
	new BalancedRareItemCard(),
	new RedstoneCommonItemCard(),
	new RedstoneRareItemCard(),
	new PranksterCommonItemCard(),
	new PranksterRareItemCard(),
	new ExplorerCommonItemCard(),
	new ExplorerRareItemCard(),
	new FarmCommonItemCard(),
	new FarmRareItemCard(),
	new PvPCommonItemCard(),
	new PvPRareItemCard(),
	new SpeedrunnerCommonItemCard(),
	new SpeedrunnerRareItemCard(),
	new TerraformCommonItemCard(),
	new TerraformRareItemCard(),
	new MinerCommonItemCard(),
	new MinerRareItemCard(),
]

export default itemCardClasses
